/**
 * 会员中心管理类
 */
class MembershipCenter {
    constructor() {
        this.currentTab = 'privileges';
        this.membershipData = null;
        this.currentPeriod = 'daily';
        this.paymentCheckInterval = null;
        this.currentPayment = null;
        
        this.init();
    }

    async init() {
        console.log('[会员中心] 初始化...');
        this.bindEvents();
        await this.loadMembershipData();
        this.renderCurrentStatus();
        this.renderPrivilegesTab();
    }

    bindEvents() {
        // Tab切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });

        // 时间周期切换
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const period = btn.dataset.period;
                this.changePeriod(period);
            });
        });

        // 关闭支付弹窗
        const closeBtn = document.getElementById('closePaymentModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closePaymentModal();
            });
        }

        // 支付方式选择
        document.querySelectorAll('.payment-method-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.payment-method-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // 点击弹窗外部关闭
        document.getElementById('paymentModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'paymentModal') {
                this.closePaymentModal();
            }
        });
    }

    async loadMembershipData() {
        try {
            console.log('[会员中心] 加载会员数据...');
            
            // 获取当前用户信息
            const userRes = await fetch('/api/auth/current-user');
            if (!userRes.ok) throw new Error('获取用户信息失败');
            const userData = await userRes.json();
            
            // 获取会员历史
            const historyRes = await fetch('/api/membership/history');
            if (!historyRes.ok) throw new Error('获取会员历史失败');
            const historyData = await historyRes.json();
            
            this.membershipData = {
                user: userData,
                current_membership: historyData.current_membership,
                purchase_history: historyData.purchase_history
            };
            
            console.log('[会员中心] 会员数据加载成功:', this.membershipData);
            return this.membershipData;
            
        } catch (error) {
            console.error('[会员中心] 加载会员数据失败:', error);
            this.showToast('加载会员数据失败', 'error');
            return null;
        }
    }

    renderCurrentStatus() {
        const card = document.getElementById('membershipStatusCard');
        if (!card || !this.membershipData) return;

        const membership = this.membershipData.current_membership;
        const user = this.membershipData.user;

        if (!membership) {
            // 显示免费会员
            card.innerHTML = `
                <div class="status-header">
                    <div class="status-tier">
                        <div class="tier-icon">✨</div>
                        <div class="tier-info">
                            <h2>免费会员</h2>
                            <span class="tier-badge">
                                <i class="fas fa-star"></i>
                                基础功能
                            </span>
                        </div>
                    </div>
                    <div class="status-actions">
                        <button class="status-btn primary" onclick="membershipCenter.switchTab('upgrade')">
                            <i class="fas fa-crown"></i>
                            立即升级
                        </button>
                    </div>
                </div>
                <div class="status-details">
                    <div class="status-detail-item">
                        <div class="detail-label">会员等级</div>
                        <div class="detail-value">免费版</div>
                        <div class="detail-sub">体验基础功能</div>
                    </div>
                    <div class="status-detail-item">
                        <div class="detail-label">累计使用</div>
                        <div class="detail-value">${user.usage_count || 0}</div>
                        <div class="detail-sub">次功能调用</div>
                    </div>
                    <div class="status-detail-item">
                        <div class="detail-label">升级优惠</div>
                        <div class="detail-value">8折</div>
                        <div class="detail-sub">首次升级专享</div>
                    </div>
                </div>
            `;
            return;
        }

        // 显示付费会员
        const tierIcons = {
            'free': '✨',
            'weekly': '🌟',
            'monthly': '⭐',
            'yearly': '👑'
        };

        const tierNames = {
            'free': '免费会员',
            'weekly': '周度会员',
            'monthly': '月度会员',
            'yearly': '年度会员'
        };

        const icon = tierIcons[membership.tier_code] || '✨';
        const name = tierNames[membership.tier_code] || membership.tier_name;
        
        card.innerHTML = `
            <div class="status-header">
                <div class="status-tier">
                    <div class="tier-icon">${icon}</div>
                    <div class="tier-info">
                        <h2>${name}</h2>
                        <span class="tier-badge tier-${membership.tier_code}">
                            <i class="fas fa-crown"></i>
                            VIP会员
                        </span>
                    </div>
                </div>
                <div class="status-actions">
                    ${membership.days_remaining > 0 ? `
                        <button class="status-btn" onclick="membershipCenter.switchTab('billing')">
                            <i class="fas fa-file-invoice"></i>
                            查看账单
                        </button>
                    ` : ''}
                    <button class="status-btn primary" onclick="membershipCenter.switchTab('upgrade')">
                        <i class="fas fa-rocket"></i>
                        ${membership.days_remaining > 0 ? '续费升级' : '立即续费'}
                    </button>
                </div>
            </div>
            <div class="status-details">
                <div class="status-detail-item">
                    <div class="detail-label">会员到期</div>
                    <div class="detail-value">${membership.days_remaining}</div>
                    <div class="detail-sub">天后到期</div>
                </div>
                <div class="status-detail-item">
                    <div class="detail-label">开通时间</div>
                    <div class="detail-value">${membership.start_date || '-'}</div>
                    <div class="detail-sub">至 ${membership.end_date || '-'}</div>
                </div>
                <div class="status-detail-item">
                    <div class="detail-label">累计使用</div>
                    <div class="detail-value">${user.usage_count || 0}</div>
                    <div class="detail-sub">次功能调用</div>
                </div>
                ${membership.auto_renew ? `
                    <div class="status-detail-item">
                        <div class="detail-label">自动续费</div>
                        <div class="detail-value">已开启</div>
                        <div class="detail-sub">到期自动续费</div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    async renderPrivilegesTab() {
        const pane = document.getElementById('privileges-pane');
        if (!pane) return;

        try {
            // 从API获取所有套餐
            const response = await fetch('/api/membership/tiers');
            if (!response.ok) throw new Error('获取套餐失败');
            const data = await response.json();
            const allTiers = data.tiers || data;

            // 获取当前会员等级
            const currentTier = this.membershipData?.current_membership?.tier_code || 'free';

            // 套餐图标映射
            const tierIcons = {
                'free': '✨',
                'weekly': '🌟',
                'monthly': '⭐',
                'yearly': '👑',
                'early_bird_1': '🔥',
                'early_bird_2': '🔥',
                'early_bird_3': '🔥'
            };

            const privilegesHTML = allTiers.map(tier => {
                const icon = tierIcons[tier.code] || '💎';
                const duration = tier.duration_days >= 365 ? '/年' : tier.duration_days >= 30 ? '/月' : tier.duration_days >= 7 ? '/周' : '永久';
                const features = Array.isArray(tier.features) ? tier.features : (tier.features ? JSON.parse(tier.features) : ['所有AI功能']);
                
                return `
                <div class="privilege-card ${tier.code === currentTier ? 'current' : ''}">
                    <div class="privilege-header">
                        <div class="privilege-icon">${icon}</div>
                        <div class="privilege-name">${tier.name}</div>
                        <div class="privilege-price">¥${tier.price}</div>
                        <div class="privilege-duration">${duration}</div>
                    </div>
                    <ul class="privilege-features">
                        ${features.slice(0, 8).map(feature => `
                            <li>
                                <i class="fas fa-check-circle"></i>
                                <span>${feature}</span>
                            </li>
                        `).join('')}
                    </ul>
                    ${tier.code === currentTier ? `
                        <div style="text-align: center; margin-top: 1rem; padding: 0.5rem; background: rgba(99, 102, 241, 0.1); border-radius: 8px; color: var(--primary-color); font-weight: 600;">
                            <i class="fas fa-check"></i> 当前套餐
                        </div>
                    ` : ''}
                </div>
            `}).join('');

            pane.innerHTML = `
                <div class="privileges-table">
                    ${privilegesHTML}
                </div>
            `;
        } catch (error) {
            console.error('加载套餐信息失败:', error);
            pane.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 1rem; display: block; color: var(--danger-color);"></i>
                    <p>套餐信息加载失败，请刷新页面重试</p>
                </div>
            `;
        }
    }

    async renderUpgradeTab() {
        const pane = document.getElementById('upgrade-pane');
        if (!pane) return;

        try {
            // 直接引导用户到支付页面
            pane.innerHTML = `
                <div class="upgrade-guide">
                    <div class="guide-header">
                        <i class="fas fa-rocket"></i>
                        <h2>升级会员，解锁更多功能</h2>
                        <p>选择适合您的套餐，享受更多AI教育功能</p>
                    </div>
                    
                    <div class="early-bird-notice">
                        <div class="notice-icon">🔥</div>
                        <div class="notice-content">
                            <h3>限时早鸟优惠</h3>
                            <p>年卡低至¥99，仅限前50人，先到先得！</p>
                        </div>
                    </div>
                    
                    <div class="upgrade-benefits">
                        <h3>会员特权</h3>
                        <div class="benefits-grid">
                            <div class="benefit-item">
                                <i class="fas fa-infinity"></i>
                                <span>AI功能无限制使用</span>
                            </div>
                            <div class="benefit-item">
                                <i class="fas fa-brain"></i>
                                <span>智能讲义生成</span>
                            </div>
                            <div class="benefit-item">
                                <i class="fas fa-file-alt"></i>
                                <span>智能题库出题</span>
                            </div>
                            <div class="benefit-item">
                                <i class="fas fa-code"></i>
                                <span>编程辅助</span>
                            </div>
                            <div class="benefit-item">
                                <i class="fas fa-video"></i>
                                <span>视频内容总结</span>
                            </div>
                            <div class="benefit-item">
                                <i class="fas fa-chart-line"></i>
                                <span>学习数据分析</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="upgrade-action">
                        <a href="/payment" class="upgrade-btn">
                            <i class="fas fa-crown"></i>
                            立即选择套餐
                        </a>
                        <p class="upgrade-hint">支持支付宝支付，安全便捷</p>
                    </div>
                </div>
            `;
            
            return;
            
            // 保留原有逻辑作为备用
            const res = await fetch('/api/membership/upgrade-options');
            if (!res.ok) throw new Error('获取升级选项失败');
            
            const data = await res.json();
            
            if (data.upgrade_options.length === 0) {
                pane.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                        <i class="fas fa-crown" style="font-size: 48px; margin-bottom: 1rem; display: block;"></i>
                        <p>暂无可升级套餐</p>
                    </div>
                `;
                return;
            }

            const upgradeHTML = data.upgrade_options.map((option, index) => {
                const isRecommended = index === 1; // 推荐第二个套餐
                const discount = ((1 - option.discount_price / option.price) * 100).toFixed(0);
                
                return `
                    <div class="upgrade-card ${isRecommended ? 'recommended' : ''}">
                        <div class="upgrade-header">
                            <div class="upgrade-name">${option.tier_name}</div>
                            <div class="upgrade-price-wrapper">
                                ${option.is_upgrade ? `
                                    <div class="upgrade-original-price">原价 ¥${option.price.toFixed(2)}</div>
                                    <div class="upgrade-price">¥${option.discount_price.toFixed(2)}</div>
                                    <span class="upgrade-discount">${discount}折优惠</span>
                                ` : `
                                    <div class="upgrade-price">¥${option.price.toFixed(2)}</div>
                                `}
                            </div>
                        </div>
                        <ul class="upgrade-features">
                            ${option.features.slice(0, 6).map(feature => `
                                <li>
                                    <i class="fas fa-check"></i>
                                    <span>${feature}</span>
                                </li>
                            `).join('')}
                        </ul>
                        <button class="upgrade-btn" onclick="membershipCenter.handleUpgrade(${option.tier_id}, '${option.tier_name}', ${option.discount_price})">
                            <i class="fas fa-rocket"></i>
                            ${option.is_upgrade ? '立即升级' : '立即购买'}
                        </button>
                    </div>
                `;
            }).join('');

            pane.innerHTML = `<div class="upgrade-grid">${upgradeHTML}</div>`;
            
        } catch (error) {
            console.error('[会员中心] 加载升级选项失败:', error);
            pane.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--danger-color);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 1rem; display: block;"></i>
                    <p>加载升级选项失败</p>
                </div>
            `;
        }
    }

    async renderHistoryTab() {
        const statsContainer = document.getElementById('historyStats');
        if (!statsContainer) return;

        try {
            const res = await fetch(`/api/usage/stats?period=${this.currentPeriod}`);
            if (!res.ok) throw new Error('获取使用统计失败');
            
            const data = await res.json();
            
            if (!data.stats || Object.keys(data.stats).length === 0) {
                statsContainer.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: var(--text-secondary); grid-column: 1 / -1;">
                        <i class="fas fa-chart-line" style="font-size: 48px; margin-bottom: 1rem; display: block;"></i>
                        <p>暂无使用记录</p>
                    </div>
                `;
                return;
            }

            const featureNames = {
                'ai_ask': 'AI答疑',
                'generate_question': '智能出题',
                'generate_lecture': '智能讲义',
                'programming_help': '辅助编程',
                'video_summary': '视频总结'
            };

            const featureIcons = {
                'ai_ask': 'fa-comments',
                'generate_question': 'fa-clipboard-question',
                'generate_lecture': 'fa-book-open',
                'programming_help': 'fa-code',
                'video_summary': 'fa-video'
            };

            const statsHTML = Object.entries(data.stats).map(([feature, stat]) => {
                const percentage = stat.limit > 0 ? (stat.used / stat.limit * 100).toFixed(1) : 0;
                const name = featureNames[feature] || feature;
                const icon = featureIcons[feature] || 'fa-star';
                
                return `
                    <div class="stat-card">
                        <div class="stat-header">
                            <span class="stat-name">${name}</span>
                            <i class="fas ${icon} stat-icon"></i>
                        </div>
                        <div class="stat-progress">
                            <div class="stat-progress-bar" style="width: ${Math.min(percentage, 100)}%"></div>
                        </div>
                        <div class="stat-numbers">
                            <span class="stat-used">已使用 ${stat.used}</span>
                            <span class="stat-limit">限额 ${stat.limit === -1 ? '无限' : stat.limit}</span>
                        </div>
                    </div>
                `;
            }).join('');

            statsContainer.innerHTML = statsHTML;
            
        } catch (error) {
            console.error('[会员中心] 加载使用历史失败:', error);
            statsContainer.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--danger-color); grid-column: 1 / -1;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 1rem; display: block;"></i>
                    <p>加载使用历史失败</p>
                </div>
            `;
        }
    }

    async renderBillingTab() {
        const billingList = document.getElementById('billingList');
        const autoRenewSection = document.getElementById('autoRenewSection');
        
        if (!billingList) return;

        // 渲染支付记录
        if (this.membershipData?.purchase_history && this.membershipData.purchase_history.length > 0) {
            const billingHTML = this.membershipData.purchase_history.map(payment => {
                const statusClass = payment.status === 'completed' ? 'completed' : 
                                   payment.status === 'pending' ? 'pending' : 'failed';
                const statusText = payment.status === 'completed' ? '已支付' :
                                  payment.status === 'pending' ? '待支付' : '失败';
                
                return `
                    <div class="billing-item">
                        <div class="billing-info">
                            <div class="billing-tier">${payment.tier_name}</div>
                            <div class="billing-details">
                                <span><i class="fas fa-calendar"></i> ${payment.created_at}</span>
                                <span><i class="fas fa-credit-card"></i> ${payment.payment_method}</span>
                                <span><i class="fas fa-receipt"></i> ${payment.transaction_id}</span>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div class="billing-amount">¥${payment.amount.toFixed(2)}</div>
                            <div class="billing-status ${statusClass}">
                                <i class="fas ${statusClass === 'completed' ? 'fa-check-circle' : statusClass === 'pending' ? 'fa-clock' : 'fa-times-circle'}"></i>
                                ${statusText}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            billingList.innerHTML = billingHTML;
        } else {
            billingList.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <i class="fas fa-file-invoice" style="font-size: 48px; margin-bottom: 1rem; display: block;"></i>
                    <p>暂无支付记录</p>
                </div>
            `;
        }

        // 渲染自动续费设置
        if (autoRenewSection && this.membershipData?.current_membership) {
            const autoRenew = this.membershipData.current_membership.auto_renew;
            
            autoRenewSection.innerHTML = `
                <div class="auto-renew-header">
                    <div>
                        <div class="auto-renew-title">自动续费</div>
                        <div class="auto-renew-desc">开启后会员到期自动续费，避免服务中断</div>
                    </div>
                    <div class="auto-renew-switch ${autoRenew ? 'active' : ''}" onclick="membershipCenter.toggleAutoRenew()">
                    </div>
                </div>
            `;
        }
    }

    async handleUpgrade(tierId, tierName, price) {
        console.log('[会员中心] 准备购买:', { tierId, tierName, price });
        
        try {
            // 创建支付订单
            const res = await fetch('/api/payment/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tier_id: tierId,
                    payment_method: 'alipay'
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || '创建订单失败');
            }

            const orderData = await res.json();
            this.currentPayment = orderData;
            
            console.log('[会员中心] 订单创建成功:', orderData);
            
            // 显示支付弹窗
            this.showPaymentModal(orderData, tierName, price);
            
        } catch (error) {
            console.error('[会员中心] 创建订单失败:', error);
            this.showToast(error.message || '创建订单失败', 'error');
        }
    }

    showPaymentModal(orderData, tierName, price) {
        const modal = document.getElementById('paymentModal');
        const paymentInfo = document.getElementById('paymentInfo');
        const qrCode = document.getElementById('paymentQRCode');
        const expireTime = document.getElementById('paymentExpireTime');
        
        if (!modal) return;

        // 显示支付信息
        if (paymentInfo) {
            paymentInfo.innerHTML = `
                <div class="payment-info-item">
                    <span class="payment-info-label">套餐名称</span>
                    <span class="payment-info-value">${tierName}</span>
                </div>
                <div class="payment-info-item">
                    <span class="payment-info-label">订单号</span>
                    <span class="payment-info-value">${orderData.order_id}</span>
                </div>
                <div class="payment-info-item">
                    <span class="payment-info-label">支付金额</span>
                    <span class="payment-info-value amount">¥${price.toFixed(2)}</span>
                </div>
            `;
        }

        // 显示二维码
        if (qrCode && orderData.qr_code_url) {
            qrCode.innerHTML = `
                <img src="${orderData.qr_code_url}" alt="支付二维码" />
            `;
        }

        // 显示过期时间
        if (expireTime) {
            expireTime.innerHTML = `<i class="fas fa-clock"></i> 订单将于 ${orderData.expire_time} 过期`;
        }

        // 显示弹窗
        modal.classList.add('active');

        // 开始轮询支付状态
        this.startPaymentCheck(orderData.transaction_id);
    }

    startPaymentCheck(transactionId) {
        console.log('[会员中心] 开始检查支付状态...');
        
        // 清除之前的轮询
        if (this.paymentCheckInterval) {
            clearInterval(this.paymentCheckInterval);
        }

        // 立即检查一次
        this.checkPaymentStatus(transactionId);

        // 每2秒检查一次
        this.paymentCheckInterval = setInterval(() => {
            this.checkPaymentStatus(transactionId);
        }, 2000);
    }

    async checkPaymentStatus(transactionId) {
        try {
            const res = await fetch(`/api/payment/check-status/${transactionId}`);
            if (!res.ok) throw new Error('查询支付状态失败');
            
            const data = await res.json();
            console.log('[会员中心] 支付状态:', data);

            if (data.status === 'completed') {
                // 支付成功
                this.onPaymentSuccess();
            }
            
        } catch (error) {
            console.error('[会员中心] 查询支付状态失败:', error);
        }
    }

    onPaymentSuccess() {
        console.log('[会员中心] 支付成功!');
        
        // 停止轮询
        if (this.paymentCheckInterval) {
            clearInterval(this.paymentCheckInterval);
            this.paymentCheckInterval = null;
        }

        // 显示成功状态
        const statusDiv = document.getElementById('paymentStatus');
        if (statusDiv) {
            statusDiv.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <h3>支付成功!</h3>
                <p>会员权益已生效,即将刷新页面...</p>
            `;
            statusDiv.className = 'payment-status success';
        }

        // 延迟刷新页面
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }

    closePaymentModal() {
        const modal = document.getElementById('paymentModal');
        if (modal) {
            modal.classList.remove('active');
        }

        // 停止轮询
        if (this.paymentCheckInterval) {
            clearInterval(this.paymentCheckInterval);
            this.paymentCheckInterval = null;
        }
    }

    async toggleAutoRenew() {
        if (!this.membershipData?.current_membership) {
            this.showToast('您还不是会员', 'warning');
            return;
        }

        try {
            const res = await fetch('/api/membership/cancel-auto-renew', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || '操作失败');
            }

            const data = await res.json();
            this.showToast(data.message, 'success');
            
            // 重新加载数据
            await this.loadMembershipData();
            this.renderBillingTab();
            
        } catch (error) {
            console.error('[会员中心] 切换自动续费失败:', error);
            this.showToast(error.message || '操作失败', 'error');
        }
    }

    switchTab(tab) {
        // 更新Tab按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.dataset.tab === tab) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // 更新Tab内容显示
        document.querySelectorAll('.tab-pane').forEach(pane => {
            if (pane.id === `${tab}-pane`) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });

        this.currentTab = tab;

        // 加载对应Tab的内容
        if (tab === 'privileges') {
            this.renderPrivilegesTab();
        } else if (tab === 'upgrade') {
            this.renderUpgradeTab();
        } else if (tab === 'history') {
            this.renderHistoryTab();
        } else if (tab === 'billing') {
            this.renderBillingTab();
        }
    }

    changePeriod(period) {
        // 更新按钮状态
        document.querySelectorAll('.period-btn').forEach(btn => {
            if (btn.dataset.period === period) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        this.currentPeriod = period;
        this.renderHistoryTab();
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const iconMap = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        toast.innerHTML = `
            <i class="fas ${iconMap[type] || iconMap.info} toast-icon"></i>
            <span class="toast-message">${message}</span>
        `;

        container.appendChild(toast);

        // 3秒后自动移除
        setTimeout(() => {
            toast.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => {
                container.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// 初始化会员中心
let membershipCenter;
document.addEventListener('DOMContentLoaded', () => {
    membershipCenter = new MembershipCenter();
});

