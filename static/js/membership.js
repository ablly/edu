// ==================== 会员管理系统 ====================

class MembershipManager {
    constructor() {
        this.tiers = [];
        this.currentUser = null;
        this.init();
    }

    async init() {
        console.log('🔧 初始化会员管理器');
        
        // 设置超时保护 - 5秒后强制清除loading状态
        const timeoutId = setTimeout(() => {
            console.warn('⚠️ 加载超时，强制清除loading状态');
            const container = document.getElementById('pricingCards');
            if (container && container.innerHTML.includes('正在加载会员方案')) {
                container.innerHTML = `
                    <div class="pricing-error" style="grid-column: 1 / -1; text-align: center; color: white; padding: 60px 20px;">
                        <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 16px; opacity: 0.9;"></i>
                        <p style="font-size: 18px; margin-bottom: 12px;">加载超时</p>
                        <p style="font-size: 14px; opacity: 0.8;">请刷新页面重试或检查网络连接</p>
                    </div>
                `;
            }
        }, 5000);
        
        try {
            await this.checkAuth();
            await this.loadTiers();
            this.renderPricingCards();
            clearTimeout(timeoutId); // 成功加载后清除超时定时器
        } catch (error) {
            clearTimeout(timeoutId);
            console.error('❌ 会员管理器初始化失败:', error);
            this.showError('初始化失败，请刷新页面重试');
        }
    }

    async checkAuth() {
        try {
            console.log('🔐 检查用户登录状态');
            const response = await fetch('/api/auth/check');
            const data = await response.json();
            this.currentUser = data.authenticated ? data.user : null;
            console.log('✅ 用户状态:', this.currentUser ? '已登录' : '未登录');
        } catch (error) {
            console.error('❌ 检查登录状态失败:', error);
            this.currentUser = null;
        }
    }

    async loadTiers() {
        const container = document.getElementById('pricingCards');
        try {
            console.log('📡 加载会员等级数据');
            const response = await fetch('/api/membership/tiers');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.tiers = data.tiers || [];
            console.log('✅ 成功加载', this.tiers.length, '个会员等级');
        } catch (error) {
            console.error('❌ 加载会员等级失败:', error);
            this.tiers = [];
            // 立即移除loading状态并显示错误
            if (container) {
                container.innerHTML = `
                    <div class="pricing-error" style="grid-column: 1 / -1; text-align: center; color: white; padding: 60px 20px;">
                        <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 16px; opacity: 0.9;"></i>
                        <p style="font-size: 18px; margin-bottom: 12px;">加载会员方案失败</p>
                        <p style="font-size: 14px; opacity: 0.8;">请刷新页面重试或联系管理员</p>
                    </div>
                `;
            }
        }
    }

    renderPricingCards() {
        console.log('🎨 渲染会员卡片');
        const container = document.getElementById('pricingCards');
        if (!container) {
            console.warn('⚠️ 未找到会员卡片容器 #pricingCards');
            return;
        }

        // 立即清除loading状态
        container.innerHTML = '';

        if (this.tiers.length === 0) {
            console.warn('⚠️ 没有可用的会员方案');
            container.innerHTML = `
                <div class="pricing-error" style="grid-column: 1 / -1; text-align: center; color: white; padding: 60px 20px;">
                    <i class="fas fa-info-circle" style="font-size: 48px; margin-bottom: 16px; opacity: 0.9;"></i>
                    <p style="font-size: 18px;">暂无可用的会员方案</p>
                </div>
            `;
            return;
        }

        console.log('✅ 开始渲染', this.tiers.length, '个会员卡片');

        container.innerHTML = this.tiers.map((tier, index) => {
            const isFeatured = tier.code === 'yearly'; // 年会员设为推荐
            const isFree = tier.code === 'free';
            
            return `
                <div class="pricing-card ${isFeatured ? 'featured' : ''}" data-tier-id="${tier.id}">
                    <div class="card-header">
                        <h3 class="tier-name">${tier.name}</h3>
                        <div class="tier-price">
                            <span class="currency">¥</span>${tier.price}
                            ${!isFree ? `<span class="period">/${this.getPeriodText(tier.code)}</span>` : ''}
                        </div>
                        <p class="tier-description">${tier.description || ''}</p>
                    </div>
                    
                    <ul class="features-list">
                        ${this.renderFeatures(tier.features)}
                    </ul>
                    
                    <button 
                        class="purchase-button ${isFree ? 'btn-free' : 'btn-buy'}"
                        onclick="membershipManager.handlePurchase('${tier.code}', ${tier.id})"
                        ${isFree ? 'disabled' : ''}
                    >
                        <i class="fas ${isFree ? 'fa-check' : 'fa-shopping-cart'}"></i>
                        <span>${isFree ? '当前方案' : '立即购买'}</span>
                    </button>
                </div>
            `;
        }).join('');

        console.log('✅ 会员卡片渲染完成');
    }

