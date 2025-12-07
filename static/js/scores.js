/**
 * 成绩管理系统
 * 包含成绩查询、录入、批量管理等功能
 */

class ScoreManager {
    constructor() {
        this.students = [];
        this.currentStudentData = null;
        
        this.init();
    }

    /**
     * 初始化系统
     */
    async init() {
        try {
            await this.loadStudents();
            this.bindEvents();
            this.loadRecentAssignments();
            console.log('成绩管理系统初始化完成');
        } catch (error) {
            console.error('初始化失败:', error);
            this.showMessage('系统初始化失败', 'error');
        }
    }

    /**
     * 加载学生列表
     */
    async loadStudents() {
        try {
            const response = await fetch('/api/students?simple=true');
            if (!response.ok) throw new Error('加载学生列表失败');

            const data = await response.json();
            this.students = data.students || [];

            this.populateStudentSelectors();
            console.log(`已加载 ${this.students.length} 名学生`);
        } catch (error) {
            console.error('加载学生失败:', error);
            throw error;
        }
    }

    /**
     * 填充学生选择器
     */
    populateStudentSelectors() {
        const selectors = ['student-select', 'score-student-id'];
        
        selectors.forEach(selectorId => {
            const select = document.getElementById(selectorId);
            if (!select) return;

            // 清空现有选项
            select.innerHTML = '<option value="">请选择学生</option>';

            // 按班级分组
            const studentsByClass = {};
            this.students.forEach(student => {
                const className = student.class_name || '未分班';
                if (!studentsByClass[className]) {
                    studentsByClass[className] = [];
                }
                studentsByClass[className].push(student);
            });

            // 添加分组选项
            Object.entries(studentsByClass).forEach(([className, students]) => {
                const optgroup = document.createElement('optgroup');
                optgroup.label = className;
                
                students.forEach(student => {
                    const option = document.createElement('option');
                    option.value = student.student_id;
                    option.textContent = `${student.student_id} - ${student.name}`;
                    optgroup.appendChild(option);
                });
                
                select.appendChild(optgroup);
                    });
                });
            }
            
    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 选项卡切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // 成绩查询
        document.getElementById('search-btn')?.addEventListener('click', () => {
            const studentId = document.getElementById('student-select').value;
            if (studentId) {
                this.loadStudentScores(studentId);
            } else {
                this.showMessage('请先选择学生', 'warning');
            }
        });

        // 成绩录入
        document.getElementById('add-score-btn')?.addEventListener('click', () => {
            this.showScoreModal();
        });

        // 模态框事件
        document.getElementById('score-modal-close')?.addEventListener('click', () => {
            this.hideScoreModal();
        });

        document.getElementById('score-cancel-btn')?.addEventListener('click', () => {
            this.hideScoreModal();
        });

        document.getElementById('score-submit-btn')?.addEventListener('click', () => {
            this.submitScore();
        });

