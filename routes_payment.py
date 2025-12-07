"""
支付相关路由
包含创建订单、查询订单、支付回调等功能
"""
from flask import request, jsonify, redirect, url_for, session
from flask_login import login_required, current_user
from datetime import datetime, timedelta
import uuid
import json
import logging

from models import db
from models_membership import PaymentTransaction, UserMembership, MembershipTier
from membership_utils import check_tier_availability, increment_tier_sold_count
from utils.payment_alipay import get_alipay_client, is_alipay_configured
from utils.security import sanitize_input

logger = logging.getLogger(__name__)


def register_payment_routes(app, csrf):
    """注册支付相关路由"""
    
    @app.route('/api/payment/create', methods=['POST'])
    @csrf.exempt
    @login_required
    def create_payment():
        """创建支付订单"""
        try:
            data = request.json
            tier_id = data.get('tier_id')
            payment_method = data.get('payment_method', 'alipay')
            
            if not tier_id:
                return jsonify({'error': '缺少套餐ID'}), 400
            
            # 检查支付宝是否已配置
            if payment_method == 'alipay' and not is_alipay_configured():
                return jsonify({
                    'error': '支付功能暂未开通，请联系管理员',
                    'payment_not_configured': True
                }), 503
            
            # 检查套餐是否可用
            available, message = check_tier_availability(tier_id)
            if not available:
                return jsonify({
                    'error': message,
                    'sold_out': True
                }), 410
            
            # 获取套餐信息
            tier = MembershipTier.query.get(tier_id)
            if not tier:
                return jsonify({'error': '套餐不存在'}), 404
            
            if tier.code == 'free':
                return jsonify({'error': '免费套餐无需购买'}), 400
            
            # 生成订单号
            transaction_id = f"EDU{datetime.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:12].upper()}"
            
            # 计算订单过期时间
            expires_at = datetime.utcnow() + timedelta(minutes=15)
            
            # 创建支付交易记录
            payment = PaymentTransaction(
                user_id=current_user.id,
                transaction_id=transaction_id,
                amount=tier.price,
                currency='CNY',
                payment_method=payment_method,
                tier_id=tier_id,
                status='pending',
                note=f'购买{tier.name}',
                expires_at=expires_at
            )
            
            db.session.add(payment)
            db.session.flush()  # 获取payment.id
            
            # 如果是限量套餐，锁定库存
            if tier.is_limited:
                success = increment_tier_sold_count(tier_id)
                if not success:
                    db.session.rollback()
                    return jsonify({'error': '套餐已售罄'}), 410
            
            # 创建支付URL
            if payment_method == 'alipay':
                try:
                    alipay_client = get_alipay_client()
                    
                    # 判断是否移动端
                    user_agent = request.headers.get('User-Agent', '').lower()
                    is_mobile = any(x in user_agent for x in ['mobile', 'android', 'iphone', 'ipad'])
                    
                    # 创建支付订单
                    subject = f"Edu-Pilot教育协控系统 - {tier.name}"
                    body = f"购买{tier.name}会员，有效期{tier.duration_days}天"
                    
                    if is_mobile:
                        payment_url = alipay_client.create_wap_payment(
                            transaction_id,
                            tier.price,
                            subject,
                            body
                        )
                    else:
                        payment_url = alipay_client.create_web_payment(
                            transaction_id,
                            tier.price,
                            subject,
                            body
                        )
                    
                    # 保存支付URL
                    payment.payment_url = payment_url
                    db.session.commit()
                    
                    logger.info(f"创建支付订单成功: {transaction_id}, 用户: {current_user.username}, 套餐: {tier.name}")
                    
                    return jsonify({
                        'success': True,
                        'order_id': transaction_id,
                        'payment_url': payment_url,
                        'amount': tier.price,
                        'tier_name': tier.name,
                        'expires_at': expires_at.strftime('%Y-%m-%d %H:%M:%S'),
                        'expires_in': 900  # 15分钟
                    }), 200
                    
                except Exception as e:
                    db.session.rollback()
                    logger.error(f"创建支付宝订单失败: {str(e)}")
                    return jsonify({'error': f'创建支付失败: {str(e)}'}), 500
            
            else:
                db.session.rollback()
                return jsonify({'error': '不支持的支付方式'}), 400
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"创建支付订单错误: {str(e)}")
            return jsonify({'error': f'创建订单失败: {str(e)}'}), 500
    
    
    @app.route('/api/payment/query/<order_id>', methods=['GET'])
    @csrf.exempt
    @login_required
    def query_payment(order_id):
        """查询订单状态"""
        try:
            # 从数据库查询订单
            payment = PaymentTransaction.query.filter_by(
                transaction_id=order_id,
                user_id=current_user.id
            ).first()
            
            if not payment:
                return jsonify({'error': '订单不存在'}), 404
            
            # 如果订单已完成，直接返回
            if payment.status == 'completed':
                return jsonify({
                    'status': 'completed',
                    'order_id': payment.transaction_id,
                    'amount': payment.amount,
                    'paid_at': payment.completed_at.strftime('%Y-%m-%d %H:%M:%S') if payment.completed_at else None
                }), 200
            
            # 检查订单是否过期
            if payment.expires_at and datetime.utcnow() > payment.expires_at:
                if payment.status == 'pending':
                    payment.status = 'expired'
                    db.session.commit()
                
                return jsonify({
                    'status': 'expired',
                    'order_id': payment.transaction_id,
                    'message': '订单已过期'
                }), 200
            
            # 从支付宝查询订单状态
            if payment.payment_method == 'alipay':
                try:
                    alipay_client = get_alipay_client()
                    result = alipay_client.query_order(out_trade_no=order_id)
                    
                    # 检查支付宝返回的状态
                    trade_status = result.get('trade_status')
                    
                    if trade_status == 'TRADE_SUCCESS' or trade_status == 'TRADE_FINISHED':
                        # 支付成功，更新订单
                        payment.status = 'completed'
                        payment.alipay_trade_no = result.get('trade_no')
                        payment.completed_at = datetime.utcnow()
                        payment.callback_data = json.dumps(result, ensure_ascii=False)
                        
                        # 开通会员
                        _activate_membership(payment)
                        
                        db.session.commit()
                        
                        return jsonify({
                            'status': 'completed',
                            'order_id': payment.transaction_id,
                            'amount': payment.amount,
                            'paid_at': payment.completed_at.strftime('%Y-%m-%d %H:%M:%S')
                        }), 200
                    
                    elif trade_status == 'WAIT_BUYER_PAY':
                        return jsonify({
                            'status': 'pending',
                            'order_id': payment.transaction_id,
                            'message': '等待支付'
                        }), 200
                    
                    elif trade_status == 'TRADE_CLOSED':
                        payment.status = 'cancelled'
                        db.session.commit()
                        
                        return jsonify({
                            'status': 'cancelled',
                            'order_id': payment.transaction_id,
                            'message': '订单已关闭'
                        }), 200
                    
                except Exception as e:
                    logger.error(f"查询支付宝订单失败: {str(e)}")
                    # 查询失败时返回数据库中的状态
                    pass
            
            return jsonify({
                'status': payment.status,
                'order_id': payment.transaction_id,
                'amount': payment.amount
            }), 200
            
        except Exception as e:
            logger.error(f"查询订单错误: {str(e)}")
            return jsonify({'error': f'查询订单失败: {str(e)}'}), 500
    
    
    @app.route('/api/payment/alipay/callback', methods=['POST'])
    @csrf.exempt
    def alipay_callback():
        """支付宝异步回调（服务器通知）"""
        try:
            # 获取回调参数
            callback_data = request.form.to_dict()
            signature = callback_data.pop('sign', '')
            
            logger.info(f"收到支付宝回调: {callback_data.get('out_trade_no')}")
            
            # 验证签名
            alipay_client = get_alipay_client()
            if not alipay_client.verify_callback(callback_data, signature):
                logger.warning(f"支付宝回调签名验证失败: {callback_data.get('out_trade_no')}")
                return 'fail', 400
            
            # 获取订单号
            out_trade_no = callback_data.get('out_trade_no')
            trade_no = callback_data.get('trade_no')
            trade_status = callback_data.get('trade_status')
            
            # 查找订单
            payment = PaymentTransaction.query.filter_by(
                transaction_id=out_trade_no
            ).first()
            
            if not payment:
                logger.error(f"订单不存在: {out_trade_no}")
                return 'fail', 404
            
            # 防止重复通知
            if payment.status == 'completed':
                logger.info(f"订单已处理: {out_trade_no}")
                return 'success', 200
            
            # 检查金额是否一致
            total_amount = float(callback_data.get('total_amount', 0))
            if abs(total_amount - payment.amount) > 0.01:  # 允许0.01误差
                logger.error(f"订单金额不一致: {out_trade_no}, 期望 {payment.amount}, 实际 {total_amount}")
                return 'fail', 400
            
            # 处理支付成功
            if trade_status == 'TRADE_SUCCESS' or trade_status == 'TRADE_FINISHED':
                payment.status = 'completed'
                payment.alipay_trade_no = trade_no
                payment.completed_at = datetime.utcnow()
                payment.callback_data = json.dumps(callback_data, ensure_ascii=False)
                
                # 开通会员
                _activate_membership(payment)
                
                db.session.commit()
                
                logger.info(f"支付成功: {out_trade_no}, 用户: {payment.user_id}")
                
                return 'success', 200
            
            # 处理其他状态
            elif trade_status == 'TRADE_CLOSED':
                payment.status = 'cancelled'
                payment.callback_data = json.dumps(callback_data, ensure_ascii=False)
                db.session.commit()
            
            return 'success', 200
            
        except Exception as e:
            logger.error(f"处理支付宝回调错误: {str(e)}")
            import traceback
            traceback.print_exc()
            return 'fail', 500
    
    
    @app.route('/api/payment/alipay/return', methods=['GET'])
    @csrf.exempt
    def alipay_return():
        """支付宝同步回调（用户跳转回来）"""
        try:
            # 获取回调参数
            callback_data = request.args.to_dict()
            signature = callback_data.pop('sign', '')
            
            # 验证签名
            alipay_client = get_alipay_client()
            if not alipay_client.verify_callback(callback_data, signature):
                return redirect('/membership?payment=verify_failed')
            
            # 获取订单号
            out_trade_no = callback_data.get('out_trade_no')
            
            # 查找订单
            payment = PaymentTransaction.query.filter_by(
                transaction_id=out_trade_no
            ).first()
            
            if not payment:
                return redirect('/membership?payment=order_not_found')
            
            # 跳转到会员页面，显示支付结果
            if payment.status == 'completed':
                return redirect('/membership?payment=success')
            else:
                # 异步通知还未到达，显示处理中
                return redirect(f'/membership?payment=processing&order_id={out_trade_no}')
            
        except Exception as e:
            logger.error(f"处理支付宝同步回调错误: {str(e)}")
            return redirect('/membership?payment=error')
    
    
    @app.route('/api/payment/cancel/<order_id>', methods=['POST'])
    @csrf.exempt
    @login_required
    def cancel_payment(order_id):
        """取消订单"""
        try:
            # 查找订单
            payment = PaymentTransaction.query.filter_by(
                transaction_id=order_id,
                user_id=current_user.id
            ).first()
            
            if not payment:
                return jsonify({'error': '订单不存在'}), 404
            
            if payment.status != 'pending':
                return jsonify({'error': '订单状态不允许取消'}), 400
            
            # 关闭支付宝订单
            if payment.payment_method == 'alipay':
                try:
                    alipay_client = get_alipay_client()
                    alipay_client.close_order(out_trade_no=order_id)
                except Exception as e:
                    logger.warning(f"关闭支付宝订单失败: {str(e)}")
            
            # 更新订单状态
            payment.status = 'cancelled'
            payment.note = (payment.note or '') + ' [用户取消]'
            
            # 如果是限量套餐，释放库存
            tier = payment.tier
            if tier and tier.is_limited and tier.sold_count > 0:
                tier.sold_count -= 1
            
            db.session.commit()
            
            logger.info(f"取消订单成功: {order_id}")
            
            return jsonify({
                'success': True,
                'message': '订单已取消'
            }), 200
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"取消订单错误: {str(e)}")
            return jsonify({'error': f'取消订单失败: {str(e)}'}), 500
    
    
    def _activate_membership(payment):
        """开通会员（内部函数）"""
        try:
            tier = payment.tier
            
            # 检查是否已经开通过
            existing = UserMembership.query.filter_by(
                user_id=payment.user_id,
                payment_id=payment.id
            ).first()
            
            if existing:
                logger.info(f"会员已开通，跳过: 订单 {payment.transaction_id}")
                return
            
            # 计算会员有效期
            start_date = datetime.utcnow()
            
            # 检查用户是否有现有会员
            current_membership = UserMembership.query.filter_by(
                user_id=payment.user_id,
                is_active=True
            ).filter(
                UserMembership.end_date > datetime.utcnow()
            ).first()
            
            if current_membership:
                # 如果有现有会员，从现有会员结束时间开始计算
                start_date = current_membership.end_date
                # 将现有会员设为不活跃
                current_membership.is_active = False
            
            end_date = start_date + timedelta(days=tier.duration_days)
            
            # 创建新会员记录
            membership = UserMembership(
                user_id=payment.user_id,
                tier_id=tier.id,
                start_date=start_date,
                end_date=end_date,
                is_active=True,
                payment_id=payment.id
            )
            
            db.session.add(membership)
            db.session.flush()
            
            logger.info(f"开通会员成功: 用户 {payment.user_id}, 套餐 {tier.name}, 到期 {end_date}")
            
        except Exception as e:
            logger.error(f"开通会员失败: {str(e)}")
            raise


