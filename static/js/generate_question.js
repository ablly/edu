// ========================================
// 智能出题页面 JavaScript
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
    const form = document.getElementById('generate-question-form');
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const selectFileBtn = document.getElementById('selectFileBtn');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const removeFileBtn = document.getElementById('removeFileBtn');
    const loadingContainer = document.getElementById('loadingContainer');
    const questionsContainer = document.getElementById('questionsContainer');
    const actionButtons = document.getElementById('actionButtons');
    const submitBtn = document.getElementById('submitBtn');
    
    let currentFile = null;
    let currentQuestions = [];
    let currentAnswers = [];

    // 文件验证
    function validateFile(file) {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ];
        
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        if (!allowedTypes.includes(file.type)) {
            toast.show('文件格式不支持！请上传 PDF、Word 或 PowerPoint 文件', 'error');
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
        toast.show('文件已选择，可以生成题目了', 'success');
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

    // 表单提交 - 生成题目
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!currentFile) {
            toast.show('请先选择文件', 'warning');
            return;
        }

        // 手动构建FormData，确保文件正确上传
        const formData = new FormData();
        formData.append('file', currentFile);
        formData.append('difficulty', document.getElementById('difficulty').value);
        formData.append('num_questions', document.getElementById('num_questions').value);

        try {
            // 显示加载状态
            submitBtn.disabled = true;
            loadingContainer.style.display = 'block';
            questionsContainer.innerHTML = '';
            actionButtons.style.display = 'none';
            document.getElementById('studentAnswerSection').style.display = 'none';

            const response = await fetch('/api/ai/generate-question', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `服务器错误: ${response.status}`);
            }

            const data = await response.json();

            if (data.status === 'success' && data.questions) {
                currentQuestions = data.questions;
                renderQuestions(currentQuestions);
                actionButtons.style.display = 'flex';
                toast.show(`成功生成 ${currentQuestions.length} 道题目！`, 'success');
            } else {
                throw new Error(data.error || '生成题目失败');
            }
        } catch (error) {
            console.error('生成题目错误:', error);
            toast.show('生成题目失败: ' + error.message, 'error');
            questionsContainer.innerHTML = `
                <div class="question-card" style="border-left-color: var(--danger-color);">
                    <h3><i class="fas fa-exclamation-triangle"></i> 出错了</h3>
                    <p>${error.message}</p>
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">
                        请检查文件格式是否正确，或稍后重试。
                    </p>
                </div>
            `;
        } finally {
            loadingContainer.style.display = 'none';
            submitBtn.disabled = false;
        }
    });

    // 渲染题目列表
    function renderQuestions(questions) {
        questionsContainer.innerHTML = '';
        
        questions.forEach((question, index) => {
            const questionCard = document.createElement('div');
            questionCard.className = 'question-card';
            questionCard.style.animationDelay = `${index * 0.1}s`;

            let questionHtml = `
                <h3><i class="fas fa-question-circle"></i> 题目 ${index + 1}</h3>
                <p>${question.question}</p>
            `;

            if (question.options && question.options.length > 0) {
                questionHtml += `
                    <p><strong><i class="fas fa-list"></i> 选项：</strong></p>
                    <ul>
                        ${question.options.map(opt => `<li>${opt}</li>`).join('')}
                    </ul>
                `;
            }

            questionHtml += `
                <div class="answer-card" id="answer-${index}"></div>
                <button class="toggle-answer-btn" data-index="${index}">
                    <i class="fas fa-eye"></i> 显示答案
                </button>
            `;

            questionCard.innerHTML = questionHtml;
            questionsContainer.appendChild(questionCard);
        });

        // 答案切换事件
        document.querySelectorAll('.toggle-answer-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = this.getAttribute('data-index');
                const answerCard = document.getElementById(`answer-${index}`);

                if (answerCard.classList.contains('show')) {
                    answerCard.classList.remove('show');
                    this.innerHTML = '<i class="fas fa-eye"></i> 显示答案';
                } else {
                    if (currentAnswers[index]) {
                        answerCard.innerHTML = `
                            <h4><i class="fas fa-check"></i> 答案</h4>
                            <p>${currentAnswers[index].answer}</p>
                            <h4><i class="fas fa-lightbulb"></i> 解析</h4>
                            <p>${currentAnswers[index].explanation}</p>
                        `;
                    } else {
                        answerCard.innerHTML = `
                            <p><i class="fas fa-info-circle"></i> 请先点击"获取答案"按钮生成答案</p>
                        `;
                    }
                    answerCard.classList.add('show');
                    this.innerHTML = '<i class="fas fa-eye-slash"></i> 隐藏答案';
                }
            });
        });

        // 设置操作按钮
        setupActionButtons();
    }

    // 设置操作按钮
    function setupActionButtons() {
        actionButtons.innerHTML = `
            <button class="action-btn primary" id="studentAnswerBtn">
                <i class="fas fa-pen"></i> 学生答题
            </button>
            <button class="action-btn success" id="generateAnswerBtn">
                <i class="fas fa-key"></i> 获取答案
            </button>
            <button class="action-btn secondary" id="downloadQuestionsBtn">
                <i class="fas fa-download"></i> 下载题目
            </button>
        `;

        // 学生答题
        document.getElementById('studentAnswerBtn').addEventListener('click', function() {
            renderAnswerForm(currentQuestions);
            document.getElementById('studentAnswerSection').scrollIntoView({ behavior: 'smooth' });
        });

        // 获取答案
        document.getElementById('generateAnswerBtn').addEventListener('click', async function() {
            if (!currentQuestions.length) return;

            try {
                this.disabled = true;
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中...';

                const response = await fetch('/api/ai/answer-questions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ questions: currentQuestions })
                });

                const data = await response.json();
                
                if (data.status === 'success' && data.answers) {
                    currentAnswers = data.answers;
                    toast.show('答案已生成！点击题目下方按钮查看', 'success');
                    this.innerHTML = '<i class="fas fa-check"></i> 答案已生成';
                } else {
                    throw new Error(data.error || '获取答案失败');
                }
            } catch (error) {
                console.error('获取答案错误:', error);
                toast.show('获取答案失败: ' + error.message, 'error');
                this.innerHTML = '<i class="fas fa-key"></i> 获取答案';
            } finally {
                this.disabled = false;
            }
        });

        // 下载题目
        document.getElementById('downloadQuestionsBtn').addEventListener('click', function() {
            if (!currentQuestions.length) return;

            const questionText = currentQuestions.map((q, i) => {
                let text = `${i + 1}. ${q.question}\n`;
                if (q.options && q.options.length > 0) {
                    text += '选项:\n' + q.options.map(opt => `  ${opt}`).join('\n') + '\n';
                }
                return text + '\n';
            }).join('\n');

            const blob = new Blob([questionText], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `智能出题_${new Date().toLocaleDateString()}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            toast.show('题目已下载！', 'success');
        });
    }

    // 渲染答题表单
    function renderAnswerForm(questions) {
        const container = document.getElementById('answerFieldsContainer');
        container.innerHTML = '';

        questions.forEach((question, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'answer-question';

            let questionHtml = `<h4><i class="fas fa-question-circle"></i> 题目 ${index + 1}: ${question.question}</h4>`;

            if (question.type === 'choice' && question.options) {
                questionHtml += `
                    <p style="margin-top: 1rem; color: var(--text-secondary);">请选择正确答案:</p>
                    <div class="options-container">
                        ${question.options.map((opt, i) => `
                            <div class="option">
                                <input type="radio" id="q${index}_opt${i}" 
                                       name="answer_${index}" value="${String.fromCharCode(65 + i)}">
                                <label for="q${index}_opt${i}">${String.fromCharCode(65 + i)}. ${opt}</label>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else {
                questionHtml += `
                    <textarea id="answer_${index}" name="answer_${index}" 
                              placeholder="请输入您的答案..." rows="4"></textarea>
                `;
            }

            questionDiv.innerHTML = questionHtml;
            container.appendChild(questionDiv);
        });

        document.getElementById('studentAnswerSection').style.display = 'block';
        document.getElementById('gradingResults').style.display = 'none';
    }

    // 提交答案
    document.getElementById('studentAnswerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
        
        const studentId = document.getElementById('studentId').value.trim();
    if (!studentId) {
            toast.show('请输入学号', 'warning');
        return;
    }

        const answers = [];
        currentQuestions.forEach((question, index) => {
            let answer;
            if (question.type === 'choice') {
                const selected = document.querySelector(`input[name="answer_${index}"]:checked`);
                answer = selected ? selected.value : '';
            } else {
                answer = document.getElementById(`answer_${index}`).value.trim();
            }

            answers.push({
                question_id: question.id,
                answer: answer
            });
        });

        const submitBtn = document.getElementById('submitAnswersBtn');
        
        try {
        submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 提交中...';

            const response = await fetch('/api/question/submit-answers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: studentId,
                    answers: answers
                })
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                renderGradingResults(data);
                document.getElementById('gradingResults').style.display = 'block';
                document.getElementById('gradingResults').scrollIntoView({ behavior: 'smooth' });
                toast.show('答案已提交，批改完成！', 'success');
            } else {
                throw new Error(data.error || '提交答案失败');
            }
        } catch (error) {
            console.error('提交答案错误:', error);
            toast.show('提交答案失败: ' + error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> 提交答案';
        }
    });

    // 渲染批改结果
    function renderGradingResults(gradingData) {
        const gradingDetails = document.getElementById('gradingDetails');
        
        const correctCount = gradingData.results.filter(r => r.is_correct).length;
        const totalCount = gradingData.results.length;
        const correctRate = ((correctCount / totalCount) * 100).toFixed(1);
        
        gradingDetails.innerHTML = `
            <div class="grading-summary">
                <h4><i class="fas fa-trophy"></i> 总分: ${gradingData.average_score} 分</h4>
                <p><i class="fas fa-check-circle"></i> 正确: ${correctCount} 题 / 总共: ${totalCount} 题</p>
                <p><i class="fas fa-percentage"></i> 正确率: ${correctRate}%</p>
            </div>
            ${gradingData.results.map((result, index) => `
                <div class="question-result ${result.is_correct ? 'correct' : 'incorrect'}">
                    <h4>
                        <i class="fas ${result.is_correct ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                        题目 ${index + 1}: ${result.question}
                    </h4>
                    <p><strong>你的答案:</strong> ${result.student_answer || '未作答'}</p>
                    ${result.correct_answer ? `<p><strong>正确答案:</strong> ${result.correct_answer}</p>` : ''}
                    <p><strong>得分:</strong> ${result.score} 分</p>
                    <p><strong>反馈:</strong> ${result.feedback}</p>
                </div>
            `).join('')}
        `;
    }
});