        // 点击模态框外部关闭
        document.getElementById('score-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'score-modal') {
                this.hideScoreModal();
            }
        });
    }

    /**
     * 切换选项卡
     */
    switchTab(tabName) {
        // 更新按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // 更新面板显示
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tabName}-panel`);
        });

        // 加载对应数据
        if (tabName === 'manage') {
            this.loadRecentAssignments();
        }
    }

    /**
     * 加载学生成绩
     */
    async loadStudentScores(studentId) {
        try {
            this.showMessage('正在加载成绩...', 'info');
            
            const response = await fetch(`/api/students/${studentId}/assignments`);
            if (!response.ok) throw new Error('获取学生成绩失败');

            const data = await response.json();
            this.currentStudentData = data;
            
            this.displayStudentScores(data);
            this.showMessage('成绩加载完成', 'success');
        } catch (error) {
            console.error('加载学生成绩失败:', error);
            this.showMessage('加载学生成绩失败', 'error');
        }
    }

    /**
     * 显示学生成绩
     */
    displayStudentScores(data) {
        const student = data.student;
        const assignments = data.assignments;
        const statistics = data.statistics;

        // 显示学生信息
        document.getElementById('student-name').textContent = 
            `${student.name} (${student.student_id})`;

        // 显示统计卡片
        document.getElementById('total-assignments').textContent = statistics.total_assignments;
        document.getElementById('avg-score').textContent = statistics.avg_score;
        document.getElementById('max-score').textContent = statistics.max_score;

        // 显示成绩表格
        const tbody = document.getElementById('scores-tbody');
        tbody.innerHTML = '';

        assignments.forEach(assignment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${assignment.assignment_name}</td>
                <td>${assignment.subject}</td>
                <td>${assignment.chapter}</td>
                <td class="score-cell ${this.getScoreClass(assignment.score)}">${assignment.score || '未评分'}</td>
                <td>${this.formatDate(assignment.submission_time)}</td>
                <td class="feedback-cell">${assignment.feedback || '无反馈'}</td>
            `;
            tbody.appendChild(row);
        });

        // 显示成绩区域
        document.getElementById('student-scores').style.display = 'block';
    }

    /**
     * 加载最近作业提交
     */
    async loadRecentAssignments() {
        try {
            const response = await fetch('/api/assignments/recent?limit=20');
            if (!response.ok) throw new Error('获取最近作业失败');

            const data = await response.json();
            this.displayRecentAssignments(data.assignments);
        } catch (error) {
            console.error('加载最近作业失败:', error);
            this.showMessage('加载最近作业失败', 'error');
        }
    }

    /**
     * 显示最近作业提交
     */
    displayRecentAssignments(assignments) {
        const tbody = document.getElementById('recent-assignments-tbody');
        tbody.innerHTML = '';

        assignments.forEach(assignment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${assignment.student_name} (${assignment.student_id})</td>
                <td>${assignment.assignment_name}</td>
                <td>${assignment.subject}</td>
                <td>${assignment.chapter}</td>
                <td class="score-cell ${this.getScoreClass(assignment.score)}">${assignment.score || '未评分'}</td>
                <td>${this.formatDate(assignment.submission_time)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="scoreManager.editScore(${assignment.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    /**
     * 显示成绩录入模态框
     */
    showScoreModal(assignmentData = null) {
        const modal = document.getElementById('score-modal');
        const form = document.getElementById('score-form');
        
        if (assignmentData) {
            // 编辑模式
            form.elements['student_id'].value = assignmentData.student_id;
            form.elements['assignment_name'].value = assignmentData.assignment_name;
            form.elements['subject'].value = assignmentData.subject;
            form.elements['chapter'].value = assignmentData.chapter;
            form.elements['score'].value = assignmentData.score;
            form.elements['feedback'].value = assignmentData.feedback;
        } else {
            // 新增模式
            form.reset();
        }
        
        modal.style.display = 'flex';
    }

    /**
     * 隐藏成绩录入模态框
     */
    hideScoreModal() {
        document.getElementById('score-modal').style.display = 'none';
        document.getElementById('score-form').reset();
    }

    /**
     * 提交成绩
     */
    async submitScore() {
        try {
            const form = document.getElementById('score-form');
            const formData = new FormData(form);
            
            const data = {
                student_id: formData.get('student_id'),
                assignment_name: formData.get('assignment_name'),
                subject: formData.get('subject'),
                chapter: formData.get('chapter'),
                score: parseFloat(formData.get('score')),
                feedback: formData.get('feedback')
            };

            // 验证数据
            if (!data.student_id || !data.assignment_name || !data.subject) {
                this.showMessage('请填写必要字段', 'warning');
                return;
            }

            if (data.score < 0 || data.score > 100) {
                this.showMessage('成绩必须在0-100之间', 'warning');
                return;
            }

            this.showMessage('正在录入成绩...', 'info');

            const response = await fetch('/api/assignments/add-score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || '录入失败');
            }

            const result = await response.json();
            this.showMessage('成绩录入成功', 'success');
            this.hideScoreModal();
            
            // 刷新数据
            this.loadRecentAssignments();
            
            // 如果当前有选中的学生，刷新其成绩
            const currentStudentId = document.getElementById('student-select').value;
            if (currentStudentId === data.student_id) {
                this.loadStudentScores(currentStudentId);
            }

        } catch (error) {
            console.error('录入成绩失败:', error);
            this.showMessage(`录入失败: ${error.message}`, 'error');
        }
    }

    /**
     * 编辑成绩（预留功能）
     */
    editScore(assignmentId) {
        this.showMessage('编辑功能开发中...', 'info');
    }

    /**
     * 获取成绩样式类
     */
    getScoreClass(score) {
        if (!score) return '';
        if (score >= 90) return 'score-excellent';
        if (score >= 80) return 'score-good';
        if (score >= 70) return 'score-average';
        if (score >= 60) return 'score-pass';
        return 'score-fail';
    }

    /**
     * 格式化日期
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN');
    }

    /**
     * 显示消息
     */
    showMessage(message, type = 'info') {
        const container = document.getElementById('message-container');
        if (!container) return;

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

        container.appendChild(messageEl);

        // 自动移除
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 5000);
    }
}

// 全局实例
let scoreManager;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    try {
        scoreManager = new ScoreManager();
        window.scoreManager = scoreManager;
        console.log('成绩管理系统启动完成');
    } catch (error) {
        console.error('成绩管理系统启动失败:', error);
    }
});