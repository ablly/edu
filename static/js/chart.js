document.addEventListener('DOMContentLoaded', function() {
    // 初始化图表
    const lineChart = echarts.init(document.getElementById('lineChart'));
    const pieChart = echarts.init(document.getElementById('pieChart'));

    // 响应式调整
    function resizeCharts() {
        lineChart.resize();
        pieChart.resize();
    }
    window.addEventListener('resize', resizeCharts);

    // 学生选择变化事件
    $('#studentSelect').change(function() {
        const studentId = $(this).val();
        if (studentId) {
            $('#loadingIndicator').removeClass('d-none');
            updateCharts(studentId);
        }
    });

    // 更新图表数据
    function updateCharts(studentId) {
        fetch(`/api/scores/${studentId}`)
            .then(response => response.json())
            .then(data => {
                renderLineChart(data);
                renderPieChart(data);
            })
            .catch(error => {
                console.error('加载失败:', error);
                lineChart.showLoading({ text: '数据加载失败' });
                pieChart.showLoading({ text: '数据加载失败' });
            })
            .finally(() => {
                $('#loadingIndicator').addClass('d-none');
            });
    }

    // 渲染折线图
    function renderLineChart(data) {
        const assignments = data.assignments || [];
        const scores = assignments.map(a => a.score);
        const dates = assignments.map(a =>
            new Date(a.submission_time).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            })
        );

        // 动态计算y轴范围 (保证最低分-10分但不低于0，最高分+10但不高于100)
        const minScore = Math.max(0, Math.min(...scores) - 10);
        const maxScore = Math.min(100, Math.max(...scores) + 10);

        lineChart.setOption({
            title: { text: '成绩趋势', left: 'center' },
            tooltip: { trigger: 'axis' },
            xAxis: {
                type: 'category',
                data: dates,
                axisLabel: { rotate: 30 }
            },
            yAxis: {
                type: 'value',
                min: minScore,
                max: maxScore,
                axisLabel: { formatter: '{value}分' }
            },
            series: [{
                data: scores,
                type: 'line',
                smooth: true,
                lineStyle: { color: '#4285F4', width: 3 },
                itemStyle: { color: '#4285F4' }
            }]
        });
    }

    // 渲染饼图
    function renderPieChart(data) {
        const assignments = data.assignments || [];
        const scores = assignments.map(a => a.score);
        const maxScore = Math.max(...scores);
        const minScore = Math.min(...scores);
        const avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);

        pieChart.setOption({
            title: { text: '成绩统计', left: 'center' },
            tooltip: { trigger: 'item' },
            series: [{
                type: 'pie',
                radius: ['40%', '70%'],
                data: [
                    { value: maxScore, name: `最高分: ${maxScore}分`, itemStyle: { color: '#28a745' } },
                    { value: avgScore, name: `平均分: ${avgScore}分`, itemStyle: { color: '#FF9800' } },
                    { value: minScore, name: `最低分: ${minScore}分`, itemStyle: { color: '#dc3545' } }
                ],
                label: { formatter: '{b}' }
            }]
        });
    }
});