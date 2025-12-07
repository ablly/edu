/**
 * 学生管理页面 - 现代化JavaScript实现
 * 功能：学生信息管理、搜索筛选、批量操作、数据可视化等
 */

class StudentManager {
    constructor() {
        this.students = [];
        this.filteredStudents = [];
        this.currentPage = 1;
        this.pageSize = 20;
        this.totalPages = 0;
        this.totalRecords = 0;
        this.currentView = 'table'; // table 或 grid
        this.sortField = '';
        this.sortDirection = 'asc';
        this.filters = {
            search: '',
            major: '',
            class: '',
            status: ''
        };
        this.selectedStudents = new Set();
        this.isLoading = false;
        
        // 模态框实例
        this.studentModal = null;
        this.detailModal = null;
        this.importModal = null;
        
        this.init();
    }

    /**
     * 初始化页面
     */
    init() {
        this.bindEvents();
        this.initModals();
        this.loadStudents();
        this.loadStats();
        this.setupFormValidation();
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 工具栏按钮
        document.getElementById('add-student-btn')?.addEventListener('click', () => this.showAddStudentModal());
        document.getElementById('batch-import-btn')?.addEventListener('click', () => this.showImportModal());
        document.getElementById('export-btn')?.addEventListener('click', () => this.exportStudents());
        document.getElementById('batch-delete-btn')?.addEventListener('click', () => this.batchDeleteStudents());
        document.getElementById('refresh-btn')?.addEventListener('click', () => this.loadStudents());
        
        // 搜索和筛选
        document.getElementById('search-input')?.addEventListener('input', (e) => this.handleSearch(e.target.value));
        document.getElementById('search-btn')?.addEventListener('click', () => this.performSearch());
        document.getElementById('filter-btn')?.addEventListener('click', () => this.toggleFilterPanel());
        document.getElementById('apply-filter-btn')?.addEventListener('click', () => this.applyFilters());
        document.getElementById('reset-filter-btn')?.addEventListener('click', () => this.resetFilters());
        
        // 视图切换
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchView(e.target.closest('.view-btn').dataset.view));
        });
        
        // 全选复选框
        document.getElementById('select-all-checkbox')?.addEventListener('change', (e) => this.toggleSelectAll(e.target.checked));
        
        // 表单提交
        document.getElementById('student-form')?.addEventListener('submit', (e) => this.handleStudentFormSubmit(e));
        
        // 表单导航
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchFormSection(e.target.dataset.target));
        });
        
        // 导入相关
        document.getElementById('download-template-btn')?.addEventListener('click', () => this.downloadTemplate());
        document.getElementById('upload-area')?.addEventListener('click', () => document.getElementById('import-file-input')?.click());
        document.getElementById('import-file-input')?.addEventListener('change', (e) => this.handleFileSelect(e));
        document.getElementById('import-confirm-btn')?.addEventListener('click', () => this.confirmImport());
        
        // 拖拽上传
        this.setupDragAndDrop();
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // 表格排序
        document.querySelectorAll('.sortable').forEach(th => {
            th.addEventListener('click', () => this.handleSort(th.dataset.sort));
        });
    }

    /**
     * 初始化模态框
     */
    initModals() {
        this.studentModal = new Modal('student-modal');
        this.detailModal = new Modal('student-detail-modal');
        this.importModal = new Modal('import-modal');
    }

    /**
     * 加载学生数据
     */
    async loadStudents(page = 1) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            const params = new URLSearchParams({
                page: page,
                per_page: this.pageSize,
                simple: this.currentView === 'table' ? 'true' : 'false',
                ...this.filters
            });
            
            const response = await fetch(`/api/students?${params}`);
            const data = await response.json();
            
            if (response.ok) {
                this.students = data.students;
                this.filteredStudents = data.students;
                this.currentPage = data.current_page;
                this.totalPages = data.pages;
                this.totalRecords = data.total;
                
                this.renderStudents();
                this.renderPagination();
                this.updateStudentCount();
                this.loadFilterOptions();
            } else {
                this.showMessage('加载学生数据失败：' + data.error, 'error');
            }
        } catch (error) {
            this.showMessage('网络错误，请稍后重试', 'error');
            console.error('Load students error:', error);
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    /**
     * 加载统计数据
     */
    async loadStats() {
        try {
            const response = await fetch('/api/students/stats');
            const data = await response.json();
            
            if (response.ok) {
                this.renderStats(data);
            }
        } catch (error) {
            console.error('Load stats error:', error);
        }
    }

    /**
     * 渲染统计卡片
     */
    renderStats(stats) {
        const container = document.getElementById('stats-cards');
        if (!container) return;
        
        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-card-icon primary">
                    <i class="fas fa-users"></i>
                </div>
                <div class="stat-card-value">${stats.total_students}</div>
                <div class="stat-card-label">总学生数</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-icon success">
                    <i class="fas fa-user-check"></i>
                </div>
                <div class="stat-card-value">${stats.status_distribution.find(s => s.status === '在读')?.count || 0}</div>
                <div class="stat-card-label">在读学生</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-icon warning">
                    <i class="fas fa-graduation-cap"></i>
                </div>
                <div class="stat-card-value">${stats.major_distribution.length}</div>
                <div class="stat-card-label">专业数量</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-icon danger">
                    <i class="fas fa-chalkboard-teacher"></i>
                </div>
                <div class="stat-card-value">${stats.class_distribution.length}</div>
                <div class="stat-card-label">班级数量</div>
            </div>
        `;
    }

    /**
     * 渲染学生列表
     */
    renderStudents() {
        if (this.currentView === 'table') {
            this.renderTableView();
            } else {
            this.renderGridView();
        }
        
        // 显示或隐藏空状态
        const hasData = this.filteredStudents.length > 0;
        document.getElementById('empty-state').style.display = hasData ? 'none' : 'block';
        document.getElementById('table-view').style.display = hasData && this.currentView === 'table' ? 'block' : 'none';
        document.getElementById('grid-view').style.display = hasData && this.currentView === 'grid' ? 'block' : 'none';
    }

    /**
     * 渲染表格视图
     */
    renderTableView() {
        const tbody = document.getElementById('students-tbody');
        if (!tbody) return;
        
        tbody.innerHTML = this.filteredStudents.map(student => `
            <tr data-student-id="${student.student_id}" class="${this.selectedStudents.has(student.student_id) ? 'selected' : ''}">
                <td>
                    <input type="checkbox" class="student-checkbox" 
                           value="${student.student_id}" 
                           ${this.selectedStudents.has(student.student_id) ? 'checked' : ''}>
                </td>
                <td>
                    ${student.avatar ? 
                        `<img src="${student.avatar}" alt="${student.name}" class="student-avatar">` :
                        `<div class="avatar-placeholder"><i class="fas fa-user"></i></div>`
                    }
                </td>
                        <td>${student.student_id}</td>
                        <td>${student.name}</td>
                <td>${student.gender || '-'}</td>
                <td>${student.major || '-'}</td>
                <td>${student.class_name || '-'}</td>
                <td>
                    ${student.phone ? `<div><i class="fas fa-phone"></i> ${student.phone}</div>` : ''}
                    ${student.email ? `<div><i class="fas fa-envelope"></i> ${student.email}</div>` : ''}
                </td>
                <td>
                    <span class="status-badge ${this.getStatusClass(student.student_status)}">
                        ${student.student_status || '在读'}
                    </span>
                </td>
                <td>
                    <button class="action-btn view" onclick="studentManager.viewStudent('${student.student_id}')">
                        <i class="fas fa-eye"></i> 查看
                            </button>
                    <button class="action-btn edit" onclick="studentManager.editStudent('${student.student_id}')">
                        <i class="fas fa-edit"></i> 编辑
                    </button>
                    <button class="action-btn delete" onclick="studentManager.deleteStudent('${student.student_id}')">
                        <i class="fas fa-trash"></i> 删除
                            </button>
                        </td>
            </tr>
        `).join('');
        
        // 绑定复选框事件
        tbody.querySelectorAll('.student-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => this.handleStudentSelect(e));
        });
    }

    /**
     * 渲染网格视图
     */
    renderGridView() {
        const container = document.getElementById('students-grid');
        if (!container) return;
        
        container.innerHTML = this.filteredStudents.map(student => `
            <div class="student-card" data-student-id="${student.student_id}">
                <div class="student-card-header">
                    ${student.avatar ? 
                        `<img src="${student.avatar}" alt="${student.name}" class="student-card-avatar">` :
                        `<div class="avatar-placeholder"><i class="fas fa-user"></i></div>`
                    }
                    <div class="student-card-info">
                        <h3>${student.name}</h3>
                        <p>${student.student_id}</p>
                    </div>
                </div>
                <div class="student-card-details">
                    ${student.gender ? `<div class="student-card-detail"><span class="label">性别:</span><span class="value">${student.gender}</span></div>` : ''}
                    ${student.major ? `<div class="student-card-detail"><span class="label">专业:</span><span class="value">${student.major}</span></div>` : ''}
                    ${student.class_name ? `<div class="student-card-detail"><span class="label">班级:</span><span class="value">${student.class_name}</span></div>` : ''}
                    ${student.phone ? `<div class="student-card-detail"><span class="label">电话:</span><span class="value">${student.phone}</span></div>` : ''}
                    <div class="student-card-detail">
                        <span class="label">状态:</span>
                        <span class="status-badge ${this.getStatusClass(student.student_status)}">${student.student_status || '在读'}</span>
                    </div>
                </div>
                <div class="student-card-actions">
                    <button class="action-btn view" onclick="studentManager.viewStudent('${student.student_id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" onclick="studentManager.editStudent('${student.student_id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="studentManager.deleteStudent('${student.student_id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * 获取状态样式类
     */
    getStatusClass(status) {
        const statusMap = {
            '在读': 'active',
            '休学': 'suspended',
            '毕业': 'graduated',
            '退学': 'inactive'
        };
        return statusMap[status] || 'active';
    }

    /**
     * 渲染分页
     */
    renderPagination() {
        const container = document.getElementById('pagination-container');
        const pagination = document.getElementById('pagination');
        
        if (!container || !pagination) return;
        
        if (this.totalPages <= 1) {
            container.style.display = 'none';
            return;
        }
        
        container.style.display = 'flex';
        
        // 更新分页信息
        const start = (this.currentPage - 1) * this.pageSize + 1;
        const end = Math.min(this.currentPage * this.pageSize, this.totalRecords);
        
        document.getElementById('page-start').textContent = start;
        document.getElementById('page-end').textContent = end;
        document.getElementById('total-records').textContent = this.totalRecords;
        
        // 生成分页按钮
        let paginationHTML = '';
        
        // 上一页按钮
        paginationHTML += `
            <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} 
                    onclick="studentManager.goToPage(${this.currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        // 页码按钮
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);
        
        if (startPage > 1) {
            paginationHTML += `<button class="pagination-btn" onclick="studentManager.goToPage(1)">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                        onclick="studentManager.goToPage(${i})">${i}</button>
            `;
        }
        
        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
            paginationHTML += `<button class="pagination-btn" onclick="studentManager.goToPage(${this.totalPages})">${this.totalPages}</button>`;
        }
        
        // 下一页按钮
        paginationHTML += `
            <button class="pagination-btn" ${this.currentPage === this.totalPages ? 'disabled' : ''} 
                    onclick="studentManager.goToPage(${this.currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        pagination.innerHTML = paginationHTML;
    }

    /**
     * 跳转到指定页面
     */
    goToPage(page) {
        if (page < 1 || page > this.totalPages || page === this.currentPage) return;
        this.currentPage = page;
        this.loadStudents(page);
    }

    /**
     * 更新学生数量显示
     */
    updateStudentCount() {
        const countElement = document.getElementById('total-count');
        if (countElement) {
            countElement.textContent = this.totalRecords;
        }
    }

    /**
     * 处理搜索
     */
    handleSearch(query) {
        this.filters.search = query;
        this.debounce(() => this.loadStudents(1), 300)();
    }

    /**
     * 执行搜索
     */
    performSearch() {
        const query = document.getElementById('search-input')?.value || '';
        this.filters.search = query;
        this.loadStudents(1);
    }

    /**
     * 切换筛选面板
     */
    toggleFilterPanel() {
        const panel = document.getElementById('filter-panel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    }

    /**
     * 应用筛选
     */
    applyFilters() {
        this.filters.major = document.getElementById('major-filter')?.value || '';
        this.filters.class = document.getElementById('class-filter')?.value || '';
        this.filters.status = document.getElementById('status-filter')?.value || '';
        
        this.loadStudents(1);
        this.toggleFilterPanel();
    }

    /**
     * 重置筛选
     */
    resetFilters() {
        this.filters = {
            search: '',
            major: '',
            class: '',
            status: ''
        };
        
        document.getElementById('search-input').value = '';
        document.getElementById('major-filter').value = '';
        document.getElementById('class-filter').value = '';
        document.getElementById('status-filter').value = '';
        
        this.loadStudents(1);
        this.toggleFilterPanel();
    }

    /**
     * 加载筛选选项
     */
    async loadFilterOptions() {
        try {
            const majors = [...new Set(this.students.map(s => s.major).filter(Boolean))];
            const classes = [...new Set(this.students.map(s => s.class_name).filter(Boolean))];
            
            // 更新专业选项
            const majorFilter = document.getElementById('major-filter');
            if (majorFilter) {
                const currentValue = majorFilter.value;
                majorFilter.innerHTML = '<option value="">全部专业</option>' +
                    majors.map(major => `<option value="${major}" ${major === currentValue ? 'selected' : ''}>${major}</option>`).join('');
            }
            
            // 更新班级选项
            const classFilter = document.getElementById('class-filter');
            if (classFilter) {
                const currentValue = classFilter.value;
                classFilter.innerHTML = '<option value="">全部班级</option>' +
                    classes.map(className => `<option value="${className}" ${className === currentValue ? 'selected' : ''}>${className}</option>`).join('');
            }
        } catch (error) {
            console.error('Load filter options error:', error);
        }
    }

    /**
     * 切换视图
     */
    switchView(view) {
        if (this.currentView === view) return;
        
        this.currentView = view;
        
        // 更新按钮状态
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // 重新渲染
        this.renderStudents();
    }

    /**
     * 处理排序
     */
    handleSort(field) {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
        
        // 更新排序图标
        document.querySelectorAll('.sortable i').forEach(icon => {
            icon.className = 'fas fa-sort';
        });
        
        const currentIcon = document.querySelector(`[data-sort="${field}"] i`);
        if (currentIcon) {
            currentIcon.className = `fas fa-sort-${this.sortDirection === 'asc' ? 'up' : 'down'}`;
        }
        
        this.loadStudents(1);
    }

    /**
     * 处理学生选择
     */
    handleStudentSelect(event) {
        const studentId = event.target.value;
        const isChecked = event.target.checked;
        
        if (isChecked) {
            this.selectedStudents.add(studentId);
        } else {
            this.selectedStudents.delete(studentId);
        }
        
        this.updateBatchActions();
        this.updateSelectAllCheckbox();
    }

    /**
     * 全选/取消全选
     */
    toggleSelectAll(checked) {
        this.selectedStudents.clear();
        
        if (checked) {
            this.filteredStudents.forEach(student => {
                this.selectedStudents.add(student.student_id);
            });
        }
        
        // 更新复选框状态
        document.querySelectorAll('.student-checkbox').forEach(checkbox => {
            checkbox.checked = checked;
        });
        
        // 更新表格行样式
        document.querySelectorAll('#students-tbody tr').forEach(row => {
            row.classList.toggle('selected', checked);
        });
        
        this.updateBatchActions();
    }

    /**
     * 更新全选复选框状态
     */
    updateSelectAllCheckbox() {
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        if (!selectAllCheckbox) return;
        
        const totalVisible = this.filteredStudents.length;
        const selectedVisible = this.filteredStudents.filter(s => this.selectedStudents.has(s.student_id)).length;
        
        selectAllCheckbox.checked = totalVisible > 0 && selectedVisible === totalVisible;
        selectAllCheckbox.indeterminate = selectedVisible > 0 && selectedVisible < totalVisible;
    }

    /**
     * 更新批量操作按钮
     */
    updateBatchActions() {
        const batchDeleteBtn = document.getElementById('batch-delete-btn');
        if (batchDeleteBtn) {
            batchDeleteBtn.style.display = this.selectedStudents.size > 0 ? 'inline-flex' : 'none';
        }
    }

    /**
     * 显示添加学生模态框
     */
    showAddStudentModal() {
        this.resetStudentForm();
        document.getElementById('modal-title').textContent = '添加学生';
        this.studentModal.show();
    }

    /**
     * 查看学生详情
     */
    async viewStudent(studentId) {
        try {
            const response = await fetch(`/api/students/${studentId}`);
            const student = await response.json();
            
            if (response.ok) {
                this.renderStudentDetail(student);
                this.detailModal.show();
            } else {
                this.showMessage('获取学生信息失败：' + student.error, 'error');
            }
        } catch (error) {
            this.showMessage('网络错误，请稍后重试', 'error');
        }
    }

    /**
     * 渲染学生详情
     */
    renderStudentDetail(student) {
        const content = document.getElementById('student-detail-content');
        if (!content) return;
        
        content.innerHTML = `
            <div class="student-detail">
                <div class="detail-header">
                    <div class="detail-avatar">
                        ${student.avatar ? 
                            `<img src="${student.avatar}" alt="${student.name}" class="student-avatar-large">` :
                            `<div class="avatar-placeholder-large"><i class="fas fa-user"></i></div>`
                        }
                    </div>
                    <div class="detail-basic">
                        <h2>${student.name}</h2>
                        <p class="student-id">${student.student_id}</p>
                        <span class="status-badge ${this.getStatusClass(student.student_status)}">
                            ${student.student_status || '在读'}
                        </span>
                    </div>
                </div>
                
                <div class="detail-sections">
                    <div class="detail-section">
                        <h3>基本信息</h3>
                        <div class="detail-grid">
                            ${student.gender ? `<div class="detail-item"><label>性别:</label><span>${student.gender}</span></div>` : ''}
                            ${student.birth_date ? `<div class="detail-item"><label>出生日期:</label><span>${student.birth_date}</span></div>` : ''}
                            ${student.id_card ? `<div class="detail-item"><label>身份证号:</label><span>${student.id_card}</span></div>` : ''}
                            ${student.phone ? `<div class="detail-item"><label>联系电话:</label><span>${student.phone}</span></div>` : ''}
                            ${student.email ? `<div class="detail-item"><label>邮箱:</label><span>${student.email}</span></div>` : ''}
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h3>学术信息</h3>
                        <div class="detail-grid">
                            ${student.major ? `<div class="detail-item"><label>专业:</label><span>${student.major}</span></div>` : ''}
                            ${student.class_name ? `<div class="detail-item"><label>班级:</label><span>${student.class_name}</span></div>` : ''}
                            ${student.grade ? `<div class="detail-item"><label>年级:</label><span>${student.grade}</span></div>` : ''}
                            ${student.education_level ? `<div class="detail-item"><label>学制:</label><span>${student.education_level}</span></div>` : ''}
                            ${student.admission_date ? `<div class="detail-item"><label>入学日期:</label><span>${student.admission_date}</span></div>` : ''}
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h3>联系信息</h3>
                        <div class="detail-grid">
                            ${student.address ? `<div class="detail-item full-width"><label>家庭住址:</label><span>${student.address}</span></div>` : ''}
                            ${student.emergency_contact ? `<div class="detail-item"><label>紧急联系人:</label><span>${student.emergency_contact}</span></div>` : ''}
                            ${student.emergency_phone ? `<div class="detail-item"><label>紧急联系电话:</label><span>${student.emergency_phone}</span></div>` : ''}
                            ${student.parent_name ? `<div class="detail-item"><label>家长姓名:</label><span>${student.parent_name}</span></div>` : ''}
                            ${student.parent_phone ? `<div class="detail-item"><label>家长电话:</label><span>${student.parent_phone}</span></div>` : ''}
                        </div>
                    </div>
                    
                    ${student.notes ? `
                    <div class="detail-section">
                        <h3>备注</h3>
                        <div class="detail-notes">${student.notes}</div>
                    </div>
                    ` : ''}
                    
                    <div class="detail-section">
                        <h3>系统信息</h3>
                        <div class="detail-grid">
                            <div class="detail-item"><label>创建时间:</label><span>${student.created_at}</span></div>
                            <div class="detail-item"><label>更新时间:</label><span>${student.updated_at}</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="detail-actions">
                    <button class="btn btn-primary" onclick="studentManager.editStudent('${student.student_id}')">
                        <i class="fas fa-edit"></i> 编辑
                    </button>
                    <button class="btn btn-danger" onclick="studentManager.deleteStudent('${student.student_id}')">
                        <i class="fas fa-trash"></i> 删除
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 编辑学生
     */
    async editStudent(studentId) {
        try {
            const response = await fetch(`/api/students/${studentId}`);
            const student = await response.json();
            
            if (response.ok) {
                this.fillStudentForm(student);
                document.getElementById('modal-title').textContent = '编辑学生';
                this.studentModal.show();
                this.detailModal.hide();
            } else {
                this.showMessage('获取学生信息失败：' + student.error, 'error');
            }
        } catch (error) {
            this.showMessage('网络错误，请稍后重试', 'error');
        }
    }

    /**
     * 填充学生表单
     */
    fillStudentForm(student) {
        const form = document.getElementById('student-form');
        if (!form) return;
        
        // 填充表单字段
        Object.keys(student).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input && student[key] !== null && student[key] !== undefined) {
                input.value = student[key];
            }
        });
        
        // 设置原始学号用于更新
        form.dataset.originalStudentId = student.student_id;
    }

    /**
     * 重置学生表单
     */
    resetStudentForm() {
        const form = document.getElementById('student-form');
        if (!form) return;
        
        form.reset();
        delete form.dataset.originalStudentId;
        
        // 切换到第一个表单页面
        this.switchFormSection('basic');
    }

    /**
     * 切换表单页面
     */
    switchFormSection(target) {
        // 更新导航标签
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.target === target);
        });
        
        // 切换表单页面
        document.querySelectorAll('.form-section').forEach(section => {
            section.classList.toggle('active', section.dataset.section === target);
        });
    }

    /**
     * 处理学生表单提交
     */
    async handleStudentFormSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const studentData = Object.fromEntries(formData.entries());
        
        // 验证表单
        if (!this.validateStudentForm(studentData)) {
            return;
        }
        
        const isEdit = !!form.dataset.originalStudentId;
        const url = isEdit ? `/api/students/${form.dataset.originalStudentId}` : '/api/students';
        const method = isEdit ? 'PUT' : 'POST';
        
        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(studentData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showMessage(isEdit ? '学生信息更新成功' : '学生添加成功', 'success');
                this.studentModal.hide();
                this.loadStudents(this.currentPage);
                this.loadStats();
            } else {
                this.showMessage(result.error || '操作失败', 'error');
            }
        } catch (error) {
            this.showMessage('网络错误，请稍后重试', 'error');
        }
    }

    /**
     * 验证学生表单
     */
    validateStudentForm(data) {
        const errors = [];
        
        if (!data.student_id?.trim()) {
            errors.push('学号不能为空');
        }
        
        if (!data.name?.trim()) {
            errors.push('姓名不能为空');
        }
        
        if (data.email && !this.isValidEmail(data.email)) {
            errors.push('邮箱格式不正确');
        }
        
        if (data.phone && !this.isValidPhone(data.phone)) {
            errors.push('手机号格式不正确');
        }
        
        if (data.id_card && !this.isValidIdCard(data.id_card)) {
            errors.push('身份证号格式不正确');
        }
        
        if (errors.length > 0) {
            this.showMessage(errors.join('；'), 'error');
            return false;
        }
        
        return true;
    }

    /**
     * 删除学生
     */
    async deleteStudent(studentId) {
        if (!confirm('确定要删除这个学生吗？此操作不可恢复。')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/students/${studentId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                this.showMessage('学生删除成功', 'success');
                this.loadStudents(this.currentPage);
                this.loadStats();
                this.detailModal.hide();
            } else {
                const result = await response.json();
                this.showMessage('删除失败：' + result.error, 'error');
            }
        } catch (error) {
            this.showMessage('网络错误，请稍后重试', 'error');
        }
    }

    /**
     * 批量删除学生
     */
    async batchDeleteStudents() {
        if (this.selectedStudents.size === 0) {
            this.showMessage('请先选择要删除的学生', 'warning');
            return;
        }
        
        if (!confirm(`确定要删除选中的 ${this.selectedStudents.size} 个学生吗？此操作不可恢复。`)) {
            return;
        }
        
        try {
            const response = await fetch('/api/students/batch-delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    student_ids: Array.from(this.selectedStudents)
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showMessage(result.message, 'success');
                this.selectedStudents.clear();
                this.loadStudents(this.currentPage);
                this.loadStats();
                this.updateBatchActions();
            } else {
                this.showMessage('批量删除失败：' + result.error, 'error');
            }
        } catch (error) {
            this.showMessage('网络错误，请稍后重试', 'error');
        }
    }

    /**
     * 导出学生数据
     */
    exportStudents(format = 'excel') {
        const params = new URLSearchParams({
            format: format,
            ...this.filters
        });
        
        window.open(`/api/students/export?${params}`, '_blank');
    }

    /**
     * 显示导入模态框
     */
    showImportModal() {
        this.importModal.show();
    }

    /**
     * 下载导入模板
     */
    downloadTemplate() {
        // 创建模板数据
        const template = [
            ['student_id', 'name', 'gender', 'birth_date', 'phone', 'email', 'major', 'class_name', 'grade', 'education_level', 'address', 'parent_name', 'parent_phone'],
            ['202301001', '张三', '男', '2000-01-01', '13800138000', 'zhangsan@example.com', '计算机科学与技术', '计科2023-1班', '2023级', '本科', '北京市朝阳区', '张父', '13900139000']
        ];
        
        // 转换为CSV格式
        const csvContent = template.map(row => row.join(',')).join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        
        // 下载文件
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = '学生信息导入模板.csv';
        link.click();
        URL.revokeObjectURL(link.href);
    }

    /**
     * 处理文件选择
     */
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.processImportFile(file);
        }
    }

    /**
     * 处理导入文件
     */
    async processImportFile(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            this.showImportProgress();
            
            const response = await fetch('/api/students/batch-import', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showImportResult(result);
                this.loadStudents(this.currentPage);
                this.loadStats();
            } else {
                this.showMessage('导入失败：' + result.error, 'error');
            }
        } catch (error) {
            this.showMessage('网络错误，请稍后重试', 'error');
        } finally {
            this.hideImportProgress();
        }
    }

    /**
     * 显示导入进度
     */
    showImportProgress() {
        document.getElementById('import-progress').style.display = 'block';
        document.getElementById('import-progress-fill').style.width = '100%';
        document.getElementById('import-progress-text').textContent = '正在导入...';
    }

    /**
     * 隐藏导入进度
     */
    hideImportProgress() {
        document.getElementById('import-progress').style.display = 'none';
    }

    /**
     * 显示导入结果
     */
    showImportResult(result) {
        const resultDiv = document.getElementById('import-result');
        if (!resultDiv) return;
        
        resultDiv.innerHTML = `
            <h4>导入完成</h4>
            <div class="import-summary">
                <div class="summary-item success">
                    <i class="fas fa-check-circle"></i>
                    成功导入: ${result.success_count} 条
                </div>
                ${result.error_count > 0 ? `
                <div class="summary-item error">
                    <i class="fas fa-exclamation-circle"></i>
                    导入失败: ${result.error_count} 条
                </div>
                ` : ''}
            </div>
            ${result.errors && result.errors.length > 0 ? `
            <div class="import-errors">
                <h5>错误详情：</h5>
                <ul>
                    ${result.errors.map(error => `<li>${error}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
        `;
        
        resultDiv.style.display = 'block';
    }

    /**
     * 设置拖拽上传
     */
    setupDragAndDrop() {
        const uploadArea = document.getElementById('upload-area');
        if (!uploadArea) return;
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.processImportFile(files[0]);
            }
        });
    }

    /**
     * 设置表单验证
     */
    setupFormValidation() {
        const form = document.getElementById('student-form');
        if (!form) return;
        
        // 实时验证
        form.addEventListener('input', (e) => {
            this.validateField(e.target);
        });
        
        form.addEventListener('blur', (e) => {
            this.validateField(e.target);
        }, true);
    }

    /**
     * 验证单个字段
     */
    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let message = '';
        
        switch (field.name) {
            case 'student_id':
                if (!value) {
                    isValid = false;
                    message = '学号不能为空';
                }
                break;
            case 'name':
                if (!value) {
                    isValid = false;
                    message = '姓名不能为空';
                }
                break;
            case 'email':
                if (value && !this.isValidEmail(value)) {
                    isValid = false;
                    message = '邮箱格式不正确';
                }
                break;
            case 'phone':
                if (value && !this.isValidPhone(value)) {
                    isValid = false;
                    message = '手机号格式不正确';
                }
                break;
            case 'id_card':
                if (value && !this.isValidIdCard(value)) {
                    isValid = false;
                    message = '身份证号格式不正确';
                }
                break;
        }
        
        // 更新字段样式
        field.classList.toggle('invalid', !isValid);
        
        // 显示错误消息
        let errorElement = field.parentNode.querySelector('.field-error');
        if (!isValid && message) {
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'field-error';
                field.parentNode.appendChild(errorElement);
            }
            errorElement.textContent = message;
        } else if (errorElement) {
            errorElement.remove();
        }
        
        return isValid;
    }

    /**
     * 处理键盘快捷键
     */
    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + A: 全选
        if ((event.ctrlKey || event.metaKey) && event.key === 'a' && !event.target.matches('input, textarea')) {
            event.preventDefault();
            this.toggleSelectAll(true);
        }
        
        // Delete: 删除选中项
        if (event.key === 'Delete' && this.selectedStudents.size > 0 && !event.target.matches('input, textarea')) {
            event.preventDefault();
            this.batchDeleteStudents();
        }
        
        // Escape: 关闭模态框
        if (event.key === 'Escape') {
            if (this.studentModal?.isVisible()) {
                this.studentModal.hide();
            } else if (this.detailModal?.isVisible()) {
                this.detailModal.hide();
            } else if (this.importModal?.isVisible()) {
                this.importModal.hide();
            }
        }
        
        // Ctrl/Cmd + F: 聚焦搜索框
        if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
            event.preventDefault();
            document.getElementById('search-input')?.focus();
        }
    }

    /**
     * 显示加载状态
     */
    showLoading() {
        document.getElementById('loading-students')?.style.setProperty('display', 'flex');
    }

    /**
     * 隐藏加载状态
     */
    hideLoading() {
        document.getElementById('loading-students')?.style.setProperty('display', 'none');
    }

    /**
     * 显示消息提示
     */
    showMessage(message, type = 'info') {
        const messageContainer = document.getElementById('message-container');
        if (!messageContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = `message message-${type}`;
        messageElement.innerHTML = `
            <i class="fas ${this.getMessageIcon(type)}"></i>
            <span>${message}</span>
            <button type="button" class="message-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        messageContainer.appendChild(messageElement);

        // 自动移除消息（除了错误消息）
        if (type !== 'error') {
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.remove();
                }
            }, 5000);
        }

        // 添加进入动画
        setTimeout(() => {
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateX(0)';
        }, 10);
    }

    /**
     * 获取消息图标
     */
    getMessageIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    /**
     * 防抖函数
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * 验证邮箱格式
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * 验证手机号格式
     */
    isValidPhone(phone) {
        const phoneRegex = /^1[3-9]\d{9}$/;
        return phoneRegex.test(phone);
    }

    /**
     * 验证身份证号格式
     */
    isValidIdCard(idCard) {
        const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
        return idCardRegex.test(idCard);
    }

    /**
     * 格式化日期
     */
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN');
    }

    /**
     * 获取状态显示文本
     */
    getStatusText(status) {
        const statusMap = {
            '在读': '在读',
            '休学': '休学',
            '毕业': '毕业',
            '退学': '退学',
            '转学': '转学'
        };
        return statusMap[status] || status;
    }

    /**
     * 清理选择状态
     */
    clearSelection() {
        this.selectedStudents.clear();
        const checkboxes = document.querySelectorAll('.student-checkbox');
        checkboxes.forEach(cb => cb.checked = false);
        this.updateSelectAllCheckbox();
        this.updateBatchActions();
    }

    /**
     * 刷新页面数据
     */
    async refresh() {
        this.clearSelection();
        await this.loadStudents(this.currentPage);
        await this.loadStats();
        this.showMessage('数据已刷新', 'success');
    }

    /**
     * 导出选中的学生数据
     */
    async exportSelectedStudents(format = 'excel') {
        if (this.selectedStudents.size === 0) {
            this.showMessage('请先选择要导出的学生', 'warning');
            return;
        }

        try {
            const studentIds = Array.from(this.selectedStudents).join(',');
            const url = `/api/students/export?format=${format}&student_ids=${studentIds}`;
            const link = document.createElement('a');
            link.href = url;
            link.download = `selected_students.${format === 'excel' ? 'xlsx' : 'csv'}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            this.showMessage(`已导出 ${this.selectedStudents.size} 名学生的数据`, 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showMessage('导出失败，请稍后重试', 'error');
        }
    }

    /**
     * 复制学生信息到剪贴板
     */
    async copyStudentInfo(studentId) {
        try {
            const student = this.students.find(s => s.id === studentId);
            if (!student) return;

            const info = `姓名：${student.name}\n学号：${student.student_id}\n专业：${student.major || ''}\n班级：${student.class_name || ''}\n电话：${student.phone || ''}\n邮箱：${student.email || ''}`;
            
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(info);
                this.showMessage('学生信息已复制到剪贴板', 'success');
            } else {
                // 降级处理
                const textArea = document.createElement('textarea');
                textArea.value = info;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                this.showMessage('学生信息已复制到剪贴板', 'success');
            }
        } catch (error) {
            console.error('Copy error:', error);
            this.showMessage('复制失败', 'error');
        }
    }

    /**
     * 打印学生信息
     */
    printStudent(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>学生信息 - ${student.name}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                    .info-group { margin-bottom: 15px; }
                    .info-group h3 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                    .info-item { margin: 5px 0; }
                    .label { font-weight: bold; display: inline-block; width: 120px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>学生信息表</h1>
                    <p>打印时间：${new Date().toLocaleString('zh-CN')}</p>
                </div>
                <div class="info-group">
                    <h3>基本信息</h3>
                    <div class="info-item"><span class="label">姓名：</span>${student.name}</div>
                    <div class="info-item"><span class="label">学号：</span>${student.student_id}</div>
                    <div class="info-item"><span class="label">性别：</span>${student.gender || ''}</div>
                    <div class="info-item"><span class="label">出生日期：</span>${this.formatDate(student.birth_date)}</div>
                    <div class="info-item"><span class="label">身份证号：</span>${student.id_card || ''}</div>
                </div>
                <div class="info-group">
                    <h3>学术信息</h3>
                    <div class="info-item"><span class="label">专业：</span>${student.major || ''}</div>
                    <div class="info-item"><span class="label">班级：</span>${student.class_name || ''}</div>
                    <div class="info-item"><span class="label">年级：</span>${student.grade || ''}</div>
                    <div class="info-item"><span class="label">学制：</span>${student.education_level || ''}</div>
                    <div class="info-item"><span class="label">入学日期：</span>${this.formatDate(student.admission_date)}</div>
                    <div class="info-item"><span class="label">学生状态：</span>${student.student_status || ''}</div>
                </div>
                <div class="info-group">
                    <h3>联系信息</h3>
                    <div class="info-item"><span class="label">联系电话：</span>${student.phone || ''}</div>
                    <div class="info-item"><span class="label">邮箱：</span>${student.email || ''}</div>
                    <div class="info-item"><span class="label">家庭住址：</span>${student.address || ''}</div>
                    <div class="info-item"><span class="label">紧急联系人：</span>${student.emergency_contact || ''}</div>
                    <div class="info-item"><span class="label">紧急联系电话：</span>${student.emergency_phone || ''}</div>
                    <div class="info-item"><span class="label">家长姓名：</span>${student.parent_name || ''}</div>
                    <div class="info-item"><span class="label">家长电话：</span>${student.parent_phone || ''}</div>
                </div>
                ${student.notes ? `
                <div class="info-group">
                    <h3>备注信息</h3>
                    <div class="info-item">${student.notes}</div>
                </div>
                ` : ''}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
}

/**
 * 模态框类
 */
class Modal {
    constructor(modalId) {
        this.modal = document.getElementById(modalId);
        this.isOpen = false;
        this.bindEvents();
    }

    bindEvents() {
        if (!this.modal) return;
        
        // 关闭按钮
        this.modal.querySelectorAll('.modal-close, [data-dismiss="modal"]').forEach(btn => {
            btn.addEventListener('click', () => this.hide());
        });
        
        // 点击背景关闭
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });
        
        // 取消按钮
        this.modal.querySelectorAll('.btn[data-action="cancel"]').forEach(btn => {
            btn.addEventListener('click', () => this.hide());
        });
    }

    show() {
        if (!this.modal) return;
        
        this.modal.classList.add('show');
        this.isOpen = true;
        document.body.style.overflow = 'hidden';
        
        // 聚焦第一个输入框
        const firstInput = this.modal.querySelector('input:not([type="hidden"]), textarea, select');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }

    hide() {
        if (!this.modal) return;
        
        this.modal.classList.remove('show');
        this.isOpen = false;
        document.body.style.overflow = '';
    }

    isVisible() {
        return this.isOpen;
    }
}

// 初始化学生管理器
let studentManager;

document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('正在初始化学生管理系统...');
        studentManager = new StudentManager();
        window.studentManager = studentManager;
        console.log('学生管理系统初始化完成');
    } catch (error) {
        console.error('学生管理系统初始化失败:', error);
        // 显示错误消息
        const container = document.getElementById('message-container');
        if (container) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'message message-error';
            errorDiv.innerHTML = `
                <i class="fas fa-exclamation-circle"></i>
                <span>系统初始化失败，请刷新页面重试</span>
            `;
            container.appendChild(errorDiv);
        }
    }
});

// 全局函数，供HTML调用
window.getStudentManager = () => studentManager;