    getPeriodText(code) {
        const periods = {
            'weekly': '周',
            'monthly': '月',
            'yearly': '年'
        };
        return periods[code] || '';
    }

    renderFeatures(featuresJson) {
        try {
            const features = typeof featuresJson === 'string' ? JSON.parse(featuresJson) : featuresJson;
            if (!Array.isArray(features)) return '';
            
            // 限制最多显示5个功能
            const displayFeatures = features.slice(0, 5);
            
            return displayFeatures.map(feature => `
                <li class="feature-item">
                    <i class="fas fa-check-circle"></i>
                    <span>${feature}</span>
                </li>
            `).join('');
        } catch (error) {
            console.error('解析功能列表失败:', error);
            return '';
        }
    }

    async handlePurchase(tierCode, tierId) {
        // 检查是否登录
        if (!this.currentUser) {
            this.showToast('请先登录', '请登录后再购买会员', 'warning');
            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);
            return;
        }

        // 直接跳转到支付页面，不在首页弹窗购买
        console.log(`🛒 跳转到支付页面购买: ${tierCode} (ID: ${tierId})`);
        window.location.href = '/payment';
    }

    getTierName(code) {
        const names = {
            'free': '免费用户',
            'weekly': '周会员',
            'monthly': '月会员',
            'yearly': '年会员'
        };
        return names[code] || '会员';
    }

    showToast(title, message, type = 'info') {
        // 创建toast容器（如果不存在）
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(container);
        }

        // 创建toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.style.cssText = `
            min-width: 300px;
            padding: 16px 20px;
            border-radius: 10px;
            background: white;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            display: flex;
            align-items: center;
            gap: 12px;
            animation: slideIn 0.3s ease;
        `;

        const iconClass = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle'
        }[type] || 'fa-info-circle';

        const iconColor = {
            'success': '#10b981',
            'error': '#ef4444',
            'warning': '#f59e0b',
            'info': '#3b82f6'
        }[type] || '#3b82f6';

        toast.innerHTML = `
            <i class="fas ${iconClass}" style="color: ${iconColor}; font-size: 20px;"></i>
            <div style="flex: 1;">
                <div style="font-weight: 600; margin-bottom: 4px;">${title}</div>
                <div style="font-size: 14px; color: #6b7280;">${message}</div>
            </div>
        `;

        container.appendChild(toast);

        // 3秒后移除
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    showError(message) {
        const container = document.getElementById('pricingCards');
        if (container) {
            container.innerHTML = `
                <div class="pricing-error" style="grid-column: 1 / -1; text-align: center; color: white; padding: 40px;">
                    <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <p style="font-size: 18px;">${message}</p>
                </div>
            `;
        }
    }
}

// 初始化
let membershipManager;
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM加载完成，初始化会员管理器');
    try {
        membershipManager = new MembershipManager();
        console.log('✅ 会员管理器实例创建成功');
    } catch (error) {
        console.error('❌ 会员管理器创建失败:', error);
    }
});

// CSS动画
(function() {
    const membershipStyle = document.createElement('style');
    membershipStyle.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(membershipStyle);
})();

// CSS鍔ㄧ敾
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

