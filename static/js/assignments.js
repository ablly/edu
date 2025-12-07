document.addEventListener('DOMContentLoaded', function () {
    const assignmentsDiv = document.getElementById('assignments');

    // 获取所有发布的作业
    fetch('/api/assignments')
        .then(response => response.json())
        .then(data => {
            if (data.assignments.length === 0) {
                assignmentsDiv.innerHTML = '<p>暂无发布的作业。</p>';
                return;
            }

            data.assignments.forEach(assignment => {
                const assignmentDiv = document.createElement('div');
                assignmentDiv.className = 'assignment-item';
                assignmentDiv.innerHTML = `
                    <h3>作业名称: ${assignment.assignment_name}</h3>
                    <p>发布时间: ${assignment.publish_time}</p>
                    <button class="btn view-questions" data-assignment-id="${assignment.id}">查看题目</button>
                `;
                assignmentsDiv.appendChild(assignmentDiv);
            });

            // 为查看题目按钮添加事件监听器
            document.querySelectorAll('.view-questions').forEach(button => {
                button.addEventListener('click', function () {
                    const assignmentId = this.getAttribute('data-assignment-id');
                    viewAssignmentQuestions(assignmentId);
                });
            });
        })
        .catch(error => {
            assignmentsDiv.innerHTML = '<p>加载作业失败，请稍后重试。</p>';
        });
});
