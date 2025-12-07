"""
支付宝支付SDK封装
支持电脑网站支付和手机网站支付
"""
import logging
from datetime import datetime, timedelta
from config import get_config

logger = logging.getLogger(__name__)

# 获取配置
config = get_config()

# 支付宝配置
ALIPAY_APP_ID = config.ALIPAY_APP_ID if hasattr(config, 'ALIPAY_APP_ID') else ''
ALIPAY_APP_PRIVATE_KEY = config.ALIPAY_APP_PRIVATE_KEY if hasattr(config, 'ALIPAY_APP_PRIVATE_KEY') else ''
ALIPAY_PUBLIC_KEY = config.ALIPAY_PUBLIC_KEY if hasattr(config, 'ALIPAY_PUBLIC_KEY') else ''
ALIPAY_GATEWAY = config.ALIPAY_GATEWAY if hasattr(config, 'ALIPAY_GATEWAY') else 'https://openapi.alipay.com/gateway.do'

# 回调URL（从配置读取或使用默认值）
PAYMENT_RETURN_URL = config.PAYMENT_RETURN_URL if hasattr(config, 'PAYMENT_RETURN_URL') else 'http://localhost:5000/api/payment/alipay/return'
PAYMENT_NOTIFY_URL = config.PAYMENT_NOTIFY_URL if hasattr(config, 'PAYMENT_NOTIFY_URL') else 'http://localhost:5000/api/payment/alipay/callback'


