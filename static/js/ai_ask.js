/**
 * AI答疑页面JavaScript
 * 现代化聊天界面功能
 */

class AIAssistant {
    constructor() {
        this.currentConversationId = null;
        this.conversations = new Map();
        this.isTyping = false;
        this.messageId = 0;
        
        this.initializeElements();
        this.bindEvents();
        this.loadConversations();
        
        // 如果没有历史对话或当前没有选中的对话，显示欢迎消息
        if (this.conversations.size === 0 || !this.currentConversationId) {
            this.initializeWelcome();
        }
    }

    initializeElements() {
        // 核心元素
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.messageForm = document.getElementById('messageForm');
        this.sendBtn = document.getElementById('sendBtn');
        this.charCount = document.getElementById('charCount');
        
        // 侧边栏元素
        this.newChatBtn = document.getElementById('newChatBtn');
        this.conversationList = document.getElementById('conversationList');
        
        // 头部操作按钮
        this.clearChatBtn = document.getElementById('clearChatBtn');
        this.exportChatBtn = document.getElementById('exportChatBtn');
        
        // 上传相关元素
        this.attachBtn = document.getElementById('attachBtn');
        this.uploadModal = document.getElementById('uploadModal');
        this.uploadModalClose = document.getElementById('uploadModalClose');
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.selectFileBtn = document.getElementById('selectFileBtn');
        
        // 消息容器
        this.messageContainer = document.getElementById('messageContainer');
    }

    bindEvents() {
        // 表单提交
        this.messageForm.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // 输入框事件
        this.messageInput.addEventListener('input', () => this.handleInputChange());
        this.messageInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // 侧边栏事件
        this.newChatBtn.addEventListener('click', () => this.startNewChat());
        
        // 头部操作按钮
        this.clearChatBtn.addEventListener('click', () => this.clearCurrentChat());
        this.exportChatBtn.addEventListener('click', () => this.exportChat());

        // 上传相关事件
        this.attachBtn.addEventListener('click', () => this.showUploadModal());
        this.uploadModalClose.addEventListener('click', () => this.hideUploadModal());
        this.selectFileBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // 拖拽上传
        this.setupDragAndDrop();

        // 快速问题按钮
        this.bindQuickQuestions();
        
        // 功能按钮
        this.bindFeatureButtons();
        
        // 模态框外部点击关闭
        this.uploadModal.addEventListener('click', (e) => {
            if (e.target === this.uploadModal) {
                this.hideUploadModal();
            }
        });
    }

    handleSubmit(e) {
        e.preventDefault();
        const message = this.messageInput.value.trim();
        
        if (!message || this.isTyping) return;
        
        this.sendMessage(message);
    }

    handleInputChange() {
        const length = this.messageInput.value.length;
        this.charCount.textContent = length;
        
        // 自动调整高度
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
        
        // 更新发送按钮状态
        this.sendBtn.disabled = !this.messageInput.value.trim() || this.isTyping;
    }

    handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSubmit(e);
        }
    }

    async sendMessage(message) {
        if (!this.currentConversationId) {
            this.startNewChat();
        }

        // 添加用户消息
        this.addMessage('user', message);
        
        // 清空输入框
        this.messageInput.value = '';
        this.handleInputChange();
        
        // 显示AI正在输入
        this.showTypingIndicator();
        
        try {
            // 发送到后端API
            const response = await this.callAIAPI(message);

            // 隐藏输入指示器
            this.hideTypingIndicator();
            
            // 添加AI响应
            this.addMessage('assistant', response);
            
        } catch (error) {
            console.error('AI API调用失败:', error);
            this.hideTypingIndicator();
            this.addMessage('assistant', '抱歉，我遇到了一些问题，请稍后再试。');
            this.showToast('发送失败，请检查网络连接', 'error');
        }
    }

    async callAIAPI(message) {
        try {
            // 调用后端真实的AI API
            const response = await fetch('/api/ai/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    question: message,
                    session_id: this.currentConversationId
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                
                // 处理未登录错误 (401)
                if (response.status === 401) {
                    this.showAuthError('请先登录后使用此功能', '/login');
                    throw new Error('未登录');
                }
                
                // 处理无会员权限错误 (403)
                if (response.status === 403) {
                    this.showAuthError('请购买会员后使用本功能', '/payment');
                    throw new Error('无会员权限');
                }
                
                throw new Error(errorData.error || errorData.message || `请求失败: ${response.status}`);
            }

            const data = await response.json();
            return data.answer;

        } catch (error) {
            console.error('AI API调用失败:', error);
            throw error;
        }
    }
    
    showAuthError(message, redirectUrl) {
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
        
        // 添加样式
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
    }

    addMessage(sender, content, timestamp = new Date()) {
        const messageId = ++this.messageId;
        const messageEl = document.createElement('div');
        messageEl.className = `message ${sender}`;
        messageEl.dataset.messageId = messageId;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        messageText.textContent = content;
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = this.formatTime(timestamp);
        
        messageContent.appendChild(messageText);
        messageContent.appendChild(messageTime);
        messageEl.appendChild(messageContent);
        
        // 移除欢迎消息
        const welcomeMessage = this.messagesContainer.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }
        
        this.messagesContainer.appendChild(messageEl);
        this.scrollToBottom();

        // 保存到当前对话
        if (this.currentConversationId) {
            const conversation = this.conversations.get(this.currentConversationId);
            if (conversation) {
                conversation.messages.push({
                    id: messageId,
                    sender,
                    content,
                    timestamp
                });
                conversation.lastMessage = content.substring(0, 50) + (content.length > 50 ? '...' : '');
                conversation.updatedAt = timestamp;
                
                this.saveConversations();
                this.updateConversationList();
            }
        }
    }

    showTypingIndicator() {
        this.isTyping = true;
        this.sendBtn.disabled = true;
        
        const typingEl = document.createElement('div');
        typingEl.className = 'message assistant typing-indicator';
        typingEl.innerHTML = `
            <div class="message-content">
                <div class="message-text">
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;
        
        this.messagesContainer.appendChild(typingEl);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.isTyping = false;
        this.sendBtn.disabled = !this.messageInput.value.trim();
        
        const typingIndicator = this.messagesContainer.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    startNewChat() {
        const conversationId = 'conv_' + Date.now();
        const conversation = {
            id: conversationId,
            title: '新对话',
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            lastMessage: ''
        };
        
        this.conversations.set(conversationId, conversation);
        this.currentConversationId = conversationId;

        // 清空消息容器并显示欢迎消息
        this.messagesContainer.innerHTML = '';
        this.initializeWelcome();
        
        this.updateConversationList();
        this.saveConversations();
        
        // 聚焦输入框
        this.messageInput.focus();
        
        this.showToast('已创建新对话', 'success');
        }

    loadConversation(conversationId) {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) return;
        
        this.currentConversationId = conversationId;
        this.messagesContainer.innerHTML = '';
        
        if (conversation.messages.length === 0) {
            this.initializeWelcome();
        } else {
            conversation.messages.forEach(msg => {
                this.addMessageToDOM(msg);
            });
        }
        
        this.updateConversationList();
        this.scrollToBottom();
    }

    addMessageToDOM(messageData) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${messageData.sender}`;
        messageEl.dataset.messageId = messageData.id;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        messageText.textContent = messageData.content;
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = this.formatTime(new Date(messageData.timestamp));
        
        messageContent.appendChild(messageText);
        messageContent.appendChild(messageTime);
        messageEl.appendChild(messageContent);
        
        this.messagesContainer.appendChild(messageEl);
    }

    clearCurrentChat() {
        if (!this.currentConversationId) return;
        
        if (confirm('确定要清空当前对话吗？此操作不可撤销。')) {
            const conversation = this.conversations.get(this.currentConversationId);
            if (conversation) {
                conversation.messages = [];
                conversation.lastMessage = '';
                this.messagesContainer.innerHTML = '';
                this.initializeWelcome();
                this.updateConversationList();
                this.saveConversations();
                this.showToast('对话已清空', 'success');
            }
        }
    }

    exportChat() {
        if (!this.currentConversationId) {
            this.showToast('没有可导出的对话', 'warning');
            return;
        }
        
        const conversation = this.conversations.get(this.currentConversationId);
        if (!conversation || conversation.messages.length === 0) {
            this.showToast('当前对话为空', 'warning');
            return;
        }
        
        let exportText = `AI答疑对话记录\n`;
        exportText += `对话标题: ${conversation.title}\n`;
        exportText += `创建时间: ${this.formatDateTime(conversation.createdAt)}\n`;
        exportText += `更新时间: ${this.formatDateTime(conversation.updatedAt)}\n`;
        exportText += `消息数量: ${conversation.messages.length}\n\n`;
        exportText += '=' * 50 + '\n\n';
        
        conversation.messages.forEach((msg, index) => {
            exportText += `[${index + 1}] ${msg.sender === 'user' ? '用户' : 'AI助手'} (${this.formatDateTime(msg.timestamp)})\n`;
            exportText += `${msg.content}\n\n`;
        });
        
        // 创建下载链接
        const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AI答疑对话_${this.formatDate(new Date())}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('对话已导出', 'success');
    }

    updateConversationList() {
        this.conversationList.innerHTML = '';
        
        // 按更新时间排序
        const sortedConversations = Array.from(this.conversations.values())
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        
        sortedConversations.forEach(conv => {
            const item = document.createElement('div');
            item.className = 'conversation-item';
            if (conv.id === this.currentConversationId) {
                item.classList.add('active');
            }
            
            item.innerHTML = `
                <div class="conversation-content">
                    <div class="conversation-title">${conv.title}</div>
                    <div class="conversation-time">${this.formatRelativeTime(conv.updatedAt)}</div>
                </div>
                <button class="conversation-delete-btn" title="删除对话">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;
            
            // 点击对话内容区域加载对话
            const contentArea = item.querySelector('.conversation-content');
            contentArea.addEventListener('click', () => {
                this.loadConversation(conv.id);
            });
            
            // 点击删除按钮删除对话
            const deleteBtn = item.querySelector('.conversation-delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止事件冒泡
                this.deleteConversation(conv.id);
            });
            
            this.conversationList.appendChild(item);
        });
    }

    deleteConversation(conversationId) {
        if (!conversationId) return;
        
        const conversation = this.conversations.get(conversationId);
        if (!conversation) return;
        
        // 确认删除
        if (!confirm(`确定要删除对话"${conversation.title}"吗？此操作不可撤销。`)) {
            return;
        }
        
        // 从集合中删除
        this.conversations.delete(conversationId);
        
        // 如果删除的是当前对话，创建新对话
        if (this.currentConversationId === conversationId) {
            this.startNewChat();
        }
        
        // 更新列表
        this.updateConversationList();
        
        // 保存到localStorage
        this.saveConversations();
        
        this.showToast('对话已删除', 'success');
    }

    loadConversations() {
        try {
            const saved = localStorage.getItem('ai_conversations');
            if (saved) {
                const data = JSON.parse(saved);
                data.forEach(conv => {
                    // 转换日期字符串回Date对象
                    conv.createdAt = new Date(conv.createdAt);
                    conv.updatedAt = new Date(conv.updatedAt);
                    conv.messages.forEach(msg => {
                        msg.timestamp = new Date(msg.timestamp);
                });
                    this.conversations.set(conv.id, conv);
                });
                this.updateConversationList();
            }
        } catch (error) {
            console.error('加载对话历史失败:', error);
        }
    }

    saveConversations() {
        try {
            const data = Array.from(this.conversations.values());
            localStorage.setItem('ai_conversations', JSON.stringify(data));
        } catch (error) {
            console.error('保存对话历史失败:', error);
        }
    }

    initializeWelcome() {
        // 检查是否已经有欢迎消息，如果有就不重复添加
        const existingWelcome = this.messagesContainer.querySelector('.welcome-message');
        if (existingWelcome) {
            return;
        }

        const welcomeEl = document.createElement('div');
        welcomeEl.className = 'welcome-message';
        welcomeEl.innerHTML = `
            <div class="welcome-content">
                <div class="welcome-icon">
                    <i class="fas fa-graduation-cap"></i>
                </div>
                <h3>欢迎使用AI答疑系统</h3>
                <p>我是您的学习助手，可以帮助您：</p>
                <ul class="welcome-features">
                    <li><i class="fas fa-check"></i> 解答学科问题</li>
                    <li><i class="fas fa-check"></i> 解释复杂概念</li>
                    <li><i class="fas fa-check"></i> 提供学习建议</li>
                    <li><i class="fas fa-check"></i> 代码调试帮助</li>
                </ul>
                <div class="quick-questions">
                    <p>试试这些问题：</p>
                    <button class="quick-btn" data-question="什么是面向对象编程？">什么是面向对象编程？</button>
                    <button class="quick-btn" data-question="如何理解递归算法？">如何理解递归算法？</button>
                    <button class="quick-btn" data-question="数据结构有哪些类型？">数据结构有哪些类型？</button>
                </div>
            </div>
        `;
        
        this.messagesContainer.appendChild(welcomeEl);
        this.bindQuickQuestions();
    }

    bindQuickQuestions() {
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const question = btn.dataset.question;
                this.messageInput.value = question;
                this.handleInputChange();
                this.sendMessage(question);
            });
        });
    }

    bindFeatureButtons() {
        document.querySelectorAll('.feature-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const feature = btn.dataset.feature;
                this.handleFeatureClick(feature);
            });
        });
    }

    handleFeatureClick(feature) {
        const prompts = {
            qa: '请问您有什么学习问题需要解答？',
            explain: '请告诉我您想了解的概念或知识点。',
            solve: '请描述您遇到的题目或问题，我来帮您分析解答。',
            code: '请贴出您的代码，我来帮您分析和优化。'
        };
        
        this.messageInput.value = prompts[feature] || '';
        this.handleInputChange();
        this.messageInput.focus();
    }

    // 文件上传相关方法
    showUploadModal() {
        this.uploadModal.classList.add('show');
    }

    hideUploadModal() {
        this.uploadModal.classList.remove('show');
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    setupDragAndDrop() {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.uploadArea.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            this.uploadArea.addEventListener(eventName, () => {
                this.uploadArea.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.uploadArea.addEventListener(eventName, () => {
                this.uploadArea.classList.remove('drag-over');
            }, false);
        });

        this.uploadArea.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.processFile(files[0]);
            }
        }, false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    processFile(file) {
        // 检查文件大小 (10MB限制)
        if (file.size > 10 * 1024 * 1024) {
            this.showToast('文件大小不能超过10MB', 'error');
            return;
        }

        // 检查文件类型
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
        if (!allowedTypes.includes(file.type)) {
            this.showToast('不支持的文件类型', 'error');
            return;
        }

        this.hideUploadModal();
        this.showToast(`文件 "${file.name}" 上传成功`, 'success');
        
        // 这里可以添加实际的文件上传逻辑
        // 例如：上传到服务器，然后在聊天中显示文件信息
    }

    // 工具方法
    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 100);
    }

    formatTime(date) {
        return date.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    formatDate(date) {
        return date.toLocaleDateString('zh-CN').replace(/\//g, '-');
    }

    formatDateTime(date) {
        return date.toLocaleString('zh-CN');
    }

    formatRelativeTime(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        if (days < 7) return `${days}天前`;
        return this.formatDate(new Date(date));
        }

    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="${icons[type]}"></i>
            <span>${message}</span>
        `;
        
        this.messageContainer.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, duration);
    }
    }

// 添加输入指示器的CSS样式
(function() {
    const aiAskStyle = document.createElement('style');
    aiAskStyle.textContent = `
    .typing-indicator .typing-dots {
        display: flex;
        gap: 4px;
        align-items: center;
    }
    
    .typing-dots span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--text-muted);
        animation: typing 1.4s infinite ease-in-out;
    }
    
    .typing-dots span:nth-child(2) {
        animation-delay: 0.2s;
    }
    
    .typing-dots span:nth-child(3) {
        animation-delay: 0.4s;
    }
    
    @keyframes typing {
        0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
        }
        30% {
            transform: translateY(-10px);
            opacity: 1;
        }
    }
`;
    document.head.appendChild(aiAskStyle);
})();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.aiAssistant = new AIAssistant();
});
