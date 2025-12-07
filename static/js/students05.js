document.getElementById("attendanceForm").addEventListener("submit", function(event) {
    event.preventDefault(); // 防止表单提交导致页面刷新

    const studentName = document.getElementById("studentName").value;
    const attendanceDate = document.getElementById("attendanceDate").value;
    const attendanceStatus = document.getElementById("attendanceStatus").value;

    addAttendanceToTable(studentName, attendanceDate, attendanceStatus);

    // 清空输入框
    document.getElementById("attendanceForm").reset();
});

function addAttendanceToTable(studentName, attendanceDate, attendanceStatus) {
    const attendanceTable = document.getElementById("attendanceTable");
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${studentName}</td>
        <td>${attendanceDate}</td>
        <td>${attendanceStatus}</td>
    `;
    attendanceTable.appendChild(row);
}
