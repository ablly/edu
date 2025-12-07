const data = [
    { course: "数学", studentCount: 30, averageScore: 85 },
    { course: "英语", studentCount: 25, averageScore: 78 },
    { course: "物理", studentCount: 20, averageScore: 92 },
    { course: "化学", studentCount: 22, averageScore: 88 },
];

function populateTable() {
    const tableBody = document.getElementById("data-table");
    data.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.course}</td>
            <td>${item.studentCount}</td>
            <td>${item.averageScore}</td>
        `;
        tableBody.appendChild(row);
    });
}

function createChart() {
    const ctx = document.getElementById("scoreChart").getContext("2d");
    const labels = data.map(item => item.course);
    const scores = data.map(item => item.averageScore);

    const scoreChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '平均成绩',
                data: scores,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

populateTable();
createChart();
