"""
会员系统工具函数和权限装饰器
"""
from functools import wraps
from flask import jsonify
from flask_login import current_user
from models_membership import UserMembership, UsageLog, MembershipTier
from models import db
from datetime import datetime, timedelta

# 功能权限配置
FEATURE_PERMISSIONS = {
    'ai_ask': {
        'name': 'AI答疑',
        'free': {'enabled': True, 'limit': 10},
        'weekly': {'enabled': True, 'limit': 50},
        'monthly': {'enabled': True, 'limit': 200},
        'yearly': {'enabled': True, 'limit': -1}  # -1 表示无限制
    },
    'question_gen': {
        'name': '智能出题',
        'free': {'enabled': True, 'limit': 3},
        'weekly': {'enabled': True, 'limit': 15},
        'monthly': {'enabled': True, 'limit': 50},
        'yearly': {'enabled': True, 'limit': -1}
    },
    'lecture_gen': {
        'name': '智能讲义',
        'free': {'enabled': True, 'limit': 2},
        'weekly': {'enabled': True, 'limit': 10},
        'monthly': {'enabled': True, 'limit': 30},
        'yearly': {'enabled': True, 'limit': -1}
    },
    'programming_help': {
        'name': '辅助编程',
        'free': {'enabled': True, 'limit': 5},
        'weekly': {'enabled': True, 'limit': 25},
        'monthly': {'enabled': True, 'limit': 100},
        'yearly': {'enabled': True, 'limit': -1}
    },
    'code_review': {
        'name': '代码审查',
        'free': {'enabled': True, 'limit': 3},
        'weekly': {'enabled': True, 'limit': 15},
        'monthly': {'enabled': True, 'limit': 60},
        'yearly': {'enabled': True, 'limit': -1}
    },
    'code_explain': {
        'name': '代码解释',
        'free': {'enabled': True, 'limit': 5},
        'weekly': {'enabled': True, 'limit': 25},
        'monthly': {'enabled': True, 'limit': 100},
        'yearly': {'enabled': True, 'limit': -1}
    },
    'debug_help': {
        'name': '调试帮助',
        'free': {'enabled': True, 'limit': 5},
        'weekly': {'enabled': True, 'limit': 25},
        'monthly': {'enabled': True, 'limit': 100},
        'yearly': {'enabled': True, 'limit': -1}
    },
    'video_summary': {
        'name': '视频总结',
        'free': {'enabled': True, 'limit': 3},
        'weekly': {'enabled': True, 'limit': 15},
        'monthly': {'enabled': True, 'limit': 50},
        'yearly': {'enabled': True, 'limit': -1}
    },
    'generate_lecture': {
        'name': '智能讲义生成',
        'free': {'enabled': True, 'limit': 2},
        'weekly': {'enabled': True, 'limit': 10},
        'monthly': {'enabled': True, 'limit': 30},
        'yearly': {'enabled': True, 'limit': -1}
    },
    'generate_question': {
        'name': '智能出题生成',
        'free': {'enabled': True, 'limit': 3},
        'weekly': {'enabled': True, 'limit': 15},
        'monthly': {'enabled': True, 'limit': 50},
        'yearly': {'enabled': True, 'limit': -1}
    }
}


def get_user_membership(user_id):
    """获取用户的会员信息"""
    membership = UserMembership.query.filter_by(
        user_id=user_id,
        is_active=True
    ).first()
    
    return membership


def get_usage_stats(user_id, feature_name, period='daily'):
    """
    获取用户特定功能的使用次数
    
    Args:
        user_id: 用户ID
        feature_name: 功能名称
        period: 统计周期 (daily/weekly/monthly)
    
    Returns:
        int: 使用次数
    """
    now = datetime.now()
    
    if period == 'daily':
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == 'weekly':
        start_date = now - timedelta(days=now.weekday())
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == 'monthly':
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    count = UsageLog.query.filter(
        UsageLog.user_id == user_id,
        UsageLog.feature_code == feature_name,
        UsageLog.created_at >= start_date
    ).count()
    
    return count


