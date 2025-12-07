/**
 * 个人中心页面管理器
 */
class ProfileManager {
    constructor() {
        this.currentPeriod = 'daily';
        this.init();
    }

    /**
     * 初始化
     */
    init() {
        this.bindEvents();
        this.loadUserData();
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 侧边栏菜单切换
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                this.switchTab(item.dataset.tab);
            });
        });

        // 统计周期切换
        document.querySelectorAll('.period-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchPeriod(tab.dataset.period);
            });
        });

        // 密码表单提交
        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePasswordChange();
            });
        }
    }

    /**
     * 切换标签页
     */
    switchTab(tabName) {
        // 更新菜单项激活状态
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // 更新内容区域
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');

        // 根据不同标签页加载数据
        if (tabName === 'usage' && !this.usageDataLoaded) {
            this.loadUsageStats();
        }
    }

    /**
     * 切换统计周期
     */
    switchPeriod(period) {
        this.currentPeriod = period;

        // 更新按钮状态
        document.querySelectorAll('.period-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-period="${period}"]`).classList.add('active');

        // 重新加载统计数据
        this.loadUsageStats();
    }

    /**
     * 加载用户数据
     */
    async loadUserData() {
        try {
            this.showLoading();

            const response = await fetch('/api/auth/current-user', {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('获取用户信息失败');
            }

            const data = await response.json();

            if (data.logged_in) {
                this.displayUserInfo(data.user);
                this.displayMembershipInfo(data.membership);
            } else {
                window.location.href = '/login';
            }

        } catch (error) {
            console.error('加载用户数据失败:', error);
            this.showToast('加载失败，请刷新页面重试', 'error');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * 显示用户基本信息
     */
    displayUserInfo(user) {
        document.getElementById('username').textContent = user.username || '-';
        document.getElementById('email').textContent = user.email || '-';
        
        // 格式化日期
        const createdAt = user.created_at ? 
            new Date(user.created_at).toLocaleDateString('zh-CN') : '-';
        document.getElementById('createdAt').textContent = createdAt;
    }

    /**
     * 显示会员信息
     */
    displayMembershipInfo(membership) {
        const container = document.getElementById('membershipInfo');
        
        if (!membership) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-crown" style="font-size: 3rem; color: #cbd5e0; margin-bottom: 15px;"></i>
                    <p style="color: #718096; font-size: 1.1rem;">暂无会员信息</p>
                </div>
            `;
            return;
        }

        const tierColors = {
            'free': '#94a3b8',
            'weekly': '#3b82f6',
            'monthly': '#8b5cf6',
            'yearly': '#f59e0b'
        };

        const tierNames = {
            'free': '免费版',
            'weekly': '周卡',
            'monthly': '月卡',
            'yearly': '年卡'
        };

        const tier = membership.tier;
        const tierColor = tierColors[tier.code] || '#667eea';
        const tierName = tierNames[tier.code] || tier.name;

        // 计算剩余天数
        let daysRemaining = '-';
        if (membership.end_date) {
            const endDate = new Date(membership.end_date);
            const now = new Date();
            const diff = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
            daysRemaining = diff > 0 ? `${diff} 天` : '已过期';
        }

        container.innerHTML = `
            <div class="membership-card" style="background: linear-gradient(135deg, ${tierColor} 0%, ${tierColor}dd 100%);">
                <div class="membership-header">
                    <div class="tier-name">
                        <i class="fas fa-crown"></i>
                        ${tierName}
                    </div>
                    <div class="tier-badge">${membership.is_active ? '有效' : '已过期'}</div>
                </div>
                <div class="membership-details">
                    <div class="detail-item">
                        <div class="detail-label">开始时间</div>
                        <div class="detail-value">${new Date(membership.start_date).toLocaleDateString('zh-CN')}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">剩余天数</div>
                        <div class="detail-value">${daysRemaining}</div>
                    </div>
                </div>
            </div>
            <div class="membership-features">
                <h3 class="features-title">会员特权</h3>
                <ul class="features-list">
                    ${tier.features.map(feature => `
                        <li><i class="fas fa-check-circle"></i> ${feature}</li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    /**
     * 加载使用统计
     */
    async loadUsageStats() {
        try {
            const response = await fetch(`/api/usage/stats?period=${this.currentPeriod}`, {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('获取使用统计失败');
            }

            const data = await response.json();
            this.displayUsageStats(data.stats);
            this.usageDataLoaded = true;

        } catch (error) {
            console.error('加载使用统计失败:', error);
            this.displayUsageStats({});
        }
    }

    /**
     * 显示使用统计
     */
    displayUsageStats(stats) {
        const container = document.getElementById('statsGrid');

        const features = [
            { key: 'ai_ask', name: 'AI答疑', icon: 'fa-robot', limit: stats.ai_ask?.limit || 0 },
            { key: 'question_gen', name: '题目生成', icon: 'fa-list-check', limit: stats.question_gen?.limit || 0 },
            { key: 'lecture_gen', name: '讲义生成', icon: 'fa-book', limit: stats.lecture_gen?.limit || 0 },
            { key: 'programming_help', name: '编程辅助', icon: 'fa-code', limit: stats.programming_help?.limit || 0 },
            { key: 'code_review', name: '代码审查', icon: 'fa-search', limit: stats.code_review?.limit || 0 },
            { key: 'code_explain', name: '代码解释', icon: 'fa-lightbulb', limit: stats.code_explain?.limit || 0 }
        ];

        const html = features.map(feature => {
            const featureStats = stats[feature.key] || { used: 0, limit: feature.limit };
            const percentage = featureStats.limit > 0 ? 
                Math.min((featureStats.used / featureStats.limit) * 100, 100) : 0;
            const limitText = featureStats.limit === -1 ? '无限' : featureStats.limit;

            return `
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon">
                            <i class="fas ${feature.icon}"></i>
                        </div>
                    </div>
                    <div class="stat-label">${feature.name}</div>
                    <div class="stat-value">${featureStats.used}</div>
                    <div class="stat-limit">限额: ${limitText}</div>
                    ${featureStats.limit > 0 ? `
                        <div class="stat-progress">
                            <div class="stat-progress-bar" style="width: ${percentage}%"></div>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        container.innerHTML = html || '<p style="text-align: center; color: #718096;">暂无数据</p>';
    }

    /**
     * 显示修改密码弹窗
     */
    showPasswordModal() {
        document.getElementById('passwordModal').classList.add('show');
    }

    /**
     * 隐藏修改密码弹窗
     */
    hidePasswordModal() {
        document.getElementById('passwordModal').classList.remove('show');
        document.getElementById('passwordForm').reset();
    }

    /**
     * 处理密码修改
     */
    async handlePasswordChange() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // 验证
        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showToast('请填写所有字段', 'error');
            return;
        }

        if (newPassword.length < 6) {
            this.showToast('新密码长度至少6位', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showToast('两次输入的密码不一致', 'error');
            return;
        }

        try {
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showToast('密码修改成功', 'success');
                this.hidePasswordModal();
            } else {
                this.showToast(data.message || '密码修改失败', 'error');
            }

        } catch (error) {
            console.error('修改密码失败:', error);
            this.showToast('网络错误，请稍后重试', 'error');
        }
    }

    /**
     * 显示加载状态
     */
    showLoading() {
        document.getElementById('loadingContainer').classList.add('show');
    }

    /**
     * 隐藏加载状态
     */
    hideLoading() {
        document.getElementById('loadingContainer').classList.remove('show');
    }

    /**
     * 显示Toast通知
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };

        toast.innerHTML = `
            <i class="fas ${icons[type]} toast-icon"></i>
            <div class="toast-message">${message}</div>
        `;

        container.appendChild(toast);

        // 3秒后自动移除
        setTimeout(() => {
            toast.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }
}

// 初始化
const profileManager = new ProfileManager();


