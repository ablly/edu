/**
 * 忘记密码页面脚本
 */

class ForgotPasswordManager {
    constructor() {
        this.currentStep = 1;
        this.email = '';
        this.verificationCode = '';
        this.resetToken = '';
        this.resendTimer = null;
        this.resendCountdown = 60;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.initPasswordStrengthChecker();
    }
    
    bindEvents() {
        // 发送验证码
        document.getElementById('sendCodeBtn').addEventListener('click', () => {
            this.sendVerificationCode();
        });
        
        // 验证验证码
        document.getElementById('verifyCodeBtn').addEventListener('click', () => {
            this.verifyCode();
        });
        
        // 重新发送验证码
        document.getElementById('resendBtn').addEventListener('click', () => {
            this.resendVerificationCode();
        });
        
        // 重置密码
        document.getElementById('resetPasswordBtn').addEventListener('click', () => {
            this.resetPassword();
        });
        
        // 密码显示切换
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.togglePasswordVisibility(e.target.closest('.toggle-password'));
            });
        });
        
        // 密码强度检查
        document.getElementById('newPassword').addEventListener('input', () => {
            this.checkPasswordStrength();
        });
        
        // 邮箱输入回车发送
        document.getElementById('email').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendVerificationCode();
            }
        });
        
        // 验证码输入回车验证
        document.getElementById('verifyCode').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.verifyCode();
            }
        });
    }
    
    async sendVerificationCode() {
        const email = document.getElementById('email').value.trim();
        
        if (!email) {
            this.showError('请输入邮箱地址');
            return;
        }
        
        if (!this.isValidEmail(email)) {
            this.showError('请输入有效的邮箱地址');
            return;
        }
        
        const btn = document.getElementById('sendCodeBtn');
        const originalText = btn.innerHTML;
        
        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 发送中...';
            
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.email = email;
                document.getElementById('displayEmail').textContent = email;
                this.nextStep();
                this.startResendTimer();
                this.showSuccess('验证码已发送，请检查您的邮箱');
            } else {
                this.showError(result.message || '发送失败，请重试');
            }
        } catch (error) {
            console.error('发送验证码失败:', error);
            this.showError('网络错误，请检查网络连接');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
    
    async verifyCode() {
        const code = document.getElementById('verifyCode').value.trim();
        
        if (!code) {
            this.showError('请输入验证码');
            return;
        }
        
        if (code.length !== 6) {
            this.showError('验证码应为6位数字');
            return;
        }
        
        const btn = document.getElementById('verifyCodeBtn');
        const originalText = btn.innerHTML;
        
        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 验证中...';
            
            const response = await fetch('/api/auth/verify-reset-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email: this.email,
                    code: code 
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.verificationCode = code;
                this.resetToken = result.reset_token;
                this.nextStep();
                this.showSuccess('验证成功！请设置新密码');
            } else {
                this.showError(result.message || '验证码错误或已过期');
            }
        } catch (error) {
            console.error('验证失败:', error);
            this.showError('网络错误，请检查网络连接');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
    
    async resetPassword() {
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (!newPassword) {
            this.showError('请输入新密码');
            return;
        }
        
        if (!confirmPassword) {
            this.showError('请确认新密码');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            this.showError('两次输入的密码不一致');
            return;
        }
        
        if (!this.isValidPassword(newPassword)) {
            this.showError('密码需包含大小写字母、数字和特殊字符，长度8-20位');
            return;
        }
        
        const btn = document.getElementById('resetPasswordBtn');
        const originalText = btn.innerHTML;
        
        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 重置中...';
            
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: this.email,
                    reset_token: this.resetToken,
                    new_password: newPassword
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccess('密码重置成功！正在跳转到登录页面...');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                this.showError(result.message || '重置失败，请重试');
            }
        } catch (error) {
            console.error('重置密码失败:', error);
            this.showError('网络错误，请检查网络连接');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
    
    async resendVerificationCode() {
        if (!this.email) {
            this.showError('邮箱信息丢失，请重新开始');
            return;
        }
        
        const btn = document.getElementById('resendBtn');
        const originalText = btn.innerHTML;
        
        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 发送中...';
            
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: this.email })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.startResendTimer();
                this.showSuccess('验证码已重新发送');
            } else {
                this.showError(result.message || '发送失败，请重试');
            }
        } catch (error) {
            console.error('重新发送失败:', error);
            this.showError('网络错误，请检查网络连接');
        } finally {
            btn.innerHTML = originalText;
        }
    }
    
    nextStep() {
        // 隐藏当前步骤
        document.querySelector('.form-step.active').classList.remove('active');
        document.querySelector('.step.active').classList.remove('active');
        
        // 显示下一步骤
        this.currentStep++;
        document.getElementById(`step${this.currentStep}`).classList.add('active');
        document.querySelector(`[data-step="${this.currentStep}"]`).classList.add('active');
        
        // 清除之前的错误信息
        this.hideAlerts();
    }
    
    startResendTimer() {
        const resendBtn = document.getElementById('resendBtn');
        const resendText = document.getElementById('resendText');
        
        this.resendCountdown = 60;
        resendBtn.disabled = true;
        
        this.resendTimer = setInterval(() => {
            this.resendCountdown--;
            resendText.textContent = `${this.resendCountdown}秒后可重新发送`;
            
            if (this.resendCountdown <= 0) {
                clearInterval(this.resendTimer);
                resendBtn.disabled = false;
                resendText.textContent = '重新发送验证码';
            }
        }, 1000);
    }
    
    initPasswordStrengthChecker() {
        // 密码强度检查已在 checkPasswordStrength 方法中实现
    }
    
    checkPasswordStrength() {
        const password = document.getElementById('newPassword').value;
        const strengthFill = document.getElementById('strengthFill');
        const strengthText = document.getElementById('strengthText');
        
        if (!password) {
            strengthFill.style.width = '0%';
            strengthFill.className = 'strength-fill';
            strengthText.textContent = '密码强度：待输入';
            return;
        }
        
        let score = 0;
        let feedback = [];
        
        // 长度检查
        if (password.length >= 8) score += 1;
        else feedback.push('至少8位');
        
        // 大写字母
        if (/[A-Z]/.test(password)) score += 1;
        else feedback.push('包含大写字母');
        
        // 小写字母
        if (/[a-z]/.test(password)) score += 1;
        else feedback.push('包含小写字母');
        
        // 数字
        if (/\d/.test(password)) score += 1;
        else feedback.push('包含数字');
        
        // 特殊字符
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
        else feedback.push('包含特殊字符');
        
        // 更新显示
        const percentage = (score / 5) * 100;
        strengthFill.style.width = `${percentage}%`;
        
        if (score <= 2) {
            strengthFill.className = 'strength-fill weak';
            strengthText.textContent = '密码强度：弱';
        } else if (score <= 3) {
            strengthFill.className = 'strength-fill medium';
            strengthText.textContent = '密码强度：中等';
        } else if (score <= 4) {
            strengthFill.className = 'strength-fill strong';
            strengthText.textContent = '密码强度：强';
        } else {
            strengthFill.className = 'strength-fill very-strong';
            strengthText.textContent = '密码强度：很强';
        }
    }
    
    togglePasswordVisibility(button) {
        const targetId = button.dataset.target;
        const input = document.getElementById(targetId);
        const icon = button.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }
    
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    isValidPassword(password) {
        // 密码需包含大小写字母、数字和特殊字符，长度8-20位
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,20}$/;
        return passwordRegex.test(password);
    }
    
    showError(message) {
        const errorAlert = document.getElementById('errorAlert');
        const errorMessage = document.getElementById('errorMessage');
        
        errorMessage.textContent = message;
        errorAlert.style.display = 'block';
        
        // 隐藏成功提示
        document.getElementById('successAlert').style.display = 'none';
        
        // 3秒后自动隐藏
        setTimeout(() => {
            errorAlert.style.display = 'none';
        }, 5000);
    }
    
    showSuccess(message) {
        const successAlert = document.getElementById('successAlert');
        const successMessage = document.getElementById('successMessage');
        
        successMessage.textContent = message;
        successAlert.style.display = 'block';
        
        // 隐藏错误提示
        document.getElementById('errorAlert').style.display = 'none';
        
        // 3秒后自动隐藏
        setTimeout(() => {
            successAlert.style.display = 'none';
        }, 3000);
    }
    
    hideAlerts() {
        document.getElementById('errorAlert').style.display = 'none';
        document.getElementById('successAlert').style.display = 'none';
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new ForgotPasswordManager();
});