def check_feature_access(user, feature_name):
    """检查用户是否有权限访问某个功能"""
    membership = get_user_membership(user.id)
    tier_code = membership.tier.code if membership else 'free'
    
    if feature_name not in FEATURE_PERMISSIONS:
        return False, "未知的功能"
    
    feature_perms = FEATURE_PERMISSIONS[feature_name]
    tier_perms = feature_perms.get(tier_code, feature_perms['free'])
    
    if not tier_perms['enabled']:
        return False, f"{feature_perms['name']}功能未启用"
    
    limit = tier_perms['limit']
    if limit == -1:
        return True, "无限制"
    
    # 检查今日使用次数
    used = get_usage_stats(user.id, feature_name, 'daily')
    
    if used >= limit:
        return False, f"今日{feature_perms['name']}使用次数已达上限({limit}次)"
    
    return True, f"剩余 {limit - used} 次"


def log_feature_usage(user_id, feature_name, action='used'):
    """记录功能使用"""
    try:
        log = UsageLog(
            user_id=user_id,
            feature_code=feature_name,
            action=action,
            created_at=datetime.now()
        )
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"记录使用日志失败: {str(e)}")


def membership_required(level):
    """会员等级要求装饰器"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                return jsonify({'error': '请先登录'}), 401
            
            membership = get_user_membership(current_user.id)
            tier_code = membership.tier.code if membership else 'free'
            
            level_order = {'free': 0, 'weekly': 1, 'monthly': 2, 'yearly': 3}
            
            if level_order.get(tier_code, 0) < level_order.get(level, 0):
                return jsonify({
                    'error': f'此功能需要 {level} 及以上会员',
                    'required_level': level,
                    'current_level': tier_code
                }), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def feature_limit(feature_name):
    """功能使用次数限制装饰器"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                return jsonify({'error': '请先登录'}), 401
            
            # 检查权限
            has_access, message = check_feature_access(current_user, feature_name)
            
            if not has_access:
                return jsonify({
                    'error': message,
                    'upgrade_required': True
                }), 403
            
            # 执行原函数
            result = f(*args, **kwargs)
            
            # 记录使用
            log_feature_usage(current_user.id, feature_name)
            
            return result
        return decorated_function
    return decorator


# ============= 早鸟优惠和动态定价相关函数 =============

def get_total_yearly_sold_count():
    """统计已售年卡总数（包括所有早鸟档位）"""
    from models_membership import PaymentTransaction
    
    # 统计所有状态为completed的早鸟套餐订单
    early_bird_codes = ['early_bird_1', 'early_bird_2', 'early_bird_3']
    
    total = 0
    for code in early_bird_codes:
        tier = MembershipTier.query.filter_by(code=code).first()
        if tier:
            total += tier.sold_count
    
    return total


def get_current_early_bird_tier():
    """
    获取当前可购买的早鸟档位
    
    Returns:
        dict or None: 早鸟档位信息，如果早鸟已售罄则返回None
    """
    total_sold = get_total_yearly_sold_count()
    
    # 查找当前应该显示的早鸟档位
    early_bird_tiers = MembershipTier.query.filter_by(
        is_early_bird=True,
        is_active=True
    ).order_by(MembershipTier.early_bird_tier).all()
    
    for tier in early_bird_tiers:
        # 检查这个档位是否还有名额
        if tier.sold_count < tier.total_quota:
            remaining = tier.total_quota - tier.sold_count
            
            # 找下一个档位的价格
            next_tier = MembershipTier.query.filter_by(
                is_early_bird=True,
                is_active=True,
                early_bird_tier=tier.early_bird_tier + 1
            ).first()
            
            next_price = next_tier.price if next_tier else tier.original_price
            
            return {
                'tier': tier.to_dict(),  # 完整的tier对象
                'tier_id': tier.id,
                'tier_name': tier.name,
                'tier_code': tier.code,
                'tier_level': tier.early_bird_tier,
                'price': tier.price,
                'original_price': tier.original_price,
                'discount': tier.original_price - tier.price,
                'remaining': remaining,
                'total_quota': tier.total_quota,
                'sold_count': tier.sold_count,
                'total_sold': total_sold,
                'next_price': next_price,
                'percentage_sold': int((total_sold / 50) * 100),
                'countdown_text': f'仅剩{remaining}个名额！'
            }
    
    # 所有早鸟都售罄
    return None


