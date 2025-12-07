document.addEventListener('DOMContentLoaded', function () {
    // 获取DOM元素
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // 各功能的提交按钮
    const helpSubmitBtn = document.getElementById('help-submit');
    const reviewSubmitBtn = document.getElementById('review-submit');
    const explainSubmitBtn = document.getElementById('explain-submit');
    const debugSubmitBtn = document.getElementById('debug-submit');

    // 标签页切换
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            
            // 移除所有活动状态
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // 添加当前活动状态
            this.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });

    // 编程助手功能
    helpSubmitBtn.addEventListener('click', async function() {
        const language = document.getElementById('help-language').value;
        const code = document.getElementById('help-code').value.trim();
        const question = document.getElementById('help-question').value.trim();
        const resultDiv = document.getElementById('help-result');

        if (!question) {
            showError(resultDiv, '请输入问题描述');
            return;
        }

        showLoading(resultDiv, '正在分析您的问题...');

        try {
            const response = await fetch('/api/ai/programming-help', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    code: code,
                    question: question,
                    language: language
                })
            });

            const data = await response.json();

            // 处理未登录错误 (401)
            if (response.status === 401) {
                window.showAuthError(data.message || '请先登录后使用此功能', '/login');
                showError(resultDiv, '请先登录');
                return;
            }
            
            // 处理无会员权限错误 (403)
            if (response.status === 403) {
                window.showAuthError(data.message || '请购买会员后使用本功能', '/payment');
                showError(resultDiv, '请购买会员');
                return;
            }

            if (response.ok && data.success) {
                showResult(resultDiv, data.response, '编程助手建议');
            } else {
                showError(resultDiv, data.error || '请求失败');
            }
        } catch (error) {
            console.error('编程助手错误:', error);
            showError(resultDiv, '网络错误，请重试');
        }
    });

    // 代码审查功能
    reviewSubmitBtn.addEventListener('click', async function() {
        const language = document.getElementById('review-language').value;
        const code = document.getElementById('review-code').value.trim();
        const resultDiv = document.getElementById('review-result');

        if (!code) {
            showError(resultDiv, '请输入要审查的代码');
            return;
        }

        showLoading(resultDiv, '正在审查您的代码...');

        try {
            const response = await fetch('/api/ai/code-review', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    code: code,
                    language: language
                })
            });

            const data = await response.json();

            // 处理未登录错误 (401)
            if (response.status === 401) {
                window.showAuthError(data.message || '请先登录后使用此功能', '/login');
                showError(resultDiv, '请先登录');
                return;
            }
            
            // 处理无会员权限错误 (403)
            if (response.status === 403) {
                window.showAuthError(data.message || '请购买会员后使用本功能', '/payment');
                showError(resultDiv, '请购买会员');
                return;
            }

            if (response.ok && data.success) {
                showResult(resultDiv, data.review, '代码审查结果');
            } else {
                showError(resultDiv, data.error || '请求失败');
            }
        } catch (error) {
            console.error('代码审查错误:', error);
            showError(resultDiv, '网络错误，请重试');
        }
    });

    // 代码解释功能
    explainSubmitBtn.addEventListener('click', async function() {
        const language = document.getElementById('explain-language').value;
        const code = document.getElementById('explain-code').value.trim();
        const resultDiv = document.getElementById('explain-result');

        if (!code) {
            showError(resultDiv, '请输入要解释的代码');
            return;
        }

        showLoading(resultDiv, '正在解释您的代码...');

        try {
            const response = await fetch('/api/ai/code-explain', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    code: code,
                    language: language
                })
            });

            const data = await response.json();

            // 处理未登录错误 (401)
            if (response.status === 401) {
                window.showAuthError(data.message || '请先登录后使用此功能', '/login');
                showError(resultDiv, '请先登录');
                return;
            }
            
            // 处理无会员权限错误 (403)
            if (response.status === 403) {
                window.showAuthError(data.message || '请购买会员后使用本功能', '/payment');
                showError(resultDiv, '请购买会员');
                return;
            }

            if (response.ok && data.success) {
                showEnhancedResult(resultDiv, data.explanation, '代码解释', code, language);
            } else {
                showError(resultDiv, data.error || '请求失败');
            }
        } catch (error) {
            console.error('代码解释错误:', error);
            showError(resultDiv, '网络错误，请重试');
        }
    });

    // 调试帮助功能
    debugSubmitBtn.addEventListener('click', async function() {
        const language = document.getElementById('debug-language').value;
        const code = document.getElementById('debug-code').value.trim();
        const errorMessage = document.getElementById('debug-error').value.trim();
        const resultDiv = document.getElementById('debug-result');

        if (!code && !errorMessage) {
            showError(resultDiv, '请输入代码或错误信息');
            return;
        }

        showLoading(resultDiv, '正在分析调试问题...');

        try {
            const response = await fetch('/api/ai/debug-help', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    code: code,
                    error_message: errorMessage,
                    language: language
                })
            });

            const data = await response.json();

            // 处理未登录错误 (401)
            if (response.status === 401) {
                window.showAuthError(data.message || '请先登录后使用此功能', '/login');
                showError(resultDiv, '请先登录');
                return;
            }
            
            // 处理无会员权限错误 (403)
            if (response.status === 403) {
                window.showAuthError(data.message || '请购买会员后使用本功能', '/payment');
                showError(resultDiv, '请购买会员');
                return;
            }

            if (response.ok && data.success) {
                showResult(resultDiv, data.debug_help, '调试建议');
            } else {
                showError(resultDiv, data.error || '请求失败');
            }
        } catch (error) {
            console.error('调试帮助错误:', error);
            showError(resultDiv, '网络错误，请重试');
        }
    });

    // 显示加载状态
    function showLoading(container, message) {
        // 清除所有内容
        container.innerHTML = '';
        
        // 创建加载容器
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-container';
        loadingDiv.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 200px;
            padding: 40px 20px;
            text-align: center;
            font-family: 'Microsoft YaHei', Arial, sans-serif;
        `;
        
        // 创建加载动画
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.style.cssText = `
            width: 50px;
            height: 50px;
            border: 4px solid #e0e6ed;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
        `;
        
        // 创建加载文字
        const text = document.createElement('p');
        text.style.cssText = `
            margin: 0;
            font-size: 16px;
            color: #667eea;
            font-weight: 500;
            writing-mode: horizontal-tb;
            text-orientation: mixed;
            direction: ltr;
            unicode-bidi: normal;
        `;
        text.textContent = message;
        
        // 组装结构
        loadingDiv.appendChild(spinner);
        loadingDiv.appendChild(text);
        container.appendChild(loadingDiv);
        
        // 确保容器可见
        container.style.display = 'block';
    }

    // 显示错误信息
    function showError(container, message) {
        // 清除所有内容
        container.innerHTML = '';
        
        // 创建错误容器
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-container';
        errorDiv.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 200px;
            padding: 40px 20px;
            text-align: center;
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            margin: 20px 0;
            font-family: 'Microsoft YaHei', Arial, sans-serif;
        `;
        
        // 创建错误标题
        const title = document.createElement('h3');
        title.style.cssText = `
            margin: 0 0 15px 0;
            font-size: 18px;
            color: #dc2626;
            font-weight: 600;
            writing-mode: horizontal-tb;
            text-orientation: mixed;
            direction: ltr;
        `;
        title.innerHTML = '<i class="fas fa-exclamation-triangle"></i> 出现错误';
        
        // 创建错误文字
        const text = document.createElement('p');
        text.style.cssText = `
            margin: 0;
            font-size: 14px;
            color: #dc2626;
            line-height: 1.6;
            writing-mode: horizontal-tb;
            text-orientation: mixed;
            direction: ltr;
            unicode-bidi: normal;
        `;
        text.textContent = message;
        
        // 组装结构
        errorDiv.appendChild(title);
        errorDiv.appendChild(text);
        container.appendChild(errorDiv);
        
        // 确保容器可见
        container.style.display = 'block';
    }

    // 显示结果
    function showResult(container, content, title) {
        const formattedContent = formatContent(content);
        container.innerHTML = `
            <div class="result">
                <h3>✅ ${title}</h3>
                <div class="result-content">${formattedContent}</div>
            </div>
        `;
        container.style.display = 'block';
        
        // 高亮代码块
        if (typeof Prism !== 'undefined') {
            Prism.highlightAllUnder(container);
        }
    }

    // 格式化内容，处理代码块和换行
    function formatContent(content) {
        if (!content) return '';
        
        // 转义HTML
        let formatted = escapeHtml(content);
        
        // 处理代码块
        formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, function(match, lang, code) {
            const language = lang || 'text';
            return `<pre><code class="language-${language}">${code.trim()}</code></pre>`;
        });
        
        // 处理行内代码
        formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // 处理换行
        formatted = formatted.replace(/\n/g, '<br>');
        
        return formatted;
    }

    // HTML转义函数
    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // 自动调整文本框高度
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    });
});

