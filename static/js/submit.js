document.addEventListener('DOMContentLoaded', function() {
    // 存储课程结构
    let courseStructure = {};

    // DOM元素
    const individualBtn = document.getElementById('individual-btn');
    const batchBtn = document.getElementById('batch-btn');
    const individualForm = document.getElementById('individual-submit');
    const batchForm = document.getElementById('batch-submit');

    const submitForm = document.getElementById('submit-assignment-form');
    const batchSubmitForm = document.getElementById('batch-submit-form');
    const studentIdSelect = document.getElementById('submit-student-id');
    const messageDiv = document.getElementById('submission-message');
    const progressBar = document.getElementById('submission-progress');
    const progressFill = document.querySelector('#submission-progress .progress-fill');

    const batchMessageDiv = document.getElementById('batch-submission-message');
    const batchProgressBar = document.getElementById('batch-submission-progress');
    const batchProgressFill = document.querySelector('#batch-submission-progress .progress-fill');
    const batchResults = document.getElementById('batch-results');
    const batchResultsTbody = document.getElementById('batch-results-tbody');

    // 初始化函数
    async function initialize() {
        await loadCourseStructure();
        loadStudents();
        setupEventListeners();
        setupDragAndDrop();
        enhanceFormValidation();
        
        // 添加文件选择事件监听
        document.querySelectorAll('input[type="file"]').forEach(input => {
            input.addEventListener('change', () => updateFileDisplay(input));
        });
        
        // 页面加载完成提示
        showMessage('作业提交系统已准备就绪', 'success');
    }

    // 加载课程结构
    async function loadCourseStructure() {
        try {
            const response = await fetch('/api/course-structure');
            if (!response.ok) throw new Error('无法加载课程结构');
            courseStructure = await response.json();
            populateSubjects();
        } catch (error) {
            showMessage(error.message, 'error', messageDiv);
        }
    }

    // 填充学科选择器
    function populateSubjects() {
        const subjectSelect = document.getElementById('subject-select');
        const batchSubjectSelect = document.getElementById('batch-subject');

        // 清除现有选项(除了第一个)
        while (subjectSelect.options.length > 1) subjectSelect.remove(1);
        while (batchSubjectSelect.options.length > 1) batchSubjectSelect.remove(1);

        // 添加学科选项
        Object.keys(courseStructure).forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject;
            subjectSelect.appendChild(option.cloneNode(true));
            batchSubjectSelect.appendChild(option);
        });
    }

    // 填充章节选择器
    function populateChapters(subject, targetElementId) {
        const chapterSelect = document.getElementById(targetElementId);
        chapterSelect.innerHTML = '<option value="">选择章节</option>';
        chapterSelect.disabled = !subject;

        if (subject && courseStructure[subject]) {
            courseStructure[subject].forEach(chapter => {
                const option = document.createElement('option');
                option.value = chapter;
                option.textContent = chapter;
                chapterSelect.appendChild(option);
            });
            chapterSelect.disabled = false;
        }
    }

    // 设置事件监听器
    function setupEventListeners() {
        // 学科选择变化
        document.getElementById('subject-select').addEventListener('change', function() {
            populateChapters(this.value, 'chapter-select');
        });

        document.getElementById('batch-subject').addEventListener('change', function() {
            populateChapters(this.value, 'batch-chapter');
        });

        // 切换表单视图
        individualBtn.addEventListener('click', function() {
            individualBtn.classList.add('active');
            batchBtn.classList.remove('active');
            individualForm.style.display = 'block';
            batchForm.style.display = 'none';
        });

        batchBtn.addEventListener('click', function() {
            batchBtn.classList.add('active');
            individualBtn.classList.remove('active');
            batchForm.style.display = 'block';
            individualForm.style.display = 'none';
        });

        // 单个作业提交
        submitForm.addEventListener('submit', handleIndividualSubmit);

        // 批量作业提交
        batchSubmitForm.addEventListener('submit', handleBatchSubmit);
    }

    // 加载学生列表
    async function loadStudents() {
        try {
            const response = await fetch('/api/students?simple=true');
            if (!response.ok) throw new Error('加载学生列表失败');

            const data = await response.json();
            const students = data.students || []; // 修复：正确获取学生数组

            // 清除现有选项(除了第一个)
            while (studentIdSelect.options.length > 1) {
                studentIdSelect.remove(1);
            }

            // 添加学生选项
            students.forEach(student => {
                const option = document.createElement('option');
                option.value = student.student_id;
                option.textContent = `${student.student_id} - ${student.name} (${student.class_name || '未分班'})`;
                studentIdSelect.appendChild(option);
            });

            console.log(`已加载 ${students.length} 名学生`);
        } catch (error) {
            console.error('加载学生失败:', error);
            showMessage(error.message, 'error', messageDiv);
        }
    }

    // 显示消息
    function showMessage(message, type, targetDiv) {
        // 如果有消息容器，优先使用
        const messageContainer = document.getElementById('message-container');
        if (messageContainer) {
            const messageEl = document.createElement('div');
            messageEl.className = `message message-${type}`;
            
            const iconMap = {
                success: 'check-circle',
                error: 'exclamation-circle',
                warning: 'exclamation-triangle',
                info: 'info-circle'
            };
            
            messageEl.innerHTML = `
                <i class="fas fa-${iconMap[type]}"></i>
                <span>${message}</span>
            `;

            messageContainer.appendChild(messageEl);

            // 自动移除消息
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 5000);
        }
        
        // 同时更新目标div（向后兼容）
        if (targetDiv) {
        targetDiv.textContent = message;
        targetDiv.className = type;
        }
    }

    // 文件上传拖拽功能
    function setupDragAndDrop() {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        
        fileInputs.forEach(input => {
            const formGroup = input.closest('.form-group');
            
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                formGroup.addEventListener(eventName, preventDefaults, false);
            });
            
            ['dragenter', 'dragover'].forEach(eventName => {
                formGroup.addEventListener(eventName, () => {
                    formGroup.classList.add('drag-over');
                }, false);
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                formGroup.addEventListener(eventName, () => {
                    formGroup.classList.remove('drag-over');
                }, false);
            });
            
            formGroup.addEventListener('drop', (e) => {
                const dt = e.dataTransfer;
                const files = dt.files;
                input.files = files;
                
                // 显示文件名
                updateFileDisplay(input);
            }, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
    }

    // 更新文件显示
    function updateFileDisplay(input) {
        const files = Array.from(input.files);
        if (files.length > 0) {
            const fileNames = files.map(file => file.name).join(', ');
            showMessage(`已选择文件: ${fileNames}`, 'info');
        }
    }

    // 表单验证增强
    function enhanceFormValidation() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, select, textarea');
            
            inputs.forEach(input => {
                input.addEventListener('blur', () => validateField(input));
                input.addEventListener('input', () => clearFieldError(input));
            });
        });
    }

    function validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name || field.id;
        
        // 移除之前的错误样式
        clearFieldError(field);
        
        if (field.hasAttribute('required') && !value) {
            showFieldError(field, `${getFieldLabel(field)}是必填项`);
            return false;
        }
        
        // 文件类型验证
        if (field.type === 'file' && field.files.length > 0) {
            const allowedTypes = field.accept ? field.accept.split(',').map(t => t.trim()) : [];
            const file = field.files[0];
            
            if (allowedTypes.length > 0) {
                const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
                if (!allowedTypes.includes(fileExtension)) {
                    showFieldError(field, `不支持的文件类型: ${fileExtension}`);
                    return false;
                }
            }
            
            // 文件大小验证 (50MB限制)
            const maxSize = 50 * 1024 * 1024;
            if (file.size > maxSize) {
                showFieldError(field, '文件大小不能超过50MB');
                return false;
            }
        }
        
        return true;
    }

    function showFieldError(field, message) {
        field.classList.add('error');
        
        // 添加错误提示
        let errorEl = field.parentNode.querySelector('.field-error');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'field-error';
            field.parentNode.appendChild(errorEl);
        }
        errorEl.textContent = message;
    }

    function clearFieldError(field) {
        field.classList.remove('error');
        const errorEl = field.parentNode.querySelector('.field-error');
        if (errorEl) {
            errorEl.remove();
        }
    }

    function getFieldLabel(field) {
        const label = field.parentNode.querySelector('label');
        return label ? label.textContent.replace(':', '') : field.name || field.id;
    }

    // 单个作业提交处理
    async function handleIndividualSubmit(e) {
        e.preventDefault();

        const formData = new FormData(submitForm);

        // 验证输入
        if (!validateForm(formData)) {
            return;
        }

        // 显示进度条
        progressBar.style.display = 'block';
        progressFill.style.width = '20%';
        showMessage('正在上传作业...请稍候。', 'info', messageDiv);

        // 禁用提交按钮
        submitForm.querySelector('button[type="submit"]').disabled = true;

        try {
            const response = await fetch('/api/submit', {
                method: 'POST',
                body: formData
            });

            progressFill.style.width = '80%';

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || '提交作业失败');
            }

            const data = await response.json();
            progressFill.style.width = '100%';

            showMessage(`作业提交并批改成功！成绩: ${data.score}`, 'success', messageDiv);

            // 重置表单(保留学生选择)
            const selectedStudentId = studentIdSelect.value;
            submitForm.reset();
            studentIdSelect.value = selectedStudentId;
        } catch (error) {
            progressFill.style.width = '0%';
            showMessage(error.message, 'error', messageDiv);
        } finally {
            // 重新启用提交按钮
            submitForm.querySelector('button[type="submit"]').disabled = false;

            setTimeout(() => {
                progressBar.style.display = 'none';
                progressFill.style.width = '0%';
            }, 1500);
        }
    }

    // 批量作业提交处理
    async function handleBatchSubmit(e) {
        e.preventDefault();

        const formData = new FormData(batchSubmitForm);
        const files = document.getElementById('batch-files').files;

        // 验证输入
        if (!validateBatchForm(formData, files)) {
            return;
        }

        // 显示进度条
        batchProgressBar.style.display = 'block';
        batchProgressFill.style.width = '20%';
        showMessage(`正在批量上传 ${files.length} 个文件...请稍候。`, 'info', batchMessageDiv);

        // 禁用提交按钮
        batchSubmitForm.querySelector('button[type="submit"]').disabled = true;

        // 隐藏之前的结果表格
        batchResults.style.display = 'none';

        try {
            const response = await fetch('/api/batch-submit', {
                method: 'POST',
                body: formData
            });

            batchProgressFill.style.width = '60%';

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || '批量提交作业失败');
            }

            const data = await response.json();
            batchProgressFill.style.width = '100%';

            showMessage(`批量提交成功！已处理 ${data.processed} 个文件。`, 'success', batchMessageDiv);

            // 显示结果表格
            displayBatchResults(data.results);

            // 重置文件选择(保留其他字段)
            document.getElementById('batch-files').value = '';
        } catch (error) {
            batchProgressFill.style.width = '0%';
            showMessage(error.message, 'error', batchMessageDiv);
        } finally {
            // 重新启用提交按钮
            batchSubmitForm.querySelector('button[type="submit"]').disabled = false;

            setTimeout(() => {
                batchProgressBar.style.display = 'none';
                batchProgressFill.style.width = '0%';
            }, 1500);
        }
    }

    // 验证单个表单
    function validateForm(formData) {
        if (!formData.get('student_id') || !formData.get('subject') ||
            !formData.get('chapter') || !formData.get('assignment_name') ||
            !formData.get('file') || !formData.get('prompt')) {
            showMessage('请填写所有必填字段。', 'error', messageDiv);
            return false;
        }

        // 检查文件扩展名
        const file = formData.get('file');
        const fileName = file.name.toLowerCase();
        const validExtensions = ['c', 'cpp', 'java', 'py', 'zip', 'txt', 'pdf', 'docx', 'pptx'];
        const fileExtension = fileName.split('.').pop();

        if (!validExtensions.includes(fileExtension)) {
            showMessage('请上传支持的格式: .c, .cpp, .java, .py, .zip, .txt, .pdf, .docx, .pptx', 'error', messageDiv);
            return false;
        }

        return true;
    }

    // 验证批量表单
    function validateBatchForm(formData, files) {
        if (!formData.get('batch_name') || !formData.get('subject') ||
            !formData.get('chapter') || !formData.get('prompt')) {
            showMessage('请填写所有必填字段。', 'error', batchMessageDiv);
            return false;
        }

        if (files.length === 0) {
            showMessage('请选择至少一个文件。', 'error', batchMessageDiv);
            return false;
        }

        // 检查所有文件扩展名是否有效
        const validExtensions = ['c', 'cpp', 'java', 'py', 'txt', 'pdf', 'docx', 'pptx'];
        for (let i = 0; i < files.length; i++) {
            const fileName = files[i].name.toLowerCase();
            const fileExtension = fileName.split('.').pop();

            if (!validExtensions.includes(fileExtension)) {
                showMessage(`文件 ${fileName} 格式不支持。支持格式: .c, .cpp, .java, .py, .txt, .pdf, .docx, .pptx`, 'error', batchMessageDiv);
                return false;
            }
        }

        return true;
    }

    // 显示批量上传结果
    function displayBatchResults(results) {
        batchResultsTbody.innerHTML = '';

        results.forEach(result => {
            const row = document.createElement('tr');
            const statusClass = result.status === 'success' ? 'file-status-success' : 'file-status-error';

            row.innerHTML = `
                <td>${result.filename}</td>
                <td>${result.student_id || '-'}</td>
                <td>${result.student_name || '-'}</td>
                <td>${result.assignment_name || '-'}</td>
                <td>${result.score !== null ? result.score : '未评分'}</td>
                <td class="${statusClass}">${result.status === 'success' ? '成功' : '失败: ' + result.message}</td>
            `;

            batchResultsTbody.appendChild(row);
        });

        batchResults.style.display = 'block';
    }

    // 初始化应用
    initialize();
});