def get_available_tiers():
    """
    获取当前可购买的套餐列表
    
    Returns:
        dict: 包含早鸟和标准套餐的字典
    """
    early_bird = get_current_early_bird_tier()
    
    # 获取标准套餐（非早鸟）
    standard_tiers = MembershipTier.query.filter_by(
        is_early_bird=False,
        is_active=True
    ).filter(
        MembershipTier.code != 'free'
    ).order_by(MembershipTier.sort_order).all()
    
    return {
        'early_bird': early_bird,
        'early_bird_available': early_bird is not None,
        'standard_tiers': [tier.to_dict() for tier in standard_tiers]
    }


def check_tier_availability(tier_id):
    """
    检查套餐是否还有库存
    
    Args:
        tier_id: 套餐ID
    
    Returns:
        tuple: (是否可用, 消息)
    """
    tier = MembershipTier.query.get(tier_id)
    
    if not tier:
        return False, "套餐不存在"
    
    if not tier.is_active:
        return False, "套餐已下架"
    
    if tier.is_limited:
        if tier.sold_count >= tier.total_quota:
            return False, f"{tier.name}已售罄"
        return True, f"剩余{tier.total_quota - tier.sold_count}个名额"
    
    return True, "可购买"


def increment_tier_sold_count(tier_id):
    """
    增加套餐已售数量
    
    Args:
        tier_id: 套餐ID
    
    Returns:
        bool: 是否成功
    """
    tier = MembershipTier.query.get(tier_id)
    
    if not tier:
        return False
    
    if tier.is_limited and tier.sold_count >= tier.total_quota:
        return False
    
    tier.sold_count += 1
    tier.updated_at = datetime.utcnow()
    db.session.commit()
    
    return True


def get_membership_status(user_id):
    """
    获取用户详细会员状态
    
    Args:
        user_id: 用户ID
    
    Returns:
        dict: 会员状态信息
    """
    membership = get_user_membership(user_id)
    
    if not membership:
        return {
            'has_membership': False,
            'tier_name': '免费用户',
            'tier_code': 'free',
            'tier_level': 0,
            'days_remaining': 0,
            'is_expired': True,
            'is_early_bird': False
        }
    
    days_remaining = (membership.end_date - datetime.utcnow()).days
    
    return {
        'has_membership': True,
        'tier_name': membership.tier.name,
        'tier_code': membership.tier.code,
        'tier_level': membership.tier.level,
        'start_date': membership.start_date.strftime('%Y-%m-%d %H:%M:%S'),
        'end_date': membership.end_date.strftime('%Y-%m-%d %H:%M:%S'),
        'days_remaining': max(0, days_remaining),
        'is_expired': days_remaining <= 0,
        'is_early_bird': membership.tier.is_early_bird,
        'early_bird_tier': membership.tier.early_bird_tier if membership.tier.is_early_bird else 0,
        'auto_renew': membership.auto_renew
    }


def get_all_features_usage(user_id):
    """
    获取用户所有功能的使用情况
    
    Args:
        user_id: 用户ID
    
    Returns:
        list: 所有功能的使用情况列表
    """
    membership = get_user_membership(user_id)
    tier_code = membership.tier.code if membership else 'free'
    
    usage_list = []
    
    for feature_code, feature_info in FEATURE_PERMISSIONS.items():
        # 获取该功能的权限配置
        tier_perms = feature_info.get(tier_code, feature_info['free'])
        limit = tier_perms['limit']
        
        # 获取今日使用次数
        used = get_usage_stats(user_id, feature_code, 'daily')
        
        # 计算剩余次数
        if limit == -1:
            remaining = -1
            percentage = 0
        else:
            remaining = max(0, limit - used)
            percentage = int((used / limit) * 100) if limit > 0 else 0
        
        usage_list.append({
            'feature_code': feature_code,
            'feature_name': feature_info['name'],
            'limit': limit,
            'used': used,
            'remaining': remaining,
            'percentage': percentage,
            'is_unlimited': limit == -1,
            'is_exhausted': limit > 0 and used >= limit
        })
    
    return usage_list


def auto_downgrade_expired_members():
    """
    自动降级过期会员（定时任务使用）
    
    Returns:
        int: 降级的会员数量
    """
    expired_memberships = UserMembership.query.filter(
        UserMembership.is_active == True,
        UserMembership.end_date <= datetime.utcnow()
    ).all()
    
    count = 0
    for membership in expired_memberships:
        membership.is_active = False
        count += 1
    
    if count > 0:
        db.session.commit()
    
    return count
