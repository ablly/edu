# AI辅助编程功能说明

## 功能概述

本系统新增了AI辅助编程功能，使用讯飞星火API提供智能编程辅助服务。

## 主要功能

### 1. 编程助手 (`/api/ai/programming-help`)
- **功能**: 提供编程问题解答和代码建议
- **输入**: 代码(可选) + 问题描述 + 编程语言
- **输出**: AI生成的编程建议和解决方案

### 2. 代码审查 (`/api/ai/code-review`)
- **功能**: 对代码进行专业审查
- **输入**: 代码 + 编程语言
- **输出**: 代码质量评估、性能优化建议、安全性分析等

### 3. 代码解释 (`/api/ai/code-explain`)
- **功能**: 详细解释代码功能和工作原理
- **输入**: 代码 + 编程语言
- **输出**: 代码功能说明、执行流程、关键概念解释

### 4. 调试帮助 (`/api/ai/debug-help`)
- **功能**: 帮助定位和解决代码问题
- **输入**: 代码 + 错误信息 + 编程语言
- **输出**: 错误原因分析、修复方案、预防建议

## API配置

### 讯飞星火API配置
```python
# config.py
XFYUN_API_BASE_URL = "https://xingchen-api.xf-yun.com/workflow/v1/chat/completions"
XFYUN_API_KEY = "af8be9d6008068463afb2e211bfe1fa7"
XFYUN_API_SECRET = "ZmYxYjUzMjczYjgyMTk1YWNiOTNjNzQ3"
XFYUN_AI_CHAT_FLOW_ID = "7360863546909450242"
```

## 使用方法

### 1. 启动应用
```bash
python app.py
```

### 2. 访问辅助编程页面
打开浏览器访问: `http://localhost:5000/Auxiliary-programming`

### 3. 使用功能
1. 选择功能标签页（编程助手、代码审查、代码解释、调试帮助）
2. 选择编程语言
3. 输入代码和/或问题描述
4. 点击提交按钮获取AI建议

### 4. API调用示例
```python
import requests

# 编程助手API调用示例
response = requests.post('http://localhost:5000/api/ai/programming-help', json={
    "code": "def bubble_sort(arr):\n    # 冒泡排序代码",
    "question": "这个算法有什么可以优化的地方？",
    "language": "python"
})

result = response.json()
print(result['response'])
```

## 测试

运行测试脚本验证功能：
```bash
python test_programming_api.py
```

## 支持的编程语言

- Python
- Java
- C++
- C
- JavaScript

## 注意事项

1. **API限制**: 讯飞星火API有调用频率限制，请合理使用
2. **错误处理**: 如果讯飞API失败，系统会自动回退到DeepSeek API
3. **安全性**: 所有用户输入都经过HTML转义处理，防止XSS攻击
4. **响应时间**: AI处理可能需要几秒钟，请耐心等待

## 故障排除

### 常见问题

1. **API调用失败**
   - 检查网络连接
   - 验证API密钥是否正确
   - 确认API配额是否充足

2. **页面显示异常**
   - 清除浏览器缓存
   - 检查静态文件是否正确加载

3. **功能无响应**
   - 检查Flask应用是否正常运行
   - 查看控制台错误信息

### 日志查看
```bash
# 查看应用日志
tail -f app.log
```

## 更新日志

- **v1.0**: 初始版本，支持基本的编程辅助功能
- 集成讯飞星火API
- 支持多种编程语言
- 提供Web界面和API接口