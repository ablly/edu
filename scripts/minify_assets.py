"""
静态资源压缩脚本
压缩CSS和JavaScript文件以提升加载速度
"""

import os
import re
import sys

def minify_css(content):
    """简单的CSS压缩"""
    # 移除注释
    content = re.sub(r'/\*[\s\S]*?\*/', '', content)
    # 移除多余空白
    content = re.sub(r'\s+', ' ', content)
    # 移除不必要的空格
    content = re.sub(r'\s*([{}:;,])\s*', r'\1', content)
    # 移除最后的分号
    content = re.sub(r';}', '}', content)
    return content.strip()


def minify_js(content):
    """简单的JavaScript压缩"""
    # 移除单行注释（保留URL中的//）
    content = re.sub(r'(?<!:)//.*$', '', content, flags=re.MULTILINE)
    # 移除多行注释
    content = re.sub(r'/\*[\s\S]*?\*/', '', content)
    # 移除多余空白（保留字符串中的空格）
    lines = content.split('\n')
    lines = [line.strip() for line in lines if line.strip()]
    content = '\n'.join(lines)
    return content


def process_directory(directory, file_extension, minify_func):
    """处理目录中的文件"""
    processed_files = []
    total_original_size = 0
    total_minified_size = 0
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(file_extension) and not file.endswith(f'.min{file_extension}'):
                file_path = os.path.join(root, file)
                
                try:
                    # 读取原始文件
                    with open(file_path, 'r', encoding='utf-8') as f:
                        original_content = f.read()
                    
                    # 压缩
                    minified_content = minify_func(original_content)
                    
                    # 生成压缩文件名
                    base_name = file.replace(file_extension, '')
                    minified_file = os.path.join(root, f"{base_name}.min{file_extension}")
                    
                    # 写入压缩文件
                    with open(minified_file, 'w', encoding='utf-8') as f:
                        f.write(minified_content)
                    
                    original_size = len(original_content)
                    minified_size = len(minified_content)
                    reduction = (1 - minified_size / original_size) * 100
                    
                    processed_files.append({
                        'file': file,
                        'original_size': original_size,
                        'minified_size': minified_size,
                        'reduction': reduction
                    })
                    
                    total_original_size += original_size
                    total_minified_size += minified_size
                    
                except Exception as e:
                    print(f"  ❌ 处理失败 {file}: {str(e)}")
    
    return processed_files, total_original_size, total_minified_size


def main():
    """主函数"""
    print("\n╔══════════════════════════════════════════════════════════╗")
    print("║        静态资源压缩工具                                  ║")
    print("╚══════════════════════════════════════════════════════════╝\n")
    
    # 获取项目根目录
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    css_dir = os.path.join(project_root, 'static', 'css')
    js_dir = os.path.join(project_root, 'static', 'js')
    
    # 压缩CSS文件
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("  压缩CSS文件")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    
    css_files, css_original, css_minified = process_directory(css_dir, '.css', minify_css)
    
    for file_info in css_files:
        print(f"✅ {file_info['file']}")
        print(f"   原始: {file_info['original_size']:,} 字节")
        print(f"   压缩: {file_info['minified_size']:,} 字节")
        print(f"   减少: {file_info['reduction']:.1f}%\n")
    
    # 压缩JavaScript文件
    print("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("  压缩JavaScript文件")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    
    js_files, js_original, js_minified = process_directory(js_dir, '.js', minify_js)
    
    for file_info in js_files:
        print(f"✅ {file_info['file']}")
        print(f"   原始: {file_info['original_size']:,} 字节")
        print(f"   压缩: {file_info['minified_size']:,} 字节")
        print(f"   减少: {file_info['reduction']:.1f}%\n")
    
    # 总结
    total_original = css_original + js_original
    total_minified = css_minified + js_minified
    total_reduction = (1 - total_minified / total_original) * 100 if total_original > 0 else 0
    
    print("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("  压缩总结")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    print(f"CSS文件:")
    print(f"  • 处理文件数: {len(css_files)}")
    print(f"  • 原始大小: {css_original:,} 字节")
    print(f"  • 压缩后: {css_minified:,} 字节")
    print(f"  • 减少: {(1 - css_minified / css_original) * 100 if css_original > 0 else 0:.1f}%\n")
    
    print(f"JavaScript文件:")
    print(f"  • 处理文件数: {len(js_files)}")
    print(f"  • 原始大小: {js_original:,} 字节")
    print(f"  • 压缩后: {js_minified:,} 字节")
    print(f"  • 减少: {(1 - js_minified / js_original) * 100 if js_original > 0 else 0:.1f}%\n")
    
    print(f"总计:")
    print(f"  • 文件数: {len(css_files) + len(js_files)}")
    print(f"  • 原始大小: {total_original:,} 字节 ({total_original / 1024:.1f} KB)")
    print(f"  • 压缩后: {total_minified:,} 字节 ({total_minified / 1024:.1f} KB)")
    print(f"  • 总减少: {total_reduction:.1f}%\n")
    
    print("✨ 压缩完成！\n")
    print("建议：")
    print("  1. 在生产环境使用 .min.css 和 .min.js 文件")
    print("  2. 配置Nginx启用Gzip压缩以进一步优化")
    print("  3. 考虑使用CDN加速静态资源加载\n")


if __name__ == '__main__':
    main()




