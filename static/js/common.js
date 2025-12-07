/**
 * EduPilot 通用JavaScript模块
 * 提供API调用、工具函数和通用组件功能
 */

// ========== 权限错误处理 ==========
window.showAuthError = function(message, redirectUrl) {
    // 移除已存在的错误弹窗
    const existingModal = document.querySelector('.auth-error-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 创建友好的错误提示弹窗
    const modal = document.createElement('div');
    modal.className = 'auth-error-modal';
    modal.innerHTML = `
        <div class="auth-error-content">
            <div class="auth-error-icon">
                <i class="fas fa-lock"></i>
            </div>
            <h3>${message}</h3>
            <p>点击按钮${redirectUrl === '/login' ? '登录' : '购买会员'}后继续使用</p>
            <div class="auth-error-buttons">
                <button class="btn-primary" onclick="window.location.href='${redirectUrl}'">
                    ${redirectUrl === '/login' ? '立即登录' : '立即购买'}
                </button>
                <button class="btn-secondary" onclick="this.closest('.auth-error-modal').remove()">
                    稍后再说
                </button>
            </div>
        </div>
    `;
    
    // 添加样式（只添加一次）
    if (!document.getElementById('auth-error-styles')) {
        const style = document.createElement('style');
        style.id = 'auth-error-styles';
        style.textContent = `
            .auth-error-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            }
            .auth-error-content {
                background: white;
                padding: 40px;
                border-radius: 16px;
                text-align: center;
                max-width: 400px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.3s ease;
            }
            .auth-error-icon {
                font-size: 48px;
                color: #ff6b6b;
                margin-bottom: 20px;
            }
            .auth-error-content h3 {
                font-size: 20px;
                color: #333;
                margin-bottom: 10px;
            }
            .auth-error-content p {
                color: #666;
                margin-bottom: 30px;
            }
            .auth-error-buttons {
                display: flex;
                gap: 10px;
                justify-content: center;
            }
            .auth-error-buttons button {
                padding: 12px 30px;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.3s;
            }
            .auth-error-buttons .btn-primary {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            .auth-error-buttons .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
            }
            .auth-error-buttons .btn-secondary {
                background: #f0f0f0;
                color: #666;
            }
            .auth-error-buttons .btn-secondary:hover {
                background: #e0e0e0;
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(modal);
};

// ========== API 调用封装 ==========
class EduPilotAPI {
    constructor() {
        this.baseURL = '';
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    /**
     * 通用HTTP请求方法
     */
    async request(url, options = {}) {
        const config = {
            headers: { ...this.defaultHeaders, ...options.headers },
            ...options
        };

        try {
            const response = await fetch(this.baseURL + url, config);
            
            if (!response.ok) {
                // 处理 401 未登录
                if (response.status === 401) {
                    const errorData = await response.json().catch(() => ({}));
                    window.showAuthError(errorData.message || '请先登录后使用此功能', '/login');
                    throw new Error('未登录');
                }
                
                // 处理 403 无会员权限
                if (response.status === 403) {
                    const errorData = await response.json().catch(() => ({}));
                    window.showAuthError(errorData.message || '请购买会员后使用本功能', '/payment');
                    throw new Error('无会员权限');
                }
                
                throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return await response.text();
            }
        } catch (error) {
            console.error('API Request Error:', error);
            if (error.message !== '未登录' && error.message !== '无会员权限') {
                this.showErrorMessage(`请求失败: ${error.message}`);
            }
            throw error;
        }
    }

    // GET 请求
    async get(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, { method: 'GET' });
    }

    // POST 请求
    async post(url, data = {}) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT 请求
    async put(url, data = {}) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE 请求
    async delete(url) {
        return this.request(url, { method: 'DELETE' });
    }

    // 文件上传
    async uploadFile(url, file, additionalData = {}) {
        const formData = new FormData();
        formData.append('file', file);
        
        // 添加额外数据
        Object.keys(additionalData).forEach(key => {
            formData.append(key, additionalData[key]);
        });

        return this.request(url, {
            method: 'POST',
            body: formData,
            headers: {} // 让浏览器自动设置Content-Type
        });
    }

    // 显示错误消息
    showErrorMessage(message) {
        EduPilotUI.showToast(message, 'error');
    }
}

// ========== UI 组件和工具 ==========
class EduPilotUI {
    /**
     * 显示Toast通知
     */
    static showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-message">${message}</span>
                <button class="toast-close">&times;</button>
            </div>
        `;

        // 添加样式
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: '9999',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            color: 'white',
            fontSize: '14px',
            maxWidth: '300px',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease-in-out',
            backgroundColor: this.getToastColor(type)
        });

        document.body.appendChild(toast);

        // 动画显示
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);

        // 关闭按钮事件
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.hideToast(toast));

        // 自动关闭
        setTimeout(() => {
            this.hideToast(toast);
        }, duration);
    }

    static getToastColor(type) {
        const colors = {
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6'
        };
        return colors[type] || colors.info;
    }

    static hideToast(toast) {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    /**
     * 显示加载状态
     */
    static showLoading(element, text = '加载中...') {
        if (!element) return;

        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-text">${text}</div>
            </div>
        `;

        // 添加样式
        Object.assign(loadingOverlay.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '1000'
        });

        // 确保父元素有相对定位
        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }

        element.appendChild(loadingOverlay);
        return loadingOverlay;
    }

    static hideLoading(element) {
        if (!element) return;
        const overlay = element.querySelector('.loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    /**
     * 模态框控制
     */
    static showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    static hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    /**
     * 表单验证
     */
    static validateForm(formElement) {
        const errors = [];
        const inputs = formElement.querySelectorAll('input[required], textarea[required], select[required]');

        inputs.forEach(input => {
            const value = input.value.trim();
            const fieldName = input.getAttribute('data-name') || input.name || '字段';

            if (!value) {
                errors.push(`${fieldName}不能为空`);
                input.classList.add('is-invalid');
            } else {
                input.classList.remove('is-invalid');
                
                // 特定类型验证
                if (input.type === 'email' && !this.isValidEmail(value)) {
                    errors.push(`请输入有效的邮箱地址`);
                    input.classList.add('is-invalid');
                }
            }
        });

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * 数据表格工具
     */
    static createDataTable(container, data, columns, options = {}) {
        if (!container || !data || !columns) return;

        const table = document.createElement('table');
        table.className = 'data-table';

        // 创建表头
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        columns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column.title;
            th.setAttribute('data-key', column.key);
            if (column.width) {
                th.style.width = column.width;
            }
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // 创建表体
        const tbody = document.createElement('tbody');
        
        data.forEach(row => {
            const tr = document.createElement('tr');
            
            columns.forEach(column => {
                const td = document.createElement('td');
                const value = row[column.key];
                
                if (column.render) {
                    td.innerHTML = column.render(value, row);
                } else {
                    td.textContent = value || '';
                }
                
                tr.appendChild(td);
            });
            
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        
        // 清空容器并添加表格
        container.innerHTML = '';
        container.appendChild(table);

        return table;
    }
}

// ========== 工具函数 ==========
class EduPilotUtils {
    /**
     * 格式化日期
     */
    static formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
        if (!date) return '';
        
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');

        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    }

    /**
     * 防抖函数
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * 节流函数
     */
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    /**
     * 深拷贝对象
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }

    /**
     * 生成唯一ID
     */
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * 文件大小格式化
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 获取文件扩展名
     */
    static getFileExtension(filename) {
        return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
    }

    /**
     * 本地存储封装
     */
    static storage = {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (error) {
                console.error('Storage set error:', error);
            }
        },
        
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Storage get error:', error);
                return defaultValue;
            }
        },
        
        remove(key) {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.error('Storage remove error:', error);
            }
        },
        
        clear() {
            try {
                localStorage.clear();
            } catch (error) {
                console.error('Storage clear error:', error);
            }
        }
    };
}

// ========== 响应式导航组件 ==========
class ResponsiveNavbar {
    constructor(options = {}) {
        this.toggleSelector = options.toggleSelector || '#navbarToggle';
        this.navSelector = options.navSelector || '#navbarNav';
        this.linkSelector = options.linkSelector || '.nav-link';
        
        this.init();
    }

    init() {
        this.toggle = document.querySelector(this.toggleSelector);
        this.nav = document.querySelector(this.navSelector);
        this.links = document.querySelectorAll(this.linkSelector);

        if (this.toggle && this.nav) {
            this.bindEvents();
        }
    }

    bindEvents() {
        // 切换菜单
        this.toggle.addEventListener('click', () => this.toggleMenu());
        
        // 点击链接关闭菜单
        this.links.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    this.closeMenu();
                }
            });
        });

        // 点击外部关闭菜单
        document.addEventListener('click', (e) => {
            if (!this.toggle.contains(e.target) && !this.nav.contains(e.target)) {
                this.closeMenu();
            }
        });

        // 窗口大小改变时处理
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.closeMenu();
            }
        });
    }

    toggleMenu() {
        this.nav.classList.toggle('show');
        this.animateToggleIcon();
    }

    closeMenu() {
        this.nav.classList.remove('show');
        this.resetToggleIcon();
    }

    animateToggleIcon() {
        const spans = this.toggle.querySelectorAll('span');
        const isOpen = this.nav.classList.contains('show');
        
        spans.forEach((span, index) => {
            span.style.transform = isOpen ? 
                (index === 0 ? 'rotate(45deg) translate(5px, 5px)' : 
                 index === 1 ? 'opacity(0)' : 
                 'rotate(-45deg) translate(7px, -6px)') : '';
        });
    }

    resetToggleIcon() {
        const spans = this.toggle.querySelectorAll('span');
        spans.forEach(span => {
            span.style.transform = '';
        });
    }
}

// ========== 全局实例 ==========
window.EduPilotAPI = new EduPilotAPI();
window.EduPilotUI = EduPilotUI;
window.EduPilotUtils = EduPilotUtils;

// ========== DOM加载完成后初始化 ==========
document.addEventListener('DOMContentLoaded', function() {
    // 初始化响应式导航
    new ResponsiveNavbar();
    
    // 初始化所有模态框的关闭功能
    document.querySelectorAll('.modal').forEach(modal => {
        const closeBtn = modal.querySelector('.modal-close');
        const backdrop = modal.querySelector('.modal-backdrop');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                EduPilotUI.hideModal(modal.id);
            });
        }
        
        if (backdrop) {
            backdrop.addEventListener('click', () => {
                EduPilotUI.hideModal(modal.id);
            });
        }
    });

    // 初始化所有表单验证
    document.querySelectorAll('form[data-validate]').forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const validation = EduPilotUI.validateForm(form);
            
            if (!validation.isValid) {
                EduPilotUI.showToast(validation.errors.join('<br>'), 'error');
                return;
            }
            
            // 表单有效，可以提交
            console.log('Form is valid, submitting...');
        });
    });

    // 添加平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            
            if (target) {
                const offsetTop = target.getBoundingClientRect().top + window.pageYOffset - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}); 