class AlipayClient:
    """支付宝客户端封装"""
    
    def __init__(self, app_id=None, app_private_key=None, alipay_public_key=None, gateway=None):
        """
        初始化支付宝客户端
        
        Args:
            app_id: 应用APPID
            app_private_key: 应用私钥
            alipay_public_key: 支付宝公钥
            gateway: 支付宝网关地址
        """
        self.app_id = app_id or ALIPAY_APP_ID
        self.app_private_key = app_private_key or ALIPAY_APP_PRIVATE_KEY
        self.alipay_public_key = alipay_public_key or ALIPAY_PUBLIC_KEY
        self.gateway = gateway or ALIPAY_GATEWAY
        
        # 检查配置是否完整
        if not all([self.app_id, self.app_private_key, self.alipay_public_key]):
            logger.warning("支付宝配置不完整，支付功能将不可用")
            self.configured = False
        else:
            self.configured = True
            self._init_alipay_sdk()
    
    def _init_alipay_sdk(self):
        """初始化支付宝SDK"""
        try:
            from alipay import AliPay
            
            # 格式化私钥和公钥（去除头尾标记）
            app_private_key_str = self._format_key(self.app_private_key, 'PRIVATE')
            alipay_public_key_str = self._format_key(self.alipay_public_key, 'PUBLIC')
            
            self.alipay = AliPay(
                appid=self.app_id,
                app_notify_url=PAYMENT_NOTIFY_URL,
                app_private_key_string=app_private_key_str,
                alipay_public_key_string=alipay_public_key_str,
                sign_type='RSA2',
                debug=self.gateway.endswith('alipaydev.com/gateway.do')  # 沙箱环境
            )
            
            logger.info(f"支付宝SDK初始化成功 (APPID: {self.app_id[:8]}...)")
            
        except ImportError:
            logger.error("alipay-sdk-python 未安装，请运行: pip install alipay-sdk-python")
            self.configured = False
        except Exception as e:
            logger.error(f"支付宝SDK初始化失败: {str(e)}")
            self.configured = False
    
    def _format_key(self, key_string, key_type='PRIVATE'):
        """
        格式化密钥字符串
        
        Args:
            key_string: 密钥字符串
            key_type: 密钥类型 (PRIVATE/PUBLIC)
        
        Returns:
            str: 格式化后的密钥
        """
        # 去除可能存在的头尾标记
        key_string = key_string.strip()
        
        # 去除 -----BEGIN ... KEY----- 和 -----END ... KEY-----
        lines = key_string.split('\n')
        key_content = []
        for line in lines:
            line = line.strip()
            if 'BEGIN' in line or 'END' in line or not line:
                continue
            key_content.append(line)
        
        return ''.join(key_content)
    
    def create_web_payment(self, out_trade_no, total_amount, subject, body=None, return_url=None, notify_url=None):
        """
        创建电脑网站支付订单
        
        Args:
            out_trade_no: 商户订单号
            total_amount: 订单金额（元）
            subject: 订单标题
            body: 订单描述
            return_url: 同步回调地址
            notify_url: 异步回调地址
        
        Returns:
            str: 支付URL（需要跳转）
        """
        if not self.configured:
            raise Exception("支付宝未配置，无法创建支付")
        
        try:
            # 订单参数
            order_string = self.alipay.api_alipay_trade_page_pay(
                out_trade_no=out_trade_no,
                total_amount=str(total_amount),
                subject=subject,
                body=body or subject,
                return_url=return_url or PAYMENT_RETURN_URL,
                notify_url=notify_url or PAYMENT_NOTIFY_URL,
                timeout_express='15m'  # 订单15分钟后超时
            )
            
            # 拼接完整支付URL
            payment_url = f"{self.gateway}?{order_string}"
            
            logger.info(f"创建支付订单成功: {out_trade_no}, 金额: ¥{total_amount}")
            
            return payment_url
            
        except Exception as e:
            logger.error(f"创建支付订单失败: {str(e)}")
            raise
    
    def create_wap_payment(self, out_trade_no, total_amount, subject, body=None, return_url=None, notify_url=None):
        """
        创建手机网站支付订单
        
        Args:
            out_trade_no: 商户订单号
            total_amount: 订单金额（元）
            subject: 订单标题
            body: 订单描述
            return_url: 同步回调地址
            notify_url: 异步回调地址
        
        Returns:
            str: 支付URL（需要跳转）
        """
        if not self.configured:
            raise Exception("支付宝未配置，无法创建支付")
        
        try:
            # 手机网站支付
            order_string = self.alipay.api_alipay_trade_wap_pay(
                out_trade_no=out_trade_no,
                total_amount=str(total_amount),
                subject=subject,
                body=body or subject,
                return_url=return_url or PAYMENT_RETURN_URL,
                notify_url=notify_url or PAYMENT_NOTIFY_URL,
                timeout_express='15m'
            )
            
            # 拼接完整支付URL
            payment_url = f"{self.gateway}?{order_string}"
            
            logger.info(f"创建手机支付订单成功: {out_trade_no}, 金额: ¥{total_amount}")
            
            return payment_url
            
        except Exception as e:
            logger.error(f"创建手机支付订单失败: {str(e)}")
            raise
    
    def verify_callback(self, data, signature):
        """
        验证支付回调签名
        
        Args:
            data: 回调参数字典
            signature: 签名字符串
        
        Returns:
            bool: 验证是否成功
        """
        if not self.configured:
            logger.error("支付宝未配置，无法验证签名")
            return False
        
        try:
            # 使用SDK验证签名
            success = self.alipay.verify(data, signature)
            
            if success:
                logger.info(f"签名验证成功: 订单号 {data.get('out_trade_no')}")
            else:
                logger.warning(f"签名验证失败: 订单号 {data.get('out_trade_no')}")
            
            return success
            
        except Exception as e:
            logger.error(f"验证签名异常: {str(e)}")
            return False
    
    def query_order(self, out_trade_no=None, trade_no=None):
        """
        查询订单状态
        
        Args:
            out_trade_no: 商户订单号
            trade_no: 支付宝交易号
        
        Returns:
            dict: 订单信息
        """
        if not self.configured:
            raise Exception("支付宝未配置，无法查询订单")
        
        if not out_trade_no and not trade_no:
            raise ValueError("out_trade_no 和 trade_no 至少提供一个")
        
        try:
            result = self.alipay.api_alipay_trade_query(
                out_trade_no=out_trade_no,
                trade_no=trade_no
            )
            
            logger.info(f"查询订单成功: {out_trade_no or trade_no}")
            
            return result
            
        except Exception as e:
            logger.error(f"查询订单失败: {str(e)}")
            raise
    
    def close_order(self, out_trade_no=None, trade_no=None):
        """
        关闭订单
        
        Args:
            out_trade_no: 商户订单号
            trade_no: 支付宝交易号
        
        Returns:
            dict: 关闭结果
        """
        if not self.configured:
            raise Exception("支付宝未配置，无法关闭订单")
        
        try:
            result = self.alipay.api_alipay_trade_close(
                out_trade_no=out_trade_no,
                trade_no=trade_no
            )
            
            logger.info(f"关闭订单成功: {out_trade_no or trade_no}")
            
            return result
            
        except Exception as e:
            logger.error(f"关闭订单失败: {str(e)}")
            raise
    
    def refund(self, out_trade_no, refund_amount, refund_reason=None, out_request_no=None):
        """
        退款
        
        Args:
            out_trade_no: 商户订单号
            refund_amount: 退款金额（元）
            refund_reason: 退款原因
            out_request_no: 退款请求号
        
        Returns:
            dict: 退款结果
        """
        if not self.configured:
            raise Exception("支付宝未配置，无法退款")
        
        try:
            import uuid
            
            result = self.alipay.api_alipay_trade_refund(
                out_trade_no=out_trade_no,
                refund_amount=str(refund_amount),
                refund_reason=refund_reason or '用户申请退款',
                out_request_no=out_request_no or f"REFUND_{uuid.uuid4().hex[:16].upper()}"
            )
            
            logger.info(f"退款成功: 订单 {out_trade_no}, 金额 ¥{refund_amount}")
            
            return result
            
        except Exception as e:
            logger.error(f"退款失败: {str(e)}")
            raise


# 创建全局实例
_alipay_client = None


def get_alipay_client():
    """获取支付宝客户端实例（单例）"""
    global _alipay_client
    
    if _alipay_client is None:
        _alipay_client = AlipayClient()
    
    return _alipay_client


def is_alipay_configured():
    """检查支付宝是否已配置"""
    client = get_alipay_client()
    return client.configured


# 便捷函数
def create_payment(order_id, amount, subject, is_mobile=False):
    """
    创建支付订单（自动选择PC或移动端）
    
    Args:
        order_id: 订单号
        amount: 金额（元）
        subject: 订单标题
        is_mobile: 是否手机端
    
    Returns:
        str: 支付URL
    """
    client = get_alipay_client()
    
    if is_mobile:
        return client.create_wap_payment(order_id, amount, subject)
    else:
        return client.create_web_payment(order_id, amount, subject)


def verify_payment_callback(data, signature):
    """
    验证支付回调
    
    Args:
        data: 回调参数
        signature: 签名
    
    Returns:
        bool: 是否验证成功
    """
    client = get_alipay_client()
    return client.verify_callback(data, signature)


def query_payment_status(order_id):
    """
    查询支付状态
    
    Args:
        order_id: 订单号
    
    Returns:
        dict: 订单信息
    """
    client = get_alipay_client()
    return client.query_order(out_trade_no=order_id)


