// ==================== Toast通知系统 ====================
class ToastNotification {
    constructor() {
        this.container = document.getElementById('toast-container');
    }

    show(title, message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
        
        toast.innerHTML = `
            <i class="fas ${icon}"></i>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;
        
        this.container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    success(title, message) {
        this.show(title, message, 'success');
    }

    error(title, message) {
        this.show(title, message, 'error');
    }
}

const toast = new ToastNotification();

// ==================== 表单切换 ====================
class FormSwitcher {
    constructor() {
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        this.switchButtons = document.querySelectorAll('.switch-form');
        
        this.init();
    }

    init() {
        this.switchButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.currentTarget.dataset.target;
                this.switchTo(target);
            });
        });
    }

    switchTo(formType) {
        if (formType === 'login') {
            this.registerForm.classList.add('hidden');
            this.loginForm.classList.remove('hidden');
        } else if (formType === 'register') {
            this.loginForm.classList.add('hidden');
            this.registerForm.classList.remove('hidden');
        }
    }
}

// ==================== 登录处理 ====================
class LoginHandler {
    constructor() {
        this.form = document.getElementById('loginFormElement');
        if (!this.form) {
            console.error('登录表单未找到: loginFormElement');
            return;
        }
        this.submitButton = this.form.querySelector('button[type="submit"]');
        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.form);
        const data = {
            username: formData.get('username'),
            password: formData.get('password'),
            remember: formData.get('remember') === 'on'
        };

        // 前端验证
        if (!data.username || !data.password) {
            toast.error('验证失败', '请填写所有必填字段');
            return;
        }

        // 显示加载状态
        this.setLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                toast.success('登录成功', '欢迎回来！');
                
                // 延迟跳转，让用户看到成功消息
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            } else {
                // 处理账户锁定
                if (result.locked) {
                    let message = result.error || '账户已被锁定';
                    
                    // 优先使用服务器计算的剩余时间，避免时区问题
                    if (result.remaining_minutes) {
                        message = `账户已被锁定，请在 ${result.remaining_minutes} 分钟后重试`;
                    } else if (result.remaining_seconds) {
                        const minutes = Math.ceil(result.remaining_seconds / 60);
                        message = `账户已被锁定，请在 ${minutes} 分钟后重试`;
                    } else if (result.locked_until) {
                        // 备用方案：手动计算，但要处理UTC时间
                        const lockedUntil = new Date(result.locked_until);
                        const now = new Date();
                        const remainingMs = lockedUntil.getTime() - now.getTime();
                        if (remainingMs > 0) {
                            const remainingMinutes = Math.ceil(remainingMs / 60000);
                            message = `账户已被锁定，请在 ${remainingMinutes} 分钟后重试`;
                        } else {
                            message = '账户锁定已过期，请重新尝试登录';
                        }
                    }
                    
                    toast.error('账户已锁定', message);
                    
                    // 禁用登录按钮一段时间
                    this.submitButton.disabled = true;
                    setTimeout(() => {
                        this.submitButton.disabled = false;
                    }, 5000);
                } 
                // 处理登录失败但还有剩余次数
                else if (result.remaining_attempts !== undefined) {
                    let message = result.error || '用户名或密码错误';
                    if (result.remaining_attempts <= 2 && result.remaining_attempts > 0) {
                        message += `\n还有 ${result.remaining_attempts} 次尝试机会`;
                    } else if (result.remaining_attempts === 0) {
                        message = '登录失败次数过多，账户已被锁定';
                    }
                    toast.error('登录失败', message);
                } 
                // 普通错误
                else {
                    toast.error('登录失败', result.error || '用户名或密码错误');
                }
            }
        } catch (error) {
            console.error('登录错误:', error);
            toast.error('登录失败', '网络错误,请稍后重试');
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(loading) {
        if (loading) {
            this.submitButton.disabled = true;
            this.submitButton.classList.add('loading');
            this.submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 登录中...';
        } else {
            this.submitButton.disabled = false;
            this.submitButton.classList.remove('loading');
            this.submitButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> 登录';
        }
    }
}

// ==================== 注册处理 ====================
class RegisterHandler {
    constructor() {
        this.form = document.getElementById('registerFormElement');
        if (!this.form) {
            console.error('注册表单未找到: registerFormElement');
            return;
        }
        this.submitButton = this.form.querySelector('button[type="submit"]');
        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // 实时验证
        const passwordInput = document.getElementById('register-password');
        const confirmPasswordInput = document.getElementById('register-confirm-password');
        
        if (confirmPasswordInput && passwordInput) {
            confirmPasswordInput.addEventListener('input', () => {
                this.validatePasswordMatch(passwordInput, confirmPasswordInput);
            });
        }
    }

    validatePasswordMatch(passwordInput, confirmPasswordInput) {
        if (confirmPasswordInput.value && passwordInput.value !== confirmPasswordInput.value) {
            confirmPasswordInput.setCustomValidity('两次输入的密码不一致');
        } else {
            confirmPasswordInput.setCustomValidity('');
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.form);
        const data = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirm-password')
        };

        // 前端验证
        if (!data.username || !data.email || !data.password || !data.confirmPassword) {
            toast.error('验证失败', '请填写所有必填字段');
            return;
        }

        if (data.password !== data.confirmPassword) {
            toast.error('验证失败', '两次输入的密码不一致');
            return;
        }

        if (data.password.length < 6) {
            toast.error('验证失败', '密码长度至少为6个字符');
            return;
        }

        // 显示加载状态
        this.setLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: data.username,
                    email: data.email,
                    password: data.password
                })
            });

            const result = await response.json();

            if (response.ok) {
                toast.success('注册成功', '请使用新账号登录');
                
                // 延迟后切换到登录表单
                setTimeout(() => {
                    const switcher = new FormSwitcher();
                    switcher.switchTo('login');
                    
                    // 自动填充用户名
                    const loginUsernameInput = document.getElementById('login-username');
                    if (loginUsernameInput) {
                        loginUsernameInput.value = data.username;
                    }
                }, 1500);
            } else {
                toast.error('注册失败', result.error || '注册失败,请稍后重试');
            }
        } catch (error) {
            console.error('注册错误:', error);
            toast.error('注册失败', '网络错误,请稍后重试');
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(loading) {
        if (loading) {
            this.submitButton.disabled = true;
            this.submitButton.classList.add('loading');
            this.submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 注册中...';
        } else {
            this.submitButton.disabled = false;
            this.submitButton.classList.remove('loading');
            this.submitButton.innerHTML = '<i class="fas fa-user-plus"></i> 注册';
        }
    }
}

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('登录页面初始化...');
    
    new FormSwitcher();
    new LoginHandler();
    new RegisterHandler();
    
    // 检查URL参数，自动切换表单
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    
    if (action === 'register') {
        const switcher = new FormSwitcher();
        switcher.switchTo('register');
    }
    
    console.log('登录页面初始化完成');
});
