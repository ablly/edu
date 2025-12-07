class PPTGenerator {
    constructor() {
        this.initElements();
        this.initEventListeners();
        this.setupMode('generate');
    }

    initElements() {
        this.pptForm = document.getElementById('ppt-form');
        this.themeInput = document.getElementById('theme');
        this.contentInput = document.getElementById('content');
        this.instructionsInput = document.getElementById('instructions');
        this.generateModeBtn = document.getElementById('generate-mode-btn');
        this.fillModeBtn = document.getElementById('fill-mode-btn');
        this.generateContent = document.getElementById('generate-content');
        this.fillContent = document.getElementById('fill-content');
        this.submitBtn = document.getElementById('submit-btn');
        this.fileInput = document.getElementById('file-input');
        this.fileLabel = document.getElementById('file-text');
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.resultSection = document.getElementById('result-section');
        this.resultMessage = document.getElementById('result-message');
        this.downloadBtn = document.getElementById('download-btn');
        this.fillDetails = document.getElementById('fill-details');
        this.fillContentDetails = document.getElementById('fill-content-details');
        this.currentMode = 'generate';
    }

    initEventListeners() {
        this.generateModeBtn.addEventListener('click', () => this.setupMode('generate'));
        this.fillModeBtn.addEventListener('click', () => this.setupMode('fill'));
        this.fileInput.addEventListener('change', () => this.handleFileUpload());
        this.pptForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });
    }

    setupMode(mode) {
        this.currentMode = mode;
        this.generateModeBtn.classList.toggle('active', mode === 'generate');
        this.fillModeBtn.classList.toggle('active', mode === 'fill');
        this.generateContent.classList.toggle('active', mode === 'generate');
        this.fillContent.classList.toggle('active', mode === 'fill');
        this.submitBtn.textContent = mode === 'generate' ? '生成PPT' : '填充PPT';
        if (mode === 'generate') {
            this.fileInput.value = '';
            this.fileLabel.textContent = '点击选择文件 (支持.pptx/.ppt格式)';
        }
        this.resultSection.style.display = 'none';
    }

    handleFileUpload() {
        if (this.fileInput.files && this.fileInput.files[0]) {
            const file = this.fileInput.files[0];
            const validTypes = ['application/vnd.ms-powerpoint',
                              'application/vnd.openxmlformats-officedocument.presentationml.presentation'];

            if (!validTypes.includes(file.type)) {
                this.showError('请上传有效的PPT文件 (.ppt 或 .pptx 格式)');
                this.fileInput.value = '';
                this.fileLabel.textContent = '点击选择文件 (支持.pptx/.ppt格式)';
                return;
            }

            if (file.size > 20 * 1024 * 1024) {
                this.showError('文件大小超过20MB限制');
                this.fileInput.value = '';
                this.fileLabel.textContent = '点击选择文件 (支持.pptx/.ppt格式)';
                return;
            }

            this.fileLabel.textContent = file.name;
        }
    }

    async handleFormSubmit() {
        if (!this.validateForm()) return;

        try {
            this.showLoading();
            const formData = new FormData(this.pptForm);
            formData.append('mode', this.currentMode);

            const response = await fetch('/api/ai/generate-ppt', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '服务器返回错误状态');
            }

            this.showSuccess(data);

        } catch (error) {
            console.error('PPT生成失败:', error);
            this.showError(`操作失败: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    validateForm() {
        if (!this.themeInput.value.trim()) {
            this.showError('请输入PPT主题');
            return false;
        }

        if (this.currentMode === 'generate') {
            if (!this.contentInput.value.trim()) {
                this.showError('请输入PPT内容描述');
                return false;
            }
        } else {
            if (!this.fileInput.files || this.fileInput.files.length === 0) {
                this.showError('请上传PPT文件');
                return false;
            }
        }

        return true;
    }

    showError(message) {
        this.resultMessage.textContent = message;
        this.resultMessage.className = 'error-message';
        this.resultSection.style.display = 'block';
        this.scrollToResult();
    }

    showSuccess(data) {
        this.resultMessage.textContent = this.currentMode === 'generate' ?
            'PPT生成成功！点击下方按钮下载' :
            'PPT填充完成！点击下方按钮下载';
        this.resultMessage.className = 'success-message';
        this.setupDownloadButton(data);
        this.showFillDetails(data);
        this.resultSection.style.display = 'block';
        this.scrollToResult();
    }

    setupDownloadButton(data) {
        this.downloadBtn.onclick = () => {
            try {
                const link = document.createElement('a');
                link.href = `data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64,${data.data}`;
                link.download = data.filename || `generated_ppt_${new Date().getTime()}.pptx`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (error) {
                this.showError('下载过程中出错: ' + error.message);
            }
        };
    }

    showFillDetails(data) {
        if (this.currentMode === 'fill' && data.fills_used && data.fills_used.length > 0) {
            this.fillDetails.style.display = 'block';
            this.fillContentDetails.innerHTML = data.fills_used.map(fill =>
                `<div class="fill-item">
                    <strong>${fill.slide || '未知位置'}:</strong>
                    <p>${fill.content || '无内容'}</p>
                </div>`
            ).join('');
        } else {
            this.fillDetails.style.display = 'none';
        }
    }

    showLoading() {
        this.pptForm.style.display = 'none';
        this.loadingIndicator.style.display = 'block';
        this.resultSection.style.display = 'none';
    }

    hideLoading() {
        this.pptForm.style.display = 'block';
        this.loadingIndicator.style.display = 'none';
    }

    scrollToResult() {
        setTimeout(() => {
            this.resultSection.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PPTGenerator();
});
