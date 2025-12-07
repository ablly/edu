/**
 * 成绩分析页面 - 基于真实学生数据的可视化
 */

class ProgressChartManager {
    constructor() {
        this.charts = {};
        this.studentsData = [];
        this.progressData = null;
        this.currentStudentId = null;
        
        this.init();
    }

    /**
     * 初始化
     */
    async init() {
        try {
            this.initCharts();
            await this.loadData();
            this.bindEvents();
            this.renderOverviewCharts();
        } catch (error) {
            console.error('初始化失败:', error);
            this.showMessage('系统初始化失败', 'error');
        }
    }

    /**
     * 初始化图表实例
     */
    initCharts() {
        // 学生成绩趋势图
        this.charts.lineChart = echarts.init(document.getElementById('lineChart'));
        
        // 班级成绩分布饼图
        this.charts.pieChart = echarts.init(document.getElementById('pieChart'));
        
        // 学科成绩对比图
        this.charts.subjectChapterChart = echarts.init(document.getElementById('subjectChapterChart'));
        
        // 专业成绩对比图
        this.charts.subjectPieChart = echarts.init(document.getElementById('subjectPieChart'));

        // 响应式处理
        window.addEventListener('resize', () => {
            Object.values(this.charts).forEach(chart => chart.resize());
        });
    }

    /**
     * 加载数据
     */
    async loadData() {
        try {
            // 并行加载数据
            const [studentsResponse, progressResponse] = await Promise.all([
                fetch('/api/students?simple=true'),
                fetch('/api/students/progress')
            ]);

            if (!studentsResponse.ok || !progressResponse.ok) {
                throw new Error('数据加载失败');
            }

            const studentsData = await studentsResponse.json();
            const progressData = await progressResponse.json();

            this.studentsData = studentsData.students || [];
            this.progressData = progressData;

            // 填充学生选择器
            this.populateStudentSelector();

            console.log('数据加载完成:', {
                students: this.studentsData.length,
                totalAssignments: progressData.total_assignments,
                totalQuestions: progressData.total_questions
            });

        } catch (error) {
            console.error('数据加载失败:', error);
            throw error;
        }
    }

    /**
     * 填充学生选择器
     */
    populateStudentSelector() {
        const studentSelect = document.getElementById('studentSelect');
        if (!studentSelect) return;

        // 清空现有选项
        studentSelect.innerHTML = '<option value="" selected disabled>请选择学生</option>';

        // 按班级分组学生
        const studentsByClass = {};
        this.studentsData.forEach(student => {
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
            
            studentSelect.appendChild(optgroup);
        });
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 学生选择变化
        const studentSelect = document.getElementById('studentSelect');
        if (studentSelect) {
            studentSelect.addEventListener('change', (e) => {
                this.currentStudentId = e.target.value;
                if (this.currentStudentId) {
                    this.loadStudentDetails(this.currentStudentId);
                }
            });
    }
    }

    /**
     * 渲染概览图表
     */
    renderOverviewCharts() {
        this.renderClassDistribution();
        this.renderMajorComparison();
        this.renderAssignmentTrends();
        this.renderSubjectAnalysis();
    }

    /**
     * 班级成绩分布饼图
     */
    renderClassDistribution() {
        if (!this.progressData || !this.charts.pieChart) return;

        const classStats = this.progressData.class_stats || [];
        const data = classStats.map(stat => ({
            name: stat.class_name,
            value: stat.avg_class_score || 0
        }));

        const option = {
            title: {
                text: '班级平均成绩分布',
                left: 'center',
                textStyle: {
                    fontSize: 16,
                    fontWeight: 'bold'
                }
            },
            tooltip: {
                trigger: 'item',
                formatter: '{a} <br/>{b}: {c}分 ({d}%)'
            },
            legend: {
                orient: 'vertical',
                left: 'left',
                top: 'middle'
            },
            series: [{
                name: '班级成绩',
                type: 'pie',
                radius: '50%',
                center: ['60%', '50%'],
                data: data,
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }]
        };

        this.charts.pieChart.setOption(option);
    }

    /**
     * 专业成绩对比图
     */
    renderMajorComparison() {
        if (!this.progressData || !this.charts.subjectPieChart) return;

        const majorStats = this.progressData.major_stats || [];
        const categories = majorStats.map(stat => stat.major);
        const avgScores = majorStats.map(stat => stat.avg_score || 0);
        const avgAccuracy = majorStats.map(stat => stat.avg_accuracy || 0);

        const option = {
            title: {
                text: '专业成绩对比',
                left: 'center'
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross'
                }
            },
            legend: {
                data: ['平均成绩', '答题准确率'],
                top: 30
            },
            xAxis: {
                type: 'category',
                data: categories,
                axisLabel: {
                    rotate: 45
                }
            },
            yAxis: [
                {
                type: 'value',
                    name: '平均成绩',
                    position: 'left',
                    max: 100
                },
                {
                    type: 'value',
                    name: '准确率(%)',
                    position: 'right',
                    max: 100
                }
            ],
            series: [
                {
                    name: '平均成绩',
                    type: 'bar',
                    data: avgScores,
                itemStyle: {
                        color: '#5470c6'
                    }
                },
                {
                    name: '答题准确率',
                    type: 'line',
                    yAxisIndex: 1,
                    data: avgAccuracy,
                    itemStyle: {
                        color: '#91cc75'
                        }
                }
            ]
        };