// 代码解释增强功能
class CodeExplainEnhancer {
    constructor() {
        this.editor = null;
        this.realtimeMode = false;
        this.debounceTimer = null;
        this.codeExamples = this.initCodeExamples();
        this.init();
    }

    init() {
        this.bindEvents();
        this.initEditor();
        this.updateEditorStats();
    }

    bindEvents() {
        // 代码示例按钮
        document.querySelectorAll('.example-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const example = e.target.dataset.example;
                this.loadCodeExample(example);
            });
        });

        // 控制按钮
        document.getElementById('clear-code-btn')?.addEventListener('click', () => {
            this.clearCode();
        });

        document.getElementById('copy-code-btn')?.addEventListener('click', () => {
            this.copyCode();
        });

        document.getElementById('fullscreen-btn')?.addEventListener('click', () => {
            this.toggleFullscreen();
        });

        document.getElementById('copy-explanation-btn')?.addEventListener('click', () => {
            this.copyExplanation();
        });

        document.getElementById('export-explanation-btn')?.addEventListener('click', () => {
            this.exportExplanation();
        });

        document.getElementById('clear-explanation-btn')?.addEventListener('click', () => {
            this.clearExplanation();
        });

        // 实时解释按钮
        document.getElementById('explain-realtime')?.addEventListener('click', () => {
            this.toggleRealtimeMode();
        });

        // 编辑器主题切换
        document.getElementById('editor-theme')?.addEventListener('change', (e) => {
            this.changeEditorTheme(e.target.value);
        });

        // 行号显示切换
        document.getElementById('show-line-numbers')?.addEventListener('change', (e) => {
            this.toggleLineNumbers(e.target.checked);
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    initEditor() {
        this.editor = document.getElementById('explain-code');
        if (this.editor) {
            this.editor.addEventListener('input', () => {
                this.updateEditorStats();
                if (this.realtimeMode) {
                    this.debounceRealtime();
                }
            });

            this.editor.addEventListener('scroll', () => {
                this.updateCursorPosition();
            });

            this.editor.addEventListener('click', () => {
                this.updateCursorPosition();
            });

            this.editor.addEventListener('keyup', () => {
                this.updateCursorPosition();
            });
        }
    }

    initCodeExamples() {
        return {
            fibonacci: {
                language: 'python',
                code: `def fibonacci(n):
    """计算斐波那契数列的第n项"""
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# 优化版本：使用动态规划
def fibonacci_dp(n):
    if n <= 1:
        return n
    
    a, b = 0, 1
    for i in range(2, n + 1):
        a, b = b, a + b
    return b

# 测试
for i in range(10):
    print(f"fibonacci({i}) = {fibonacci_dp(i)}")`
            },
            quicksort: {
                language: 'python',
                code: `def quicksort(arr):
    """快速排序算法实现"""
    if len(arr) <= 1:
        return arr
    
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    
    return quicksort(left) + middle + quicksort(right)

# 原地排序版本
def quicksort_inplace(arr, low=0, high=None):
    if high is None:
        high = len(arr) - 1
    
    if low < high:
        pi = partition(arr, low, high)
        quicksort_inplace(arr, low, pi - 1)
        quicksort_inplace(arr, pi + 1, high)

def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    
    for j in range(low, high):
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1

# 测试
test_array = [64, 34, 25, 12, 22, 11, 90]
print("原数组:", test_array)
sorted_array = quicksort(test_array.copy())
print("排序后:", sorted_array)`
            },
            'binary-search': {
                language: 'python',
                code: `def binary_search(arr, target):
    """二分查找算法"""
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1

# 递归版本
def binary_search_recursive(arr, target, left=0, right=None):
    if right is None:
        right = len(arr) - 1
    
    if left > right:
        return -1
    
    mid = (left + right) // 2
    
    if arr[mid] == target:
        return mid
    elif arr[mid] < target:
        return binary_search_recursive(arr, target, mid + 1, right)
    else:
        return binary_search_recursive(arr, target, left, mid - 1)

# 测试
sorted_array = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19]
target = 7
result = binary_search(sorted_array, target)

if result != -1:
    print(f"元素 {target} 在索引 {result} 处找到")
else:
    print(f"元素 {target} 未找到")`
            },
            'linked-list': {
                language: 'python',
                code: `class ListNode:
    """链表节点"""
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class LinkedList:
    """单向链表实现"""
    def __init__(self):
        self.head = None
        self.size = 0
    
    def append(self, val):
        """在链表尾部添加元素"""
        new_node = ListNode(val)
        if not self.head:
            self.head = new_node
        else:
            current = self.head
            while current.next:
                current = current.next
            current.next = new_node
        self.size += 1
    
    def prepend(self, val):
        """在链表头部添加元素"""
        new_node = ListNode(val)
        new_node.next = self.head
        self.head = new_node
        self.size += 1
    
    def delete(self, val):
        """删除指定值的节点"""
        if not self.head:
            return False
        
        if self.head.val == val:
            self.head = self.head.next
            self.size -= 1
            return True
        
        current = self.head
        while current.next:
            if current.next.val == val:
                current.next = current.next.next
                self.size -= 1
                return True
            current = current.next
        return False
    
    def display(self):
        """显示链表内容"""
        elements = []
        current = self.head
        while current:
            elements.append(current.val)
            current = current.next
        return " -> ".join(map(str, elements))

# 测试
ll = LinkedList()
ll.append(1)
ll.append(2)
ll.append(3)
ll.prepend(0)
print("链表内容:", ll.display())
ll.delete(2)
print("删除2后:", ll.display())`
            },
            decorator: {
                language: 'python',
                code: `import functools
import time

def timer(func):
    """计时装饰器"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        print(f"{func.__name__} 执行时间: {end_time - start_time:.4f}秒")
        return result
    return wrapper

def retry(max_attempts=3, delay=1):
    """重试装饰器"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts - 1:
                        raise e
                    print(f"第 {attempt + 1} 次尝试失败: {e}")
                    time.sleep(delay)
        return wrapper
    return decorator

def cache(func):
    """缓存装饰器"""
    cache_dict = {}
    
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        # 创建缓存键
        key = str(args) + str(sorted(kwargs.items()))
        
        if key in cache_dict:
            print(f"缓存命中: {func.__name__}")
            return cache_dict[key]
        
        result = func(*args, **kwargs)
        cache_dict[key] = result
        return result
    return wrapper

# 使用示例
@timer
@cache
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

@retry(max_attempts=3, delay=0.5)
def unreliable_function():
    import random
    if random.random() < 0.7:
        raise Exception("随机失败")
    return "成功!"

# 测试
print("斐波那契数列测试:")
for i in range(10):
    print(f"fibonacci({i}) = {fibonacci(i)}")

print("\\n重试机制测试:")
try:
    result = unreliable_function()
    print(f"结果: {result}")
except Exception as e:
    print(f"最终失败: {e}")`
            },
            async: {
                language: 'python',
                code: `import asyncio
import aiohttp
import time

async def fetch_url(session, url):
    """异步获取URL内容"""
    try:
        async with session.get(url) as response:
            return await response.text()
    except Exception as e:
        return f"错误: {e}"

async def fetch_multiple_urls(urls):
    """并发获取多个URL"""
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_url(session, url) for url in urls]
        results = await asyncio.gather(*tasks)
        return results

async def producer(queue, n):
    """生产者协程"""
    for i in range(n):
        await asyncio.sleep(0.1)  # 模拟工作
        await queue.put(f"item_{i}")
        print(f"生产: item_{i}")
    await queue.put(None)  # 结束信号

async def consumer(queue, name):
    """消费者协程"""
    while True:
        item = await queue.get()
        if item is None:
            break
        await asyncio.sleep(0.2)  # 模拟处理
        print(f"消费者 {name} 处理: {item}")
        queue.task_done()

async def producer_consumer_example():
    """生产者-消费者模式示例"""
    queue = asyncio.Queue(maxsize=5)
    
    # 创建任务
    producer_task = asyncio.create_task(producer(queue, 10))
    consumer_tasks = [
        asyncio.create_task(consumer(queue, f"C{i}"))
        for i in range(3)
    ]
    
    # 等待生产者完成
    await producer_task
    
    # 等待队列处理完成
    await queue.join()
    
    # 取消消费者任务
    for task in consumer_tasks:
        task.cancel()

# 异步上下文管理器
class AsyncResource:
    async def __aenter__(self):
        print("获取异步资源")
        await asyncio.sleep(0.1)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        print("释放异步资源")
        await asyncio.sleep(0.1)
    
    async def do_work(self):
        print("执行异步工作")
        await asyncio.sleep(0.5)
        return "工作完成"

async def main():
    """主异步函数"""
    print("异步编程示例\\n")
    
    # 示例1: 异步上下文管理器
    print("1. 异步上下文管理器:")
    async with AsyncResource() as resource:
        result = await resource.do_work()
        print(f"结果: {result}")
    
    print("\\n2. 生产者-消费者模式:")
    await producer_consumer_example()

# 运行示例
if __name__ == "__main__":
    asyncio.run(main())`
            }
        };
    }

    loadCodeExample(exampleKey) {
        const example = this.codeExamples[exampleKey];
        if (example && this.editor) {
            // 设置语言
            const languageSelect = document.getElementById('explain-language');
            if (languageSelect) {
                languageSelect.value = example.language;
            }
            
            // 设置代码
            this.editor.value = example.code;
            this.updateEditorStats();
            
            // 显示提示
            this.showToast(`已加载 ${exampleKey} 示例代码`, 'success');
        }
    }

    updateEditorStats() {
        if (!this.editor) return;
        
        const content = this.editor.value;
        const lines = content.split('\n').length;
        const chars = content.length;
        
        const lineCountEl = document.getElementById('line-count');
        const charCountEl = document.getElementById('char-count');
        
        if (lineCountEl) lineCountEl.textContent = `行数: ${lines}`;
        if (charCountEl) charCountEl.textContent = `字符: ${chars}`;
    }

    updateCursorPosition() {
        if (!this.editor) return;
        
        const cursorPos = this.editor.selectionStart;
        const textBeforeCursor = this.editor.value.substring(0, cursorPos);
        const lines = textBeforeCursor.split('\n');
        const currentLine = lines.length;
        const currentCol = lines[lines.length - 1].length + 1;
        
        const cursorPosEl = document.getElementById('cursor-position');
        if (cursorPosEl) {
            cursorPosEl.textContent = `位置: ${currentLine}:${currentCol}`;
        }
    }

    clearCode() {
        if (this.editor) {
            this.editor.value = '';
            this.updateEditorStats();
            this.showToast('代码已清空', 'info');
        }
    }

    copyCode() {
        if (this.editor && this.editor.value) {
            navigator.clipboard.writeText(this.editor.value).then(() => {
                this.showToast('代码已复制到剪贴板', 'success');
            }).catch(() => {
                this.showToast('复制失败', 'error');
            });
        }
    }

    toggleFullscreen() {
        const container = document.querySelector('.explain-container');
        if (container) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                container.requestFullscreen();
            }
        }
    }

    copyExplanation() {
        const resultDiv = document.getElementById('explain-result');
        if (resultDiv) {
            const text = resultDiv.textContent || resultDiv.innerText;
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('解释内容已复制到剪贴板', 'success');
            }).catch(() => {
                this.showToast('复制失败', 'error');
            });
        }
    }

    exportExplanation() {
        const resultDiv = document.getElementById('explain-result');
        if (resultDiv) {
            const content = resultDiv.innerHTML;
            const blob = new Blob([content], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `code-explanation-${Date.now()}.html`;
            a.click();
            URL.revokeObjectURL(url);
            this.showToast('解释内容已导出', 'success');
        }
    }

    clearExplanation() {
        const resultDiv = document.getElementById('explain-result');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="result-placeholder">
                    <div class="placeholder-icon">
                        <i class="fas fa-code"></i>
                    </div>
                    <h4>欢迎使用AI代码解释</h4>
                    <p>在左侧输入代码，点击"解释代码"按钮获取详细解释</p>
                    <div class="features-list">
                        <div class="feature-item">
                            <i class="fas fa-check"></i>
                            <span>支持多种编程语言</span>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-check"></i>
                            <span>逐行详细解释</span>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-check"></i>
                            <span>算法和数据结构分析</span>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-check"></i>
                            <span>最佳实践建议</span>
                        </div>
                    </div>
                </div>
            `;
            this.showToast('解释内容已清空', 'info');
        }
    }

    toggleRealtimeMode() {
        this.realtimeMode = !this.realtimeMode;
        const btn = document.getElementById('explain-realtime');
        if (btn) {
            if (this.realtimeMode) {
                btn.innerHTML = '<i class="fas fa-pause"></i> 停止实时';
                btn.classList.add('active');
                this.showToast('实时解释模式已开启', 'info');
            } else {
                btn.innerHTML = '<i class="fas fa-sync-alt"></i> 实时解释';
                btn.classList.remove('active');
                this.showToast('实时解释模式已关闭', 'info');
            }
        }
    }

    debounceRealtime() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            const explainBtn = document.getElementById('explain-submit');
            if (explainBtn && this.editor && this.editor.value.trim()) {
                explainBtn.click();
            }
        }, 2000);
    }

    changeEditorTheme(theme) {
        if (!this.editor) return;
        
        // 移除所有主题类
        this.editor.classList.remove('dark-theme', 'monokai-theme', 'github-theme');
        
        // 添加新主题类
        if (theme !== 'default') {
            this.editor.classList.add(`${theme}-theme`);
        }
        
        this.showToast(`已切换到 ${theme} 主题`, 'info');
    }

    toggleLineNumbers(show) {
        // 这里可以添加行号显示逻辑
        this.showToast(show ? '行号已显示' : '行号已隐藏', 'info');
    }

    handleKeyboardShortcuts(e) {
        // F11 - 全屏
        if (e.key === 'F11') {
            e.preventDefault();
            this.toggleFullscreen();
        }
        
        // Ctrl+Enter - 解释代码
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            const explainBtn = document.getElementById('explain-submit');
            if (explainBtn) explainBtn.click();
        }
        
        // Ctrl+Shift+C - 复制代码
        if (e.ctrlKey && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            this.copyCode();
        }
        
        // Ctrl+Shift+X - 清空代码
        if (e.ctrlKey && e.shiftKey && e.key === 'X') {
            e.preventDefault();
            this.clearCode();
        }
    }

    showToast(message, type = 'info') {
        // 创建简单的toast通知
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#00b894' : type === 'error' ? '#e74c3c' : '#667eea'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10000;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        // 3秒后移除
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// 增强的结果显示函数
function showEnhancedResult(element, content, title, originalCode = '', language = '') {
    // 清空容器
    element.innerHTML = '';
    
    // 创建内容容器
    const contentDiv = document.createElement('div');
    contentDiv.className = 'explanation-content';
    contentDiv.style.cssText = `
        font-family: 'Microsoft YaHei', Arial, sans-serif;
        writing-mode: horizontal-tb;
        text-orientation: mixed;
        direction: ltr;
        unicode-bidi: normal;
    `;
    
    const sections = content.split(/\n\s*\n/);
    
    // 如果内容包含明显的段落结构，进行分段显示
    if (sections.length > 1) {
        sections.forEach((section, index) => {
            if (section.trim()) {
                const isCodeBlock = section.includes('```') || section.includes('def ') || section.includes('class ') || section.includes('function');
                
                const sectionDiv = document.createElement('div');
                sectionDiv.className = 'explanation-section';
                sectionDiv.style.cssText = `
                    margin-bottom: 25px;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    border-left: 4px solid #667eea;
                    writing-mode: horizontal-tb;
                    text-orientation: mixed;
                    direction: ltr;
                `;
                
                if (isCodeBlock) {
                    const titleEl = document.createElement('h5');
                    titleEl.textContent = '代码示例';
                    titleEl.style.cssText = `
                        color: #667eea;
                        margin-bottom: 12px;
                        font-size: 16px;
                        font-weight: 600;
                    `;
                    
                    const codeEl = document.createElement('div');
                    codeEl.className = 'code-snippet';
                    codeEl.style.cssText = `
                        background: #1e1e1e;
                        color: #d4d4d4;
                        padding: 15px;
                        border-radius: 6px;
                        font-family: 'Cascadia Code', 'Fira Code', 'Courier New', monospace;
                        font-size: 13px;
                        line-height: 1.5;
                        overflow-x: auto;
                        margin: 15px 0;
                        border: 1px solid #444;
                        white-space: pre;
                    `;
                    codeEl.textContent = section.trim();
                    
                    sectionDiv.appendChild(titleEl);
                    sectionDiv.appendChild(codeEl);
                } else {
                    const lines = section.trim().split('\n');
                    const sectionTitle = lines[0].length < 50 ? lines[0] : `解释 ${index + 1}`;
                    const sectionContent = lines.slice(lines[0].length < 50 ? 1 : 0).join('\n');
                    
                    const titleEl = document.createElement('h5');
                    titleEl.textContent = sectionTitle;
                    titleEl.style.cssText = `
                        color: #667eea;
                        margin-bottom: 12px;
                        font-size: 16px;
                        font-weight: 600;
                    `;
                    
                    const contentEl = document.createElement('p');
                    contentEl.textContent = sectionContent;
                    contentEl.style.cssText = `
                        margin-bottom: 12px;
                        line-height: 1.7;
                        color: #333;
                    `;
                    
                    sectionDiv.appendChild(titleEl);
                    sectionDiv.appendChild(contentEl);
                }
                
                contentDiv.appendChild(sectionDiv);
            }
        });
    } else {
        // 单段内容的简单显示
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'explanation-section';
        sectionDiv.style.cssText = `
            margin-bottom: 25px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #667eea;
            writing-mode: horizontal-tb;
            text-orientation: mixed;
            direction: ltr;
        `;
        
        const titleEl = document.createElement('h5');
        titleEl.textContent = title;
        titleEl.style.cssText = `
            color: #667eea;
            margin-bottom: 12px;
            font-size: 16px;
            font-weight: 600;
        `;
        
        const contentEl = document.createElement('p');
        contentEl.textContent = content;
        contentEl.style.cssText = `
            margin-bottom: 12px;
            line-height: 1.7;
            color: #333;
        `;
        
        sectionDiv.appendChild(titleEl);
        sectionDiv.appendChild(contentEl);
        contentDiv.appendChild(sectionDiv);
    }
    
    element.appendChild(contentDiv);
    element.classList.add('success');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 初始化增强功能
document.addEventListener('DOMContentLoaded', () => {
    new CodeExplainEnhancer();
});
