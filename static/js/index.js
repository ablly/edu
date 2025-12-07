document.addEventListener('DOMContentLoaded', function() {
    /* ========================================
   EduPilot AI教育首页交互
   基于Context7 MCP的AI教育设计模式
   ======================================== */

// AI英雄区域动态效果
function initAIHeroEffects() {
    // 英雄区域背景动态效果
    const heroBackground = document.querySelector('.ai-hero-background');
    if (heroBackground) {
        // 鼠标移动视差效果
        document.addEventListener('mousemove', (e) => {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;
            
            heroBackground.style.transform = `translate(${x * 20}px, ${y * 20}px)`;
        });
    }
    
    // AI特性徽章动画
    const featureBadges = document.querySelectorAll('.ai-feature-badge');
    featureBadges.forEach((badge, index) => {
        badge.addEventListener('mouseenter', () => {
            badge.style.transform = 'scale(1.05) translateY(-2px)';
            badge.style.background = 'rgba(255, 255, 255, 0.2)';
        });
        
        badge.addEventListener('mouseleave', () => {
            badge.style.transform = 'scale(1) translateY(0)';
            badge.style.background = 'rgba(255, 255, 255, 0.1)';
        });
    });
}

// AI功能导航交互
function initAINavigationEffects() {
    const navItems = document.querySelectorAll('.ai-nav-item');
    
    navItems.forEach((item, index) => {
        item.addEventListener('mouseenter', () => {
            // 添加发光效果
            item.style.boxShadow = 'var(--shadow-ai-glow)';
            
            // 图标动画
            const icon = item.querySelector('.ai-nav-icon');
            if (icon) {
                icon.style.transform = 'rotate(5deg) scale(1.1)';
            }
        });
        
        item.addEventListener('mouseleave', () => {
            item.style.boxShadow = 'var(--shadow-xl)';
            
            const icon = item.querySelector('.ai-nav-icon');
            if (icon) {
                icon.style.transform = 'rotate(0deg) scale(1)';
            }
        });
        
        // 点击波纹效果
        item.addEventListener('click', (e) => {
            const ripple = document.createElement('div');
            ripple.className = 'ripple-effect';
            
            const rect = item.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(102, 126, 234, 0.3);
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            `;
            
            item.style.position = 'relative';
            item.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// AI功能卡片交互
function initAIFeatureCards() {
    const featureCards = document.querySelectorAll('.ai-feature-card');
    
    featureCards.forEach((card) => {
        card.addEventListener('mouseenter', () => {
            // 卡片发光效果
            card.style.boxShadow = 'var(--shadow-ai-hover)';
            
            // 统计数字动画
            const statValues = card.querySelectorAll('.ai-stat-value');
            statValues.forEach((stat) => {
                stat.style.transform = 'scale(1.1)';
                stat.style.color = 'var(--accent-color)';
            });
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.boxShadow = 'var(--shadow-xl)';
            
            const statValues = card.querySelectorAll('.ai-stat-value');
            statValues.forEach((stat) => {
                stat.style.transform = 'scale(1)';
                stat.style.color = 'var(--primary-color)';
            });
        });
    });
}

// 智能按钮效果
function initSmartButtons() {
    const aiButtons = document.querySelectorAll('.btn-ai-primary, .btn-ai-secondary, .btn-ai-outline');
    
    aiButtons.forEach((button) => {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-3px) scale(1.02)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(-2px) scale(1)';
        });
        
        button.addEventListener('mousedown', () => {
            button.style.transform = 'translateY(0) scale(0.98)';
        });
        
        button.addEventListener('mouseup', () => {
            button.style.transform = 'translateY(-2px) scale(1)';
        });
    });
}

// 页面加载动画
function initPageLoadAnimation() {
    // 英雄区域淡入
    const heroContent = document.querySelector('.ai-hero-content');
    if (heroContent) {
        heroContent.style.opacity = '0';
        heroContent.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            heroContent.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
            heroContent.style.opacity = '1';
            heroContent.style.transform = 'translateY(0)';
        }, 200);
    }
    
    // 功能导航项依次显示
    const navItems = document.querySelectorAll('.ai-nav-item');
    navItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(30px)';
        
        setTimeout(() => {
            item.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            item.style.opacity = '1';
            item.style.transform = 'translateX(0)';
        }, 400 + index * 100);
    });
    
    // 功能卡片依次显示
    const featureCards = document.querySelectorAll('.ai-feature-card');
    featureCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(40px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 800 + index * 200);
    });
}

// 滚动视差效果
function initScrollParallax() {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.ai-hero-background');
        
        parallaxElements.forEach((element) => {
            const speed = 0.5;
            element.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });
}

// AI技术导航交互
function initAITechNavigation() {
    const techNavBtns = document.querySelectorAll('.ai-tech-nav-btn');
    const techPanels = document.querySelectorAll('.ai-tech-panel');
    
    techNavBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            const targetTech = btn.dataset.tech;
            
            // 移除所有活动状态
            techNavBtns.forEach(b => b.classList.remove('active'));
            techPanels.forEach(p => {
                p.classList.remove('active');
                p.style.display = 'none';
            });
            
            // 激活选中的按钮和面板
            btn.classList.add('active');
            const targetPanel = document.getElementById(targetTech);
            if (targetPanel) {
                targetPanel.style.display = 'block';
                setTimeout(() => {
                    targetPanel.classList.add('active');
                }, 50);
            }
            
            // 按钮点击动画
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                btn.style.transform = 'scale(1)';
            }, 150);
        });
        
        // 按钮hover效果增强
        btn.addEventListener('mouseenter', () => {
            if (!btn.classList.contains('active')) {
                btn.style.transform = 'translateY(-3px) scale(1.02)';
            }
        });
        
        btn.addEventListener('mouseleave', () => {
            if (!btn.classList.contains('active')) {
                btn.style.transform = 'translateY(0) scale(1)';
            }
        });
    });
    
    // 自动切换技术展示（可选）
    let autoSwitchInterval;
    let currentTechIndex = 0;
    
    function startAutoSwitch() {
        autoSwitchInterval = setInterval(() => {
            currentTechIndex = (currentTechIndex + 1) % techNavBtns.length;
            techNavBtns[currentTechIndex].click();
        }, 8000); // 8秒切换一次
    }
    
    function stopAutoSwitch() {
        if (autoSwitchInterval) {
            clearInterval(autoSwitchInterval);
        }
    }
    
    // 当用户与技术导航交互时停止自动切换
    techNavBtns.forEach((btn) => {
        btn.addEventListener('click', stopAutoSwitch);
    });
    
    // 启动自动切换（延迟5秒开始）
    setTimeout(startAutoSwitch, 5000);
}

// 响应式导航栏切换
    const navbarToggle = document.getElementById('navbarToggle');
    const navbarNav = document.getElementById('navbarNav');
    
    if (navbarToggle && navbarNav) {
        navbarToggle.addEventListener('click', function() {
            navbarNav.classList.toggle('show');
            
            // 切换汉堡菜单图标动画
            const spans = this.querySelectorAll('span');
            spans.forEach((span, index) => {
                span.style.transform = navbarNav.classList.contains('show') ? 
                    (index === 0 ? 'rotate(45deg) translate(5px, 5px)' : 
                     index === 1 ? 'opacity(0)' : 
                     'rotate(-45deg) translate(7px, -6px)') : '';
            });
        });
        
        // 点击导航链接时关闭移动菜单
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    navbarNav.classList.remove('show');
                    // 重置汉堡菜单图标
                    const spans = navbarToggle.querySelectorAll('span');
                    spans.forEach(span => {
                        span.style.transform = '';
                    });
                }
            });
        });
        
        // 点击外部区域关闭菜单
        document.addEventListener('click', function(e) {
            if (!navbarToggle.contains(e.target) && !navbarNav.contains(e.target)) {
                navbarNav.classList.remove('show');
                const spans = navbarToggle.querySelectorAll('span');
                spans.forEach(span => {
                    span.style.transform = '';
                });
            }
        });
    }
    
    // 轮播功能
    const carousel = document.querySelector('.carousel');
    const items = document.querySelectorAll('.carousel-item');
    if (carousel && items.length > 0) {
        let currentIndex = 0;
        const itemHeight = items[0].offsetHeight;
        const intervalTime = 3000; // 3秒切换一次

        function slideToNext() {
            currentIndex = (currentIndex + 1) % items.length;
            carousel.style.transform = `translateY(-${currentIndex * itemHeight}px)`;
        }

        setInterval(slideToNext, intervalTime);
    }
    
    // 特征卡片悬停效果
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-8px)';
            card.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = '';
        });
    });

    // 技术特性导航
    const techNavLinks = document.querySelectorAll('.nav-link[data-target]');
    const techSections = document.querySelectorAll('.yo section');
    
    techNavLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 移除所有链接的active类
            techNavLinks.forEach(l => l.classList.remove('active-nav'));
            // 为当前链接添加active类
            this.classList.add('active-nav');
            
            // 获取目标section的ID
            const targetId = this.getAttribute('data-target');
            
            // 隐藏所有section
            techSections.forEach(section => {
                section.style.display = 'none';
            });
            
            // 显示目标section
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.style.display = 'block';
            }
        });
    });
    
    // 默认显示第一个技术特性section
    if (techSections.length > 0) {
        techSections[0].style.display = 'block';
    }
    
    // 平滑滚动效果
    const scrollLinks = document.querySelectorAll('a[href^="#"]');
    scrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            const targetElement = document.querySelector(href);
            
            if (targetElement) {
                const offsetTop = targetElement.getBoundingClientRect().top + window.pageYOffset - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // 滚动时导航栏背景透明度变化
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            const opacity = Math.min(scrolled / 100, 0.95);
            navbar.style.backgroundColor = `rgba(255, 255, 255, ${opacity})`;
            navbar.style.backdropFilter = scrolled > 50 ? 'blur(10px)' : 'none';
        });
    }
    
    // 添加页面加载动画
    const heroSection = document.querySelector('.ya');
    if (heroSection) {
        heroSection.style.opacity = '0';
        heroSection.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            heroSection.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            heroSection.style.opacity = '1';
            heroSection.style.transform = 'translateY(0)';
        }, 100);
    }
    
    // 响应式处理
    function handleResize() {
        if (window.innerWidth > 768) {
            navbarNav.classList.remove('show');
            const spans = navbarToggle?.querySelectorAll('span');
            spans?.forEach(span => {
                span.style.transform = '';
            });
        }
    }
    
    window.addEventListener('resize', handleResize);
    
    // 初始化所有AI教育效果
    initAIHeroEffects();
    initAINavigationEffects();
    initAIFeatureCards();
    initSmartButtons();
    initPageLoadAnimation();
    initScrollParallax();
    initAITechNavigation();
    
    // 添加波纹动画CSS
    (function() {
        const indexStyle = document.createElement('style');
        indexStyle.textContent = `
            @keyframes ripple {
                0% {
                    transform: scale(0);
                    opacity: 0.6;
                }
                100% {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(indexStyle);
    })();
});
    })();
});