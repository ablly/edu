// ========================================
// 智能讲义页面 JavaScript
// ========================================

// Toast 通知系统
class ToastNotification {
    constructor() {
        this.container = document.getElementById('toastContainer');
    }

    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const iconMap = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="fas ${iconMap[type]} toast-icon"></i>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        this.container.appendChild(toast);
        
        // 关闭按钮事件
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.hide(toast));
        
        // 自动消失
        setTimeout(() => this.hide(toast), duration);
        
        return toast;
    }

    hide(toast) {
        toast.classList.add('hiding');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    const toast = new ToastNotification();
    const form = document.getElementById('generate-lecture-form');
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const selectFileBtn = document.getElementById('selectFileBtn');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const removeFileBtn = document.getElementById('removeFileBtn');
    const loadingContainer = document.getElementById('loadingContainer');
    const lectureDisplay = document.getElementById('lectureDisplay');
    const submitBtn = document.getElementById('submitBtn');
    
    let currentFile = null;
    let currentLectureData = null;

    // 文件验证
    function validateFile(file) {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        if (!allowedTypes.includes(file.type)) {
            toast.show('文件格式不支持！请上传 PDF 或 Word 文件', 'error');
            return false;
        }
        
        if (file.size > maxSize) {
            toast.show('文件大小超过限制！最大支持 10MB', 'error');
            return false;
        }
        
        return true;
    }

    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    // 显示文件信息
    function showFileInfo(file) {
        currentFile = file;
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        uploadArea.style.display = 'none';
        fileInfo.style.display = 'block';
        toast.show('文件已选择，可以生成讲义了', 'success');
    }

    // 移除文件
    function removeFile() {
        currentFile = null;
        fileInput.value = '';
        uploadArea.style.display = 'block';
        fileInfo.style.display = 'none';
    }

    // 点击选择文件
    selectFileBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // 文件选择事件
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && validateFile(file)) {
            showFileInfo(file);
        }
    });

    // 移除文件按钮
    removeFileBtn.addEventListener('click', removeFile);

    // 拖拽上传功能
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        const file = e.dataTransfer.files[0];
        if (file && validateFile(file)) {
            fileInput.files = e.dataTransfer.files;
            showFileInfo(file);
        }
    });

    // 表单提交 - 生成讲义
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!currentFile) {
            toast.show('请先选择文件', 'warning');
            return;
        }
        
        const formData = new FormData();
        formData.append('file', currentFile);
        
        try {
            // 显示加载状态
            submitBtn.disabled = true;
            loadingContainer.style.display = 'block';
            lectureDisplay.style.display = 'none';
            
            const response = await fetch('/api/ai/generate-lecture', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `服务器错误: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.status === 'success' && data.lecture) {
                currentLectureData = data;
                renderLecture(data);
                lectureDisplay.style.display = 'block';
                toast.show('讲义生成成功！', 'success');
                
                // 滚动到讲义区域
                setTimeout(() => {
                    lectureDisplay.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 300);
            } else {
                throw new Error(data.error || '生成讲义失败');
            }
        } catch (error) {
            console.error('生成讲义错误:', error);
            toast.show('生成讲义失败: ' + error.message, 'error');
        } finally {
            loadingContainer.style.display = 'none';
            submitBtn.disabled = false;
        }
    });

    // 渲染讲义
    function renderLecture(data) {
        const { lecture, source_file } = data;
        const lectureContent = document.getElementById('lectureContent');
        const tocNav = document.getElementById('tocNav');
        
        // 清空内容
        lectureContent.innerHTML = '';
        tocNav.innerHTML = '';
        
        // 渲染讲义标题
        document.getElementById('lectureTitle').innerHTML = 
            `<i class="fas fa-book-open"></i> ${lecture.title || '讲义内容'}`;
        
        // 渲染各章节
        lecture.sections.forEach((section, index) => {
            const sectionId = `section-${index}`;
            
            // 添加到目录
            const tocItem = document.createElement('a');
            tocItem.className = 'toc-item';
            tocItem.href = `#${sectionId}`;
            tocItem.textContent = section.title;
            tocItem.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
                
                // 更新active状态
                document.querySelectorAll('.toc-item').forEach(item => {
                    item.classList.remove('active');
                });
                tocItem.classList.add('active');
            });
            tocNav.appendChild(tocItem);
            
            // 添加章节内容
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'lecture-section';
            sectionDiv.id = sectionId;
            
            let sectionHTML = `<h3>${section.title}</h3>`;
            
            if (section.content) {
                sectionHTML += `<p>${section.content}</p>`;
            }
            
            // 渲染子章节
            if (section.subsections && section.subsections.length > 0) {
                section.subsections.forEach(subsection => {
                    sectionHTML += `
                            <div class="subsection">
                            <h5>${subsection.title}</h5>
                            <p>${subsection.content}</p>
                    `;
                    
                    // 渲染关键要点
                    if (subsection.key_points && subsection.key_points.length > 0) {
                        sectionHTML += `
                            <div class="key-points">
                                <h6><i class="fas fa-star"></i> 关键要点</h6>
                                <ul>
                                    ${subsection.key_points.map(point => `<li>${point}</li>`).join('')}
                                </ul>
                </div>
            `;
                    }
                    
                    sectionHTML += `</div>`;
            });
            }
            
            sectionDiv.innerHTML = sectionHTML;
            lectureContent.appendChild(sectionDiv);
        });
        
        // 设置操作按钮
        setupActionButtons();
    }

    // 设置操作按钮
    function setupActionButtons() {
        // 复制按钮
        document.getElementById('copyBtn').addEventListener('click', function() {
            const content = document.getElementById('lectureContent');
            const text = content.innerText;
            
            navigator.clipboard.writeText(text).then(() => {
                toast.show('讲义内容已复制到剪贴板', 'success');
            }).catch(() => {
                toast.show('复制失败，请手动选择复制', 'error');
            });
        });
        
        // 下载按钮
        document.getElementById('downloadBtn').addEventListener('click', function() {
            if (!currentLectureData) return;
            
            const content = document.getElementById('lectureContent');
            let markdown = `# ${currentLectureData.lecture.title}\n\n`;
            markdown += `> 来源: ${currentLectureData.source_file}\n\n`;
            markdown += `---\n\n`;
            
            currentLectureData.lecture.sections.forEach(section => {
                markdown += `## ${section.title}\n\n`;
                if (section.content) {
                    markdown += `${section.content}\n\n`;
                }

                if (section.subsections) {
                    section.subsections.forEach(sub => {
                        markdown += `### ${sub.title}\n\n`;
                        markdown += `${sub.content}\n\n`;
                        
                        if (sub.key_points && sub.key_points.length > 0) {
                            markdown += `**关键要点：**\n\n`;
                            sub.key_points.forEach(point => {
                                markdown += `- ${point}\n`;
                            });
                            markdown += `\n`;
                        }
                    });
                }
            });
            
            const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `讲义_${currentLectureData.lecture.title}_${new Date().toLocaleDateString()}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            toast.show('讲义已下载为 Markdown 格式', 'success');
        });
        
        // 打印按钮
        document.getElementById('printBtn').addEventListener('click', function() {
            window.print();
        });
    }

    // 监听滚动，更新目录active状态
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('.lecture-section');
        const tocItems = document.querySelectorAll('.toc-item');
        
        let currentSection = '';
        
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= 150 && rect.bottom >= 150) {
                currentSection = section.id;
            }
        });
        
        tocItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${currentSection}`) {
                item.classList.add('active');
        }
        });
    });
});
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const removeFileBtn = document.getElementById('removeFileBtn');
    const loadingContainer = document.getElementById('loadingContainer');
    const lectureDisplay = document.getElementById('lectureDisplay');
    const submitBtn = document.getElementById('submitBtn');
    
    let currentFile = null;
    let currentLectureData = null;

    // 文件验证
    function validateFile(file) {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        if (!allowedTypes.includes(file.type)) {
            toast.show('文件格式不支持！请上传 PDF 或 Word 文件', 'error');
            return false;
        }
        
        if (file.size > maxSize) {
            toast.show('文件大小超过限制！最大支持 10MB', 'error');
            return false;
        }
        
        return true;
    }

    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    // 显示文件信息
    function showFileInfo(file) {
        currentFile = file;
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        uploadArea.style.display = 'none';
        fileInfo.style.display = 'block';
        toast.show('文件已选择，可以生成讲义了', 'success');
    }

    // 移除文件
    function removeFile() {
        currentFile = null;
        fileInput.value = '';
        uploadArea.style.display = 'block';
        fileInfo.style.display = 'none';
    }

    // 点击选择文件
    selectFileBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // 文件选择事件
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && validateFile(file)) {
            showFileInfo(file);
        }
    });

    // 移除文件按钮
    removeFileBtn.addEventListener('click', removeFile);

    // 拖拽上传功能
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        const file = e.dataTransfer.files[0];
        if (file && validateFile(file)) {
            fileInput.files = e.dataTransfer.files;
            showFileInfo(file);
        }
    });

    // 表单提交 - 生成讲义
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!currentFile) {
            toast.show('请先选择文件', 'warning');
            return;
        }
        
        const formData = new FormData();
        formData.append('file', currentFile);
        
        try {
            // 显示加载状态
            submitBtn.disabled = true;
            loadingContainer.style.display = 'block';
            lectureDisplay.style.display = 'none';
            
            const response = await fetch('/api/ai/generate-lecture', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `服务器错误: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.status === 'success' && data.lecture) {
                currentLectureData = data;
                renderLecture(data);
                lectureDisplay.style.display = 'block';
                toast.show('讲义生成成功！', 'success');
                
                // 滚动到讲义区域
                setTimeout(() => {
                    lectureDisplay.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 300);
            } else {
                throw new Error(data.error || '生成讲义失败');
            }
        } catch (error) {
            console.error('生成讲义错误:', error);
            toast.show('生成讲义失败: ' + error.message, 'error');
        } finally {
            loadingContainer.style.display = 'none';
            submitBtn.disabled = false;
        }
    });

    // 渲染讲义
    function renderLecture(data) {
        const { lecture, source_file } = data;
        const lectureContent = document.getElementById('lectureContent');
        const tocNav = document.getElementById('tocNav');
        
        // 清空内容
        lectureContent.innerHTML = '';
        tocNav.innerHTML = '';
        
        // 渲染讲义标题
        document.getElementById('lectureTitle').innerHTML = 
            `<i class="fas fa-book-open"></i> ${lecture.title || '讲义内容'}`;
        
        // 渲染各章节
        lecture.sections.forEach((section, index) => {
            const sectionId = `section-${index}`;
            
            // 添加到目录
            const tocItem = document.createElement('a');
            tocItem.className = 'toc-item';
            tocItem.href = `#${sectionId}`;
            tocItem.textContent = section.title;
            tocItem.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
                
                // 更新active状态
                document.querySelectorAll('.toc-item').forEach(item => {
                    item.classList.remove('active');
                });
                tocItem.classList.add('active');
            });
            tocNav.appendChild(tocItem);
            
            // 添加章节内容
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'lecture-section';
            sectionDiv.id = sectionId;
            
            let sectionHTML = `<h3>${section.title}</h3>`;
            
            if (section.content) {
                sectionHTML += `<p>${section.content}</p>`;
            }
            
            // 渲染子章节
            if (section.subsections && section.subsections.length > 0) {
                section.subsections.forEach(subsection => {
                    sectionHTML += `
                            <div class="subsection">
                            <h5>${subsection.title}</h5>
                            <p>${subsection.content}</p>
                    `;
                    
                    // 渲染关键要点
                    if (subsection.key_points && subsection.key_points.length > 0) {
                        sectionHTML += `
                            <div class="key-points">
                                <h6><i class="fas fa-star"></i> 关键要点</h6>
                                <ul>
                                    ${subsection.key_points.map(point => `<li>${point}</li>`).join('')}
                                </ul>
                            </div>
                        `;
                    }
                    
                    sectionHTML += `</div>`;
            });
            }
            
            sectionDiv.innerHTML = sectionHTML;
            lectureContent.appendChild(sectionDiv);
        });
        
        // 设置操作按钮
        setupActionButtons();
    }

    // 设置操作按钮
    function setupActionButtons() {
        // 复制按钮
        document.getElementById('copyBtn').addEventListener('click', function() {
            const content = document.getElementById('lectureContent');
            const text = content.innerText;
            
            navigator.clipboard.writeText(text).then(() => {
                toast.show('讲义内容已复制到剪贴板', 'success');
            }).catch(() => {
                toast.show('复制失败，请手动选择复制', 'error');
            });
        });
        
        // 下载按钮
        document.getElementById('downloadBtn').addEventListener('click', function() {
            if (!currentLectureData) return;
            
            const content = document.getElementById('lectureContent');
            let markdown = `# ${currentLectureData.lecture.title}\n\n`;
            markdown += `> 来源: ${currentLectureData.source_file}\n\n`;
            markdown += `---\n\n`;
            
            currentLectureData.lecture.sections.forEach(section => {
                markdown += `## ${section.title}\n\n`;
                if (section.content) {
                    markdown += `${section.content}\n\n`;
                }
                
                if (section.subsections) {
                    section.subsections.forEach(sub => {
                        markdown += `### ${sub.title}\n\n`;
                        markdown += `${sub.content}\n\n`;
                        
                        if (sub.key_points && sub.key_points.length > 0) {
                            markdown += `**关键要点：**\n\n`;
                            sub.key_points.forEach(point => {
                                markdown += `- ${point}\n`;
                            });
                            markdown += `\n`;
                        }
                    });
                }
            });
            
            const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `讲义_${currentLectureData.lecture.title}_${new Date().toLocaleDateString()}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            toast.show('讲义已下载为 Markdown 格式', 'success');
        });
        
        // 打印按钮
        document.getElementById('printBtn').addEventListener('click', function() {
            window.print();
        });
    }

    // 监听滚动，更新目录active状态
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('.lecture-section');
        const tocItems = document.querySelectorAll('.toc-item');
        
        let currentSection = '';
        
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= 150 && rect.bottom >= 150) {
                currentSection = section.id;
            }
        });
        
        tocItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${currentSection}`) {
                item.classList.add('active');
        }
        });
    });
});

    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const removeFileBtn = document.getElementById('removeFileBtn');
    const loadingContainer = document.getElementById('loadingContainer');
    const lectureDisplay = document.getElementById('lectureDisplay');
    const submitBtn = document.getElementById('submitBtn');
    
    let currentFile = null;
    let currentLectureData = null;

    // 文件验证
    function validateFile(file) {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        if (!allowedTypes.includes(file.type)) {
            toast.show('文件格式不支持！请上传 PDF 或 Word 文件', 'error');
            return false;
        }
        
        if (file.size > maxSize) {
            toast.show('文件大小超过限制！最大支持 10MB', 'error');
            return false;
        }
        
        return true;
    }

    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    // 显示文件信息
    function showFileInfo(file) {
        currentFile = file;
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        uploadArea.style.display = 'none';
        fileInfo.style.display = 'block';
        toast.show('文件已选择，可以生成讲义了', 'success');
    }

    // 移除文件
    function removeFile() {
        currentFile = null;
        fileInput.value = '';
        uploadArea.style.display = 'block';
        fileInfo.style.display = 'none';
    }

    // 点击选择文件
    selectFileBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // 文件选择事件
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && validateFile(file)) {
            showFileInfo(file);
        }
    });

    // 移除文件按钮
    removeFileBtn.addEventListener('click', removeFile);

    // 拖拽上传功能
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        const file = e.dataTransfer.files[0];
        if (file && validateFile(file)) {
            fileInput.files = e.dataTransfer.files;
            showFileInfo(file);
        }
    });

    // 表单提交 - 生成讲义
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!currentFile) {
            toast.show('请先选择文件', 'warning');
            return;
        }
        
        const formData = new FormData();
        formData.append('file', currentFile);
        
        try {
            // 显示加载状态
            submitBtn.disabled = true;
            loadingContainer.style.display = 'block';
            lectureDisplay.style.display = 'none';
            
            const response = await fetch('/api/ai/generate-lecture', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `服务器错误: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.status === 'success' && data.lecture) {
                currentLectureData = data;
                renderLecture(data);
                lectureDisplay.style.display = 'block';
                toast.show('讲义生成成功！', 'success');
                
                // 滚动到讲义区域
                setTimeout(() => {
                    lectureDisplay.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 300);
            } else {
                throw new Error(data.error || '生成讲义失败');
            }
        } catch (error) {
            console.error('生成讲义错误:', error);
            toast.show('生成讲义失败: ' + error.message, 'error');
        } finally {
            loadingContainer.style.display = 'none';
            submitBtn.disabled = false;
        }
    });

    // 渲染讲义
    function renderLecture(data) {
        const { lecture, source_file } = data;
        const lectureContent = document.getElementById('lectureContent');
        const tocNav = document.getElementById('tocNav');
        
        // 清空内容
        lectureContent.innerHTML = '';
        tocNav.innerHTML = '';
        
        // 渲染讲义标题
        document.getElementById('lectureTitle').innerHTML = 
            `<i class="fas fa-book-open"></i> ${lecture.title || '讲义内容'}`;
        
        // 渲染各章节
        lecture.sections.forEach((section, index) => {
            const sectionId = `section-${index}`;
            
            // 添加到目录
            const tocItem = document.createElement('a');
            tocItem.className = 'toc-item';
            tocItem.href = `#${sectionId}`;
            tocItem.textContent = section.title;
            tocItem.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
                
                // 更新active状态
                document.querySelectorAll('.toc-item').forEach(item => {
                    item.classList.remove('active');
                });
                tocItem.classList.add('active');
            });
            tocNav.appendChild(tocItem);
            
            // 添加章节内容
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'lecture-section';
            sectionDiv.id = sectionId;
            
            let sectionHTML = `<h3>${section.title}</h3>`;
            
            if (section.content) {
                sectionHTML += `<p>${section.content}</p>`;
            }
            
            // 渲染子章节
            if (section.subsections && section.subsections.length > 0) {
                section.subsections.forEach(subsection => {
                    sectionHTML += `
                            <div class="subsection">
                            <h5>${subsection.title}</h5>
                            <p>${subsection.content}</p>
                    `;
                    
                    // 渲染关键要点
                    if (subsection.key_points && subsection.key_points.length > 0) {
                        sectionHTML += `
                            <div class="key-points">
                                <h6><i class="fas fa-star"></i> 关键要点</h6>
                                <ul>
                                    ${subsection.key_points.map(point => `<li>${point}</li>`).join('')}
                                </ul>
                </div>
            `;
                    }
                    
                    sectionHTML += `</div>`;
            });
            }
            
            sectionDiv.innerHTML = sectionHTML;
            lectureContent.appendChild(sectionDiv);
        });
        
        // 设置操作按钮
        setupActionButtons();
    }

    // 设置操作按钮
    function setupActionButtons() {
        // 复制按钮
        document.getElementById('copyBtn').addEventListener('click', function() {
            const content = document.getElementById('lectureContent');
            const text = content.innerText;
            
            navigator.clipboard.writeText(text).then(() => {
                toast.show('讲义内容已复制到剪贴板', 'success');
            }).catch(() => {
                toast.show('复制失败，请手动选择复制', 'error');
            });
        });
        
        // 下载按钮
        document.getElementById('downloadBtn').addEventListener('click', function() {
            if (!currentLectureData) return;
            
            const content = document.getElementById('lectureContent');
            let markdown = `# ${currentLectureData.lecture.title}\n\n`;
            markdown += `> 来源: ${currentLectureData.source_file}\n\n`;
            markdown += `---\n\n`;
            
            currentLectureData.lecture.sections.forEach(section => {
                markdown += `## ${section.title}\n\n`;
                if (section.content) {
                    markdown += `${section.content}\n\n`;
                }

                if (section.subsections) {
                    section.subsections.forEach(sub => {
                        markdown += `### ${sub.title}\n\n`;
                        markdown += `${sub.content}\n\n`;
                        
                        if (sub.key_points && sub.key_points.length > 0) {
                            markdown += `**关键要点：**\n\n`;
                            sub.key_points.forEach(point => {
                                markdown += `- ${point}\n`;
                            });
                            markdown += `\n`;
                        }
                    });
                }
            });
            
            const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `讲义_${currentLectureData.lecture.title}_${new Date().toLocaleDateString()}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            toast.show('讲义已下载为 Markdown 格式', 'success');
        });
        
        // 打印按钮
        document.getElementById('printBtn').addEventListener('click', function() {
            window.print();
        });
    }

    // 监听滚动，更新目录active状态
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('.lecture-section');
        const tocItems = document.querySelectorAll('.toc-item');
        
        let currentSection = '';
        
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= 150 && rect.bottom >= 150) {
                currentSection = section.id;
            }
        });
        
        tocItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${currentSection}`) {
                item.classList.add('active');
        }
        });
    });
});
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const removeFileBtn = document.getElementById('removeFileBtn');
    const loadingContainer = document.getElementById('loadingContainer');
    const lectureDisplay = document.getElementById('lectureDisplay');
    const submitBtn = document.getElementById('submitBtn');
    
    let currentFile = null;
    let currentLectureData = null;

    // 文件验证
    function validateFile(file) {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        if (!allowedTypes.includes(file.type)) {
            toast.show('文件格式不支持！请上传 PDF 或 Word 文件', 'error');
            return false;
        }
        
        if (file.size > maxSize) {
            toast.show('文件大小超过限制！最大支持 10MB', 'error');
            return false;
        }
        
        return true;
    }

    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    // 显示文件信息
    function showFileInfo(file) {
        currentFile = file;
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        uploadArea.style.display = 'none';
        fileInfo.style.display = 'block';
        toast.show('文件已选择，可以生成讲义了', 'success');
    }

    // 移除文件
    function removeFile() {
        currentFile = null;
        fileInput.value = '';
        uploadArea.style.display = 'block';
        fileInfo.style.display = 'none';
    }

    // 点击选择文件
    selectFileBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // 文件选择事件
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && validateFile(file)) {
            showFileInfo(file);
        }
    });

    // 移除文件按钮
    removeFileBtn.addEventListener('click', removeFile);

    // 拖拽上传功能
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        const file = e.dataTransfer.files[0];
        if (file && validateFile(file)) {
            fileInput.files = e.dataTransfer.files;
            showFileInfo(file);
        }
    });

    // 表单提交 - 生成讲义
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!currentFile) {
            toast.show('请先选择文件', 'warning');
            return;
        }
        
        const formData = new FormData();
        formData.append('file', currentFile);
        
        try {
            // 显示加载状态
            submitBtn.disabled = true;
            loadingContainer.style.display = 'block';
            lectureDisplay.style.display = 'none';
            
            const response = await fetch('/api/ai/generate-lecture', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `服务器错误: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.status === 'success' && data.lecture) {
                currentLectureData = data;
                renderLecture(data);
                lectureDisplay.style.display = 'block';
                toast.show('讲义生成成功！', 'success');
                
                // 滚动到讲义区域
                setTimeout(() => {
                    lectureDisplay.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 300);
            } else {
                throw new Error(data.error || '生成讲义失败');
            }
        } catch (error) {
            console.error('生成讲义错误:', error);
            toast.show('生成讲义失败: ' + error.message, 'error');
        } finally {
            loadingContainer.style.display = 'none';
            submitBtn.disabled = false;
        }
    });

    // 渲染讲义
    function renderLecture(data) {
        const { lecture, source_file } = data;
        const lectureContent = document.getElementById('lectureContent');
        const tocNav = document.getElementById('tocNav');
        
        // 清空内容
        lectureContent.innerHTML = '';
        tocNav.innerHTML = '';
        
        // 渲染讲义标题
        document.getElementById('lectureTitle').innerHTML = 
            `<i class="fas fa-book-open"></i> ${lecture.title || '讲义内容'}`;
        
        // 渲染各章节
        lecture.sections.forEach((section, index) => {
            const sectionId = `section-${index}`;
            
            // 添加到目录
            const tocItem = document.createElement('a');
            tocItem.className = 'toc-item';
            tocItem.href = `#${sectionId}`;
            tocItem.textContent = section.title;
            tocItem.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
                
                // 更新active状态
                document.querySelectorAll('.toc-item').forEach(item => {
                    item.classList.remove('active');
                });
                tocItem.classList.add('active');
            });
            tocNav.appendChild(tocItem);
            
            // 添加章节内容
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'lecture-section';
            sectionDiv.id = sectionId;
            
            let sectionHTML = `<h3>${section.title}</h3>`;
            
            if (section.content) {
                sectionHTML += `<p>${section.content}</p>`;
            }
            
            // 渲染子章节
            if (section.subsections && section.subsections.length > 0) {
                section.subsections.forEach(subsection => {
                    sectionHTML += `
                            <div class="subsection">
                            <h5>${subsection.title}</h5>
                            <p>${subsection.content}</p>
                    `;
                    
                    // 渲染关键要点
                    if (subsection.key_points && subsection.key_points.length > 0) {
                        sectionHTML += `
                            <div class="key-points">
                                <h6><i class="fas fa-star"></i> 关键要点</h6>
                                <ul>
                                    ${subsection.key_points.map(point => `<li>${point}</li>`).join('')}
                                </ul>
                            </div>
                        `;
                    }
                    
                    sectionHTML += `</div>`;
            });
            }
            
            sectionDiv.innerHTML = sectionHTML;
            lectureContent.appendChild(sectionDiv);
        });
        
        // 设置操作按钮
        setupActionButtons();
    }

    // 设置操作按钮
    function setupActionButtons() {
        // 复制按钮
        document.getElementById('copyBtn').addEventListener('click', function() {
            const content = document.getElementById('lectureContent');
            const text = content.innerText;
            
            navigator.clipboard.writeText(text).then(() => {
                toast.show('讲义内容已复制到剪贴板', 'success');
            }).catch(() => {
                toast.show('复制失败，请手动选择复制', 'error');
            });
        });
        
        // 下载按钮
        document.getElementById('downloadBtn').addEventListener('click', function() {
            if (!currentLectureData) return;
            
            const content = document.getElementById('lectureContent');
            let markdown = `# ${currentLectureData.lecture.title}\n\n`;
            markdown += `> 来源: ${currentLectureData.source_file}\n\n`;
            markdown += `---\n\n`;
            
            currentLectureData.lecture.sections.forEach(section => {
                markdown += `## ${section.title}\n\n`;
                if (section.content) {
                    markdown += `${section.content}\n\n`;
                }
                
                if (section.subsections) {
                    section.subsections.forEach(sub => {
                        markdown += `### ${sub.title}\n\n`;
                        markdown += `${sub.content}\n\n`;
                        
                        if (sub.key_points && sub.key_points.length > 0) {
                            markdown += `**关键要点：**\n\n`;
                            sub.key_points.forEach(point => {
                                markdown += `- ${point}\n`;
                            });
                            markdown += `\n`;
                        }
                    });
                }
            });
            
            const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `讲义_${currentLectureData.lecture.title}_${new Date().toLocaleDateString()}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            toast.show('讲义已下载为 Markdown 格式', 'success');
        });
        
        // 打印按钮
        document.getElementById('printBtn').addEventListener('click', function() {
            window.print();
        });
    }

    // 监听滚动，更新目录active状态
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('.lecture-section');
        const tocItems = document.querySelectorAll('.toc-item');
        
        let currentSection = '';
        
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= 150 && rect.bottom >= 150) {
                currentSection = section.id;
            }
        });
        
        tocItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${currentSection}`) {
                item.classList.add('active');
        }
        });
    });
});
