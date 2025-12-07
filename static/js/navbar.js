/**
 * 通用导航栏功能
 * 适用于所有页面的导航栏交互和响应式设计
 */

class NavbarManager {
    constructor() {
        this.navbar = document.querySelector('.navbar');
        this.navbarToggle = document.getElementById('navbarToggle');
        this.navbarNav = document.getElementById('navbarNav');
        this.navLinks = document.querySelectorAll('.nav-link');
        
        this.isMenuOpen = false;
        this.scrollThreshold = 50;
        
        this.init();
    }

    /**
     * 初始化导航栏功能
     */
    init() {
        this.bindEvents();
        this.setActiveLink();
        this.handleScroll();
        this.loadUserInfo();
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 移动端菜单切换
        if (this.navbarToggle) {
            this.navbarToggle.addEventListener('click', () => this.toggleMobileMenu());
        }

        // 点击导航链接时关闭移动端菜单
        this.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 992) {
                    this.closeMobileMenu();
                }
            });
        });

        // 点击页面其他地方关闭移动端菜单
        document.addEventListener('click', (e) => {
            if (this.isMenuOpen && 
                !this.navbar.contains(e.target) && 
                !this.navbarToggle.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        // 窗口大小改变时重置菜单状态
        window.addEventListener('resize', () => {
            if (window.innerWidth > 992 && this.isMenuOpen) {
                this.closeMobileMenu();
            }
        });

        // 滚动事件
        window.addEventListener('scroll', () => this.handleScroll());
    }

    /**
     * 切换移动端菜单
     */
    toggleMobileMenu() {
        if (this.isMenuOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }

    /**
     * 打开移动端菜单
     */
    openMobileMenu() {
        if (this.navbarNav) {
            this.navbarNav.classList.add('show');
            this.navbarToggle.classList.add('active');
            this.isMenuOpen = true;
            document.body.style.overflow = 'hidden'; // 防止背景滚动
        }
    }

    /**
     * 关闭移动端菜单
     */
    closeMobileMenu() {
        if (this.navbarNav) {
            this.navbarNav.classList.remove('show');
            if (this.navbarToggle) {
                this.navbarToggle.classList.remove('active');
            }
            this.isMenuOpen = false;
            document.body.style.overflow = '';
        }
    }

    /**
     * 设置当前页面的导航链接为激活状态
     */
    setActiveLink() {
        const currentPage = window.location.pathname;
        
        this.navLinks.forEach(link => {
            link.classList.remove('active');
            const linkPath = new URL(link.href).pathname;
            
            if (linkPath === currentPage || 
                (linkPath !== '/' && currentPage.includes(linkPath))) {
                link.classList.add('active');
            }
        });
    }

    /**
     * 处理滚动事件
     */
    handleScroll() {
        if (!this.navbar) return;
        
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > this.scrollThreshold) {
            this.navbar.classList.add('scrolled');
        } else {
            this.navbar.classList.remove('scrolled');
        }
    }

    /**
     * 获取当前菜单状态
     */
    isMenuOpened() {
        return this.isMenuOpen;
    }

    /**
     * 添加导航项高亮效果
     */
    highlightNavItem(selector) {
        const item = document.querySelector(selector);
        if (item) {
            item.classList.add('highlight');
            setTimeout(() => {
                item.classList.remove('highlight');
            }, 2000);
        }
    }

    /**
     * 加载用户信息
     */
    async loadUserInfo() {
        try {
            const response = await fetch('/api/auth/current-user');
            if (response.ok) {
                const data = await response.json();
                if (data.logged_in) {
                    this.displayUserInfo(data.user, data.membership);
                } else {
                    this.displayLoginButton();
                }
            } else {
                this.displayLoginButton();
            }
        } catch (error) {
            console.error('获取用户信息失败:', error);
            this.displayLoginButton();
        }
    }

    /**
     * 显示用户信息
     */
    displayUserInfo(user, membership) {
        const navbar = document.querySelector('.navbar .navbar-container');
        if (!navbar) return;

        // 移除现有的用户信息或登录按钮
        const existingUserInfo = navbar.querySelector('.user-info');
        const existingLoginBtn = navbar.querySelector('.login-btn-nav');
        if (existingUserInfo) existingUserInfo.remove();
        if (existingLoginBtn) existingLoginBtn.remove();

        // 创建用户信息区域
        const userInfoHTML = `
            <div class="user-info">
                <div class="user-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="user-details">
                    <span class="user-name">${user.username}</span>
                    <span class="user-tier ${membership.tier_type}">${membership.tier_name}</span>
                </div>
                <div class="user-dropdown">
                    <button class="dropdown-toggle" id="userDropdown">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="dropdown-menu" id="userDropdownMenu">
                        <a href="/profile" class="dropdown-item">
                            <i class="fas fa-user"></i> 个人中心
                        </a>
                        <a href="/membership" class="dropdown-item">
                            <i class="fas fa-crown"></i> 会员中心
                        </a>
                        <div class="dropdown-divider"></div>
                        <button class="dropdown-item logout-btn" onclick="navbarManager.logout()">
                            <i class="fas fa-sign-out-alt"></i> 退出登录
                        </button>
                    </div>
                </div>
            </div>
        `;

        navbar.insertAdjacentHTML('beforeend', userInfoHTML);

        // 绑定下拉菜单事件
        this.bindUserDropdown();
    }

    /**
     * 显示登录按钮
     */
    displayLoginButton() {
        const navbar = document.querySelector('.navbar .navbar-container');
        if (!navbar) return;

        // 移除现有的用户信息
        const existingUserInfo = navbar.querySelector('.user-info');
        const existingLoginBtn = navbar.querySelector('.login-btn-nav');
        if (existingUserInfo) existingUserInfo.remove();
        if (existingLoginBtn) existingLoginBtn.remove();

        // 创建登录按钮
        const loginBtnHTML = `
            <a href="/login" class="login-btn-nav">
                <i class="fas fa-sign-in-alt"></i> 登录/注册
            </a>
        `;

        navbar.insertAdjacentHTML('beforeend', loginBtnHTML);
    }

    /**
     * 绑定用户下拉菜单事件
     */
    bindUserDropdown() {
        const dropdownToggle = document.getElementById('userDropdown');
        const dropdownMenu = document.getElementById('userDropdownMenu');

        if (dropdownToggle && dropdownMenu) {
            dropdownToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownMenu.classList.toggle('show');
            });

            // 点击页面其他地方关闭下拉菜单
            document.addEventListener('click', () => {
                dropdownMenu.classList.remove('show');
            });
        }
    }

    /**
     * 退出登录
     */
    async logout() {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // 退出成功，跳转到登录页
                window.location.href = '/login';
            } else {
                alert('退出登录失败，请重试');
            }
        } catch (error) {
            console.error('退出登录错误:', error);
            alert('退出登录失败，请重试');
        }
    }
}

