let totalScore = 0;
let scoreCount = 0;

document.getElementById("scoreForm").addEventListener("submit", function(event) {
    event.preventDefault(); // 防止表单提交导致页面刷新

    const studentName = document.getElementById("studentName").value;
    const courseName = document.getElementById("courseName").value;
    const score = parseFloat(document.getElementById("score").value);

    addScoreToTable(studentName, courseName, score);
    updateAverageScore(score);

    // 清空输入框
    document.getElementById("scoreForm").reset();
});

function addScoreToTable(studentName, courseName, score) {
    const scoreTable = document.getElementById("scoreTable");
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${studentName}</td>
        <td>${courseName}</td>
        <td>${score}</td>
    `;
    scoreTable.appendChild(row);
}

function updateAverageScore(score) {
    totalScore += score;
    scoreCount++;
    const averageScore = (totalScore / scoreCount).toFixed(2);
    document.getElementById("averageScore").innerText = averageScore;
}
