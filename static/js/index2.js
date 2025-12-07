document.addEventListener('DOMContentLoaded', function() {
    const pptFileInput = document.getElementById('ppt-file');
    const wordFileInput = document.getElementById('word-file');
    const pptFilename = document.getElementById('ppt-filename');
    const wordFilename = document.getElementById('word-filename');
    const uploadBtn = document.getElementById('upload-btn');
    const processBtn = document.getElementById('process-btn');
    const downloadBtn = document.getElementById('download-btn');
    const resetBtn = document.getElementById('reset-btn');

    const uploadSection = document.querySelector('.upload-section');
    const processSection = document.querySelector('.process-section');
    const progressSection = document.querySelector('.progress-section');
    const resultSection = document.querySelector('.result-section');

    let uploadedFiles = {};
    let processResult = {};

    // 文件选择事件
    pptFilename.addEventListener('click', () => pptFileInput.click());
    wordFilename.addEventListener('click', () => wordFileInput.click());

    pptFileInput.addEventListener('change', function() {
        if (this.files[0]) {
            pptFilename.textContent = this.files[0].name;
        }
    });

    wordFileInput.addEventListener('change', function() {
        if (this.files[0]) {
            wordFilename.textContent = this.files[0].name;
        }
    });

    // 上传文件
    uploadBtn.addEventListener('click', async function() {
        if (!pptFileInput.files[0] || !wordFileInput.files[0]) {
            alert('请选择PPT模板和Word文档文件');
            return;
        }

        const formData = new FormData();
        formData.append('ppt_file', pptFileInput.files[0]);
        formData.append('word_file', wordFileInput.files[0]);

        uploadBtn.disabled = true;
        uploadBtn.textContent = '上传中...';

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                uploadedFiles = data;
                document.getElementById('uploaded-ppt').textContent = data.ppt_filename;
                document.getElementById('uploaded-word').textContent = data.word_filename;

                uploadSection.style.display = 'none';
                processSection.style.display = 'block';
            } else {
                alert('上传失败：' + data.error);
            }
        } catch (error) {
            alert('上传失败：' + error.message);
        } finally {
            uploadBtn.disabled = false;
            uploadBtn.textContent = '上传文件';
        }
    });

    // 处理文件
    processBtn.addEventListener('click', async function() {
        processBtn.disabled = true;
        processSection.style.display = 'none';
        progressSection.style.display = 'block';

        const progressFill = document.querySelector('.progress-fill');
        const statusMessage = document.getElementById('status-message');

        // 重置进度
        progressFill.style.width = '0%';
        statusMessage.textContent = '准备开始处理...';

        // 使用EventSource接收服务器端事件
        const eventSource = new EventSource(`/process-stream?ppt_filename=${encodeURIComponent(uploadedFiles.ppt_filename)}&word_filename=${encodeURIComponent(uploadedFiles.word_filename)}`);

        eventSource.onmessage = function(event) {
            const data = JSON.parse(event.data);

            if (data.type === 'progress') {
                progressFill.style.width = data.percent + '%';
                statusMessage.textContent = data.message;
            } else if (data.type === 'complete') {
                eventSource.close();
                processResult = data.result;
                progressFill.style.width = '100%';
                statusMessage.textContent = '处理完成！';

                // 显示结果
                setTimeout(() => {
                    progressSection.style.display = 'none';
                    resultSection.style.display = 'block';

                    const resultFiles = document.getElementById('result-files');
                    resultFiles.innerHTML = `
                        <li>填充后的PPT：${data.result.output_filename}</li>
                        <li>内容摘要：${data.result.summary_filename}</li>
                        <li>模板结构：${data.result.structure_filename}</li>
                        <li>生成内容：${data.result.content_filename}</li>
                    `;
                }, 1000);
                processBtn.disabled = false;
            } else if (data.type === 'error') {
                eventSource.close();
                alert('处理失败：' + data.message);
                resetToUpload();
                processBtn.disabled = false;
            }
        };

        eventSource.onerror = function(error) {
            eventSource.close();
            alert('连接错误，请重试');
            resetToUpload();
            processBtn.disabled = false;
        };
    });

    // 下载文件
    downloadBtn.addEventListener('click', function() {
        if (processResult.output_filename) {
            window.location.href = `/download/${processResult.output_filename}`;
        }
    });

    // 重置
    resetBtn.addEventListener('click', resetToUpload);

    function resetToUpload() {
        uploadSection.style.display = 'block';
        processSection.style.display = 'none';
        progressSection.style.display = 'none';
        resultSection.style.display = 'none';

        pptFileInput.value = '';
        wordFileInput.value = '';
        pptFilename.textContent = '未选择文件';
        wordFilename.textContent = '未选择文件';

        uploadedFiles = {};
        processResult = {};
    }
});