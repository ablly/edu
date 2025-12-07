document.addEventListener('DOMContentLoaded', function() {
    // DOM元素引用
    const videoSummaryForm = document.getElementById('video-summary-form');
    const summaryResult = document.getElementById('summary-result');
    const saveNoteBtn = document.getElementById('save-note-btn');
    const clearNoteBtn = document.getElementById('clear-note-btn');
    const noteContent = document.getElementById('note-content');
    const noteMessage = document.getElementById('note-message');
    const noteHistory = document.getElementById('note-history');
    const noteContainer = document.getElementById('note-container');
    const videoFileInput = document.getElementById('video-file');
    const videoUrlInput = document.getElementById('video-url');

    // 当前处理的视频源
    let currentVideoSource = '';

    // 初始化
    init();

    function init() {
        setupDragAndDrop();
        setupFileValidation();
        bindEvents();
    }

    // 事件绑定
    function bindEvents() {
        // 表单提交
        videoSummaryForm.addEventListener('submit', handleVideoSubmit);
        
        // 笔记相关
        saveNoteBtn.addEventListener('click', handleNoteSave);
        clearNoteBtn.addEventListener('click', handleNoteClear);
        
        // 文件输入变化
        videoFileInput.addEventListener('change', handleFileChange);
        
        // URL输入变化
        videoUrlInput.addEventListener('input', handleUrlChange);
    }

    // 设置拖拽上传
    function setupDragAndDrop() {
        const dropZone = videoFileInput;
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, unhighlight, false);
        });

        dropZone.addEventListener('drop', handleDrop, false);

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        function highlight(e) {
            dropZone.style.borderColor = 'var(--primary-color)';
            dropZone.style.backgroundColor = '#f0f4ff';
        }

        function unhighlight(e) {
            dropZone.style.borderColor = 'var(--border-color)';
            dropZone.style.backgroundColor = '#fafbfc';
        }

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files.length > 0) {
                videoFileInput.files = files;
                handleFileChange();
            }
        }
    }

    // 设置文件验证
    function setupFileValidation() {
        const maxSize = 500 * 1024 * 1024; // 500MB
        const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'];
        
        videoFileInput.addEventListener('change', function() {
            const file = this.files[0];
            if (!file) return;

            // 文件大小验证
            if (file.size > maxSize) {
                showToast('文件大小超过500MB限制', 'error');
                this.value = '';
                return;
            }

            // 文件类型验证
            if (!allowedTypes.includes(file.type)) {
                showToast('不支持的文件格式，请上传视频文件', 'error');
                this.value = '';
                return;
            }

            showToast('文件选择成功: ' + file.name, 'success');
            
            // 清空URL输入
            videoUrlInput.value = '';
        });
    }

    // 处理文件变化
    function handleFileChange() {
        const file = videoFileInput.files[0];
        if (file) {
            updateFileDisplay(file);
            videoUrlInput.value = ''; // 清空URL
        }
    }

    // 处理URL变化
    function handleUrlChange() {
        if (videoUrlInput.value.trim()) {
            videoFileInput.value = ''; // 清空文件
        }
    }

    // 更新文件显示
    function updateFileDisplay(file) {
        const fileSize = formatFileSize(file.size);
        const fileName = file.name;
        
        // 可以在这里添加文件预览功能
        console.log(`选择的文件: ${fileName} (${fileSize})`);
    }

    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 显示消息函数（使用toast）
    function showMessage(message, type, targetDiv) {
        if (targetDiv === summaryResult) {
            showToast(message, type);
        } else {
        targetDiv.innerHTML = `
            <div class="message ${type}">
                <div class="message-content">${message}</div>
            </div>
        `;
        targetDiv.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Toast消息显示
    function showToast(message, type = 'info') {
        const messageContainer = document.getElementById('message-container') || createMessageContainer();
        
        const toast = document.createElement('div');
        toast.className = `message ${type}`;
        toast.innerHTML = `
            <div class="message-content">
                <i class="fas ${getIconClass(type)}"></i>
                ${message}
            </div>
        `;
        
        messageContainer.appendChild(toast);
        
        // 自动移除
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }
        }, 5000);
    }

    // 创建消息容器
    function createMessageContainer() {
        const container = document.createElement('div');
        container.id = 'message-container';
        container.className = 'message-container';
        document.body.appendChild(container);
        return container;
    }

    // 获取图标类
    function getIconClass(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    // 格式化视频总结内容
    function formatSummary(summary) {
        const paragraphs = summary.split('\n\n');
        return paragraphs.map(p => {
            // 识别标题（以数字或##开头的行）
            if (/^\d+\.|^#+/.test(p.trim())) {
                return `<h3 class="summary-heading">${p.trim()}</h3>`;
            }
            // 普通段落
            return `<p class="summary-paragraph">${p}</p>`;
        }).join('');
    }

    // 创建进度条
    function createProgressBar() {
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';
        progressContainer.innerHTML = `
            <div class="progress-bar">
                <div class="progress-fill" id="progress-fill"></div>
            </div>
            <div class="progress-text" id="progress-text">准备中...</div>
        `;
        return progressContainer;
    }

    // 更新进度
    function updateProgress(percent, text) {
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        
        if (progressFill) progressFill.style.width = percent + '%';
        if (progressText) progressText.textContent = text;
    }

    // 加载保存的笔记
    async function loadNotes(videoSource) {
        try {
            const response = await fetch(`/api/notes?video_source=${encodeURIComponent(videoSource)}`);
            if (!response.ok) throw new Error(`HTTP错误! 状态: ${response.status}`);

            const data = await response.json();

            noteHistory.innerHTML = data.notes && data.notes.length > 0
                ? data.notes.map(note => `
                    <div class="note-item">
                        <div class="note-timestamp">
                            <i class="fas fa-clock"></i>
                            ${new Date(note.timestamp).toLocaleString()}
                        </div>
                        <div class="note-text">${note.content.replace(/\n/g, '<br>')}</div>
                        <div class="note-actions-inline">
                            <button class="btn-small" onclick="editNote(${note.id})">
                                <i class="fas fa-edit"></i> 编辑
                            </button>
                            <button class="btn-small btn-danger" onclick="deleteNote(${note.id})">
                                <i class="fas fa-trash"></i> 删除
                            </button>
                        </div>
                    </div>
                `).join('')
                : '<div class="no-notes"><i class="fas fa-sticky-note"></i> 暂无历史笔记</div>';

        } catch (error) {
            console.error('加载笔记失败:', error);
            showToast('加载笔记失败: ' + error.message, 'error');
        }
    }

    // 提交视频总结表单
    async function handleVideoSubmit(e) {
        e.preventDefault();
        const videoUrl = videoUrlInput.value.trim();
        const videoFile = videoFileInput.files[0];

        if (!videoUrl && !videoFile) {
            showToast('请提供视频链接或上传视频文件', 'error');
            return;
        }

        // URL格式验证
        if (videoUrl && !isValidUrl(videoUrl)) {
            showToast('请输入有效的视频链接', 'error');
            return;
        }

        const formData = new FormData();
        if (videoFile) {
            formData.append('file', videoFile);
            currentVideoSource = videoFile.name;
        } else {
            formData.append('url', videoUrl);
            currentVideoSource = videoUrl;
        }

        // 显示进度条
        const progressBar = createProgressBar();
        summaryResult.innerHTML = '';
        summaryResult.appendChild(progressBar);

        try {
            updateProgress(10, '开始处理视频...');

            const response = await fetch('/api/ai/summarize-video', {
                method: 'POST',
                body: formData
            });

            updateProgress(50, '正在分析视频内容...');

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '请求失败');
            }

            updateProgress(80, '生成总结中...');
            const data = await response.json();
            
            updateProgress(100, '完成!');
            
            setTimeout(() => {
            const formattedSummary = formatSummary(data.summary);

            summaryResult.innerHTML = `
                <div class="summary-container">
                        <h3>
                            <i class="fas fa-video"></i>
                            视频总结：${videoFile ? videoFile.name : videoUrl}
                        </h3>
                    <div class="summary-content">${formattedSummary}</div>
                        <div class="summary-actions">
                            <button class="btn btn-secondary" onclick="copyToClipboard('${data.summary.replace(/'/g, "\\'")}')">
                                <i class="fas fa-copy"></i> 复制总结
                            </button>
                            <button class="btn btn-secondary" onclick="downloadSummary('${currentVideoSource}', '${data.summary.replace(/'/g, "\\'")}')">
                                <i class="fas fa-download"></i> 下载总结
                            </button>
                        </div>
                </div>
            `;

            // 显示笔记区域并加载现有笔记
            noteContainer.style.display = 'block';
                loadNotes(currentVideoSource);
            noteContainer.scrollIntoView({ behavior: 'smooth' });
                
                showToast('视频总结完成！', 'success');
            }, 500);

        } catch (error) {
            console.error('视频总结错误:', error);
            summaryResult.innerHTML = `
                <div class="message error">
                    <i class="fas fa-exclamation-circle"></i>
                    视频总结过程中出错: ${error.message}
                </div>
            `;
            showToast('视频总结失败: ' + error.message, 'error');
        }
    }

    // URL验证
    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    // 保存笔记
    async function handleNoteSave() {
        if (!currentVideoSource) {
            showToast('请先选择一个视频', 'error');
            return;
        }

        const noteText = noteContent.value.trim();
        if (!noteText) {
            showToast('笔记内容不能为空', 'error');
            return;
        }

        try {
            const response = await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    video_source: currentVideoSource,
                    content: noteText
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '保存失败');
            }

            showToast('笔记保存成功', 'success');
            await loadNotes(currentVideoSource);
            noteContent.value = '';

        } catch (error) {
            console.error('保存笔记错误:', error);
            showToast('保存笔记失败: ' + error.message, 'error');
        }
    }

    // 清空笔记输入框
    function handleNoteClear() {
        if (noteContent.value.trim() && !confirm('确定要清空当前笔记内容吗？')) return;
        noteContent.value = '';
        showToast('笔记内容已清空', 'info');
    }

    // 全局函数（供HTML调用）
    window.copyToClipboard = function(text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('总结已复制到剪贴板', 'success');
        }).catch(() => {
            showToast('复制失败，请手动复制', 'error');
        });
    };

    window.downloadSummary = function(source, summary) {
        const blob = new Blob([summary], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${source}_summary.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showToast('总结已下载', 'success');
    };

    window.editNote = function(noteId) {
        showToast('笔记编辑功能开发中...', 'info');
    };

    window.deleteNote = function(noteId) {
        if (confirm('确定要删除这条笔记吗？')) {
            showToast('笔记删除功能开发中...', 'info');
        }
    };
});