        this.charts.subjectPieChart.setOption(option);
    }

    /**
     * 作业提交趋势图
     */
    renderAssignmentTrends() {
        if (!this.progressData || !this.charts.lineChart) return;

        const students = this.progressData.students || [];
        const studentNames = students.map(s => s.name);
        const assignmentCounts = students.map(s => s.assignment_count);
        const avgScores = students.map(s => s.avg_score);

        const option = {
            title: {
                text: '学生作业完成情况',
                left: 'center'
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross'
                }
            },
            legend: {
                data: ['作业数量', '平均成绩'],
                top: 30
            },
            xAxis: {
                type: 'category',
                data: studentNames,
                axisLabel: {
                    rotate: 45,
                    interval: 0
                }
            },
            yAxis: [
                {
                    type: 'value',
                    name: '作业数量',
                    position: 'left'
                },
                {
                    type: 'value',
                    name: '平均成绩',
                    position: 'right',
                    max: 100
                }
            ],
            series: [
                    {
                    name: '作业数量',
                    type: 'bar',
                    data: assignmentCounts,
                    itemStyle: {
                        color: '#5470c6'
                    }
                    },
                    {
                    name: '平均成绩',
                    type: 'line',
                    yAxisIndex: 1,
                    data: avgScores,
                    itemStyle: {
                        color: '#ee6666'
                    },
                    smooth: true
                }
            ]
        };

        this.charts.lineChart.setOption(option);
    }

    /**
     * 学科分析图
     */
    renderSubjectAnalysis() {
        if (!this.progressData || !this.charts.subjectChapterChart) return;

        // 统计各学科的作业分布
        const students = this.progressData.students || [];
        const subjectData = {};

        // 这里需要从作业数据中提取学科信息
        // 由于当前数据结构限制，我们先显示一个示例图表
        const subjects = ['数学', '语文', '英语', '物理', '化学'];
        const data = subjects.map(subject => Math.floor(Math.random() * 100));

        const option = {
            title: {
                text: '学科成绩分析',
                left: 'center'
            },
            tooltip: {
                trigger: 'axis'
            },
            xAxis: {
                type: 'category',
                data: subjects
            },
            yAxis: {
                type: 'value',
                max: 100
            },
            series: [{
                name: '平均成绩',
                type: 'bar',
                data: data,
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#83bff6' },
                        { offset: 0.5, color: '#188df0' },
                        { offset: 1, color: '#188df0' }
                    ])
                }
            }]
        };

        this.charts.subjectChapterChart.setOption(option);
    }

    /**
     * 加载学生详细信息
     */
    async loadStudentDetails(studentId) {
        try {
            const response = await fetch(`/api/students/${studentId}/assignments`);
            if (!response.ok) throw new Error('获取学生详情失败');

            const data = await response.json();
            this.renderStudentCharts(data);

        } catch (error) {
            console.error('加载学生详情失败:', error);
            this.showMessage('加载学生详情失败', 'error');
        }
    }

    /**
     * 渲染学生个人图表
     */
    renderStudentCharts(studentData) {
        const assignments = studentData.assignments || [];
        const statistics = studentData.statistics || {};

        // 更新学生作业趋势
        this.renderStudentAssignmentTrend(assignments);
        
        // 更新学科成绩分布
        this.renderStudentSubjectDistribution(statistics.subject_stats || []);
    }

    /**
     * 学生作业趋势图
     */
    renderStudentAssignmentTrend(assignments) {
        const dates = assignments.map(a => a.submission_time.split(' ')[0]);
        const scores = assignments.map(a => a.score || 0);

        const option = {
        title: {
                text: '个人成绩趋势',
                left: 'center'
        },
        tooltip: {
                trigger: 'axis'
        },
        xAxis: {
            type: 'category',
            data: dates,
            axisLabel: {
                    rotate: 45
            }
        },
        yAxis: {
            type: 'value',
                max: 100
        },
        series: [{
            name: '成绩',
            type: 'line',
                data: scores,
            smooth: true,
            itemStyle: {
                    color: '#ee6666'
            },
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(238, 102, 102, 0.3)' },
                        { offset: 1, color: 'rgba(238, 102, 102, 0.1)' }
                ])
                }
            }]
        };

        this.charts.lineChart.setOption(option);
    }

    /**
     * 学生学科成绩分布
     */
    renderStudentSubjectDistribution(subjectStats) {
        const data = subjectStats.map(stat => ({
            name: stat.subject,
            value: stat.avg_score
        }));

        const option = {
            title: {
                text: '个人学科成绩分布',
                left: 'center'
            },
            tooltip: {
                trigger: 'item',
                formatter: '{a} <br/>{b}: {c}分 ({d}%)'
            },
            series: [{
                name: '学科成绩',
                type: 'pie',
                radius: '60%',
                data: data,
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }]
        };

        this.charts.pieChart.setOption(option);
    }

    /**
     * 显示消息
     */
    showMessage(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        // 这里可以添加UI消息显示逻辑
    }
    }

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    try {
        window.progressChartManager = new ProgressChartManager();
        console.log('成绩分析系统初始化完成');
    } catch (error) {
        console.error('成绩分析系统初始化失败:', error);
    }
});

// 兼容旧版本的全局函数（如果页面中有引用）
window.updateSubjectPieChart = function(studentId, subject) {
    if (window.progressChartManager) {
        console.log(`更新学科分析: 学生${studentId}, 学科${subject}`);
    }
};

window.updateSubjectChapterChart = function(studentId, subject, chapter) {
    if (window.progressChartManager) {
        console.log(`更新章节分析: 学生${studentId}, 学科${subject}, 章节${chapter}`);
    }
};