// 页面加载完成后初始化导航栏
let navbarManager;

document.addEventListener('DOMContentLoaded', () => {
    try {
        navbarManager = new NavbarManager();
        console.log('导航栏管理器初始化成功');
    } catch (error) {
        console.error('导航栏初始化失败:', error);
    }
});

// 导出到全局作用域
window.NavbarManager = NavbarManager;
window.navbarManager = navbarManager;

// 添加一些实用的CSS动画类
(function() {
    const navbarStyle = document.createElement('style');
    navbarStyle.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    .animate-slide-in {
        animation: slideIn 0.3s ease-out forwards;
    }

    .nav-link.highlight {
        background: linear-gradient(135deg, var(--warning-color), var(--accent-color)) !important;
        color: white !important;
        transform: scale(1.05) !important;
        box-shadow: var(--shadow-md) !important;
    }

    /* 导航栏加载动画 */
    .navbar {
        animation: navbarFadeIn 0.5s ease-out;
    }

    @keyframes navbarFadeIn {
        from {
            opacity: 0;
            transform: translateY(-100%);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    /* 改善移动端菜单的视觉效果 */
    @media (max-width: 992px) {
        .navbar-nav.show {
            animation: mobileMenuSlide 0.3s ease-out;
        }

        @keyframes mobileMenuSlide {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    }
`;

    document.head.appendChild(navbarStyle);
})();


