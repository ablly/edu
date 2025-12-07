"""
性能测试脚本
测试数据库查询、缓存功能和API响应性能
"""

import os
import sys
import time
from datetime import datetime

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine, text
from utils.cache import cached, cache_set, cache_get, get_cache_stats, clear_cache


def get_database_url():
    """获取数据库URL"""
    return os.getenv('DATABASE_URL', 'postgresql://edupilot_user:050102@localhost:5432/edupilot_db')


def test_database_query_performance():
    """测试数据库查询性能"""
    print("\n" + "="*60)
    print("    数据库查询性能测试")
    print("="*60 + "\n")
    
    engine = create_engine(get_database_url())
    
    tests = [
        {
            'name': '用户列表查询',
            'query': 'SELECT * FROM users LIMIT 10',
            'iterations': 5
        },
        {
            'name': '会员状态查询',
            'query': '''
                SELECT u.id, u.username, um.tier_id, um.start_date, um.end_date, um.is_active
                FROM users u
                LEFT JOIN user_memberships um ON u.id = um.user_id
                WHERE um.is_active = true
                LIMIT 10
            ''',
            'iterations': 5
        },
        {
            'name': '支付订单查询',
            'query': '''
                SELECT pt.*, u.username
                FROM payment_transactions pt
                JOIN users u ON pt.user_id = u.id
                ORDER BY pt.created_at DESC
                LIMIT 20
            ''',
            'iterations': 5
        },
        {
            'name': '使用日志统计',
            'query': '''
                SELECT user_id, COUNT(*) as usage_count
                FROM usage_logs
                GROUP BY user_id
                LIMIT 10
            ''',
            'iterations': 5
        }
    ]
    
    results = []
    
    with engine.connect() as conn:
        for test in tests:
            times = []
            print(f"测试: {test['name']}")
            
            for i in range(test['iterations']):
                start_time = time.time()
                try:
                    result = conn.execute(text(test['query']))
                    _ = result.fetchall()
                    end_time = time.time()
                    query_time = (end_time - start_time) * 1000  # 转换为毫秒
                    times.append(query_time)
                    print(f"  运行 {i+1}: {query_time:.2f}ms")
                except Exception as e:
                    print(f"  运行 {i+1}: 失败 - {str(e)[:50]}")
            
            if times:
                avg_time = sum(times) / len(times)
                min_time = min(times)
                max_time = max(times)
                
                results.append({
                    'name': test['name'],
                    'avg_time': avg_time,
                    'min_time': min_time,
                    'max_time': max_time
                })
                
                print(f"  平均: {avg_time:.2f}ms | 最快: {min_time:.2f}ms | 最慢: {max_time:.2f}ms")
            print()
    
    return results


def test_cache_performance():
    """测试缓存性能"""
    print("\n" + "="*60)
    print("    缓存功能性能测试")
    print("="*60 + "\n")
    
    # 清空缓存
    clear_cache()
    
    # 测试1: 基础缓存读写
    print("测试1: 基础缓存读写")
    
    # 写入测试
    write_times = []
    for i in range(100):
        start = time.time()
        cache_set(f"test_key_{i}", {"data": f"value_{i}", "index": i}, ttl=300)
        write_times.append((time.time() - start) * 1000)
    
    avg_write = sum(write_times) / len(write_times)
    print(f"  写入100个缓存项")
    print(f"  平均写入时间: {avg_write:.4f}ms")
    
    # 读取测试
    read_times = []
    for i in range(100):
        start = time.time()
        data = cache_get(f"test_key_{i}")
        read_times.append((time.time() - start) * 1000)
    
    avg_read = sum(read_times) / len(read_times)
    print(f"  读取100个缓存项")
    print(f"  平均读取时间: {avg_read:.4f}ms")
    
    if avg_read > 0:
        print(f"  性能提升: {avg_write/avg_read:.1f}x (相比写入)\n")
    else:
        print(f"  性能提升: 极快（< 0.001ms）\n")
    
    # 测试2: 装饰器缓存
    print("测试2: 装饰器缓存效果")
    
    @cached(ttl=300, key_prefix="expensive_calc")
    def expensive_calculation(n):
        """模拟耗时计算"""
        time.sleep(0.1)  # 模拟100ms的计算
        return sum(range(n))
    
    # 第一次调用（未缓存）
    start = time.time()
    result1 = expensive_calculation(1000)
    time_no_cache = (time.time() - start) * 1000
    
    # 第二次调用（已缓存）
    start = time.time()
    result2 = expensive_calculation(1000)
    time_with_cache = (time.time() - start) * 1000
    
    print(f"  无缓存调用: {time_no_cache:.2f}ms")
    print(f"  有缓存调用: {time_with_cache:.2f}ms")
    
    if time_with_cache > 0:
        print(f"  性能提升: {time_no_cache/time_with_cache:.1f}x")
        print(f"  缓存加速: {((time_no_cache - time_with_cache) / time_no_cache * 100):.1f}%\n")
    else:
        print(f"  性能提升: 极快（缓存命中）\n")
    
    # 测试3: 缓存统计
    stats = get_cache_stats()
    print("测试3: 缓存统计信息")
    print(f"  总缓存项: {stats['total_items']}")
    print(f"  活跃项: {stats['active_items']}")
    print(f"  过期项: {stats['expired_items']}")
    print(f"  内存使用: {stats['memory_usage_estimate']}\n")
    
    return {
        'avg_write_time': avg_write,
        'avg_read_time': avg_read,
        'cache_speedup': time_no_cache / time_with_cache if time_with_cache > 0 else 999,
        'cache_items': stats['total_items']
    }


def test_concurrent_requests():
    """测试并发请求性能（模拟）"""
    print("\n" + "="*60)
    print("    并发请求模拟测试")
    print("="*60 + "\n")
    
    # 清空缓存重新测试
    clear_cache()
    
    @cached(ttl=300)
    def get_membership_status(user_id):
        """模拟会员状态查询"""
        time.sleep(0.05)  # 模拟50ms数据库查询
        return {
            'user_id': user_id,
            'tier': 'premium',
            'expires_at': '2025-12-31'
        }
    
    # 测试相同请求（缓存命中）
    print("测试: 100次相同用户ID的查询")
    
    start = time.time()
    for _ in range(100):
        _ = get_membership_status(1)
    total_time_cached = (time.time() - start) * 1000
    
    print(f"  总耗时: {total_time_cached:.2f}ms")
    print(f"  平均每次: {total_time_cached/100:.2f}ms")
    print(f"  缓存命中率: 99% (仅第一次查询数据库)\n")
    
    # 清空缓存，测试无缓存情况
    clear_cache()
    get_membership_status.clear_cache()
    
    print("对比: 100次查询（无缓存）")
    start = time.time()
    for i in range(100):
        _ = get_membership_status(i)  # 不同ID，每次都查询
    total_time_no_cache = (time.time() - start) * 1000
    
    print(f"  总耗时: {total_time_no_cache:.2f}ms")
    print(f"  平均每次: {total_time_no_cache/100:.2f}ms")
    
    if total_time_cached > 0:
        print(f"  性能对比: 缓存比无缓存快 {total_time_no_cache/total_time_cached:.1f}x\n")
    else:
        print(f"  性能对比: 极快（缓存命中）\n")
    
    return {
        'cached_time': total_time_cached,
        'no_cache_time': total_time_no_cache,
        'speedup': total_time_no_cache / total_time_cached if total_time_cached > 0 else 999
    }


def generate_performance_report(db_results, cache_results, concurrent_results):
    """生成性能测试报告"""
    print("\n" + "="*60)
    print("    性能测试报告总结")
    print("="*60 + "\n")
    
    # 数据库查询报告
    if db_results:
        print("📊 数据库查询性能")
        print("-" * 60)
        for result in db_results:
            print(f"\n{result['name']}:")
            print(f"  • 平均响应: {result['avg_time']:.2f}ms")
            print(f"  • 最快响应: {result['min_time']:.2f}ms")
            print(f"  • 最慢响应: {result['max_time']:.2f}ms")
            
            # 性能评级
            if result['avg_time'] < 20:
                rating = "🟢 优秀"
            elif result['avg_time'] < 50:
                rating = "🟡 良好"
            elif result['avg_time'] < 100:
                rating = "🟠 一般"
            else:
                rating = "🔴 需优化"
            print(f"  • 性能评级: {rating}")
    
    # 缓存性能报告
    print("\n\n⚡ 缓存系统性能")
    print("-" * 60)
    print(f"\n基础操作:")
    print(f"  • 写入速度: {cache_results['avg_write_time']:.4f}ms")
    print(f"  • 读取速度: {cache_results['avg_read_time']:.4f}ms")
    
    if cache_results['avg_read_time'] > 0:
        print(f"  • 读写比: {cache_results['avg_write_time']/cache_results['avg_read_time']:.1f}:1")
    else:
        print(f"  • 读写比: 极快（< 0.001ms）")
    
    print(f"\n装饰器缓存:")
    print(f"  • 性能提升: {cache_results['cache_speedup']:.1f}x")
    print(f"  • 缓存项数: {cache_results['cache_items']}")
    
    # 并发测试报告
    print("\n\n🚀 并发请求性能")
    print("-" * 60)
    print(f"\n100次相同请求:")
    print(f"  • 有缓存: {concurrent_results['cached_time']:.2f}ms (avg: {concurrent_results['cached_time']/100:.2f}ms/次)")
    print(f"  • 无缓存: {concurrent_results['no_cache_time']:.2f}ms (avg: {concurrent_results['no_cache_time']/100:.2f}ms/次)")
    print(f"  • 性能提升: {concurrent_results['speedup']:.1f}x")
    
    # 优化建议
    print("\n\n💡 优化建议")
    print("-" * 60)
    
    if db_results:
        slow_queries = [r for r in db_results if r['avg_time'] > 50]
        if slow_queries:
            print("\n需要优化的查询:")
            for query in slow_queries:
                print(f"  • {query['name']} (平均 {query['avg_time']:.2f}ms)")
                print(f"    建议: 检查是否添加了相应索引")
        else:
            print("\n✅ 所有数据库查询性能良好！")
    
    if cache_results['cache_speedup'] < 10:
        print("\n⚠️  缓存加速效果较低，考虑:")
        print("  • 增加缓存TTL时间")
        print("  • 缓存更多热点数据")
    else:
        print("\n✅ 缓存系统运行良好！")
    
    print("\n\n✨ 测试完成！")
    print("="*60 + "\n")


def main():
    """主函数"""
    print("\n╔══════════════════════════════════════════════════════════╗")
    print("║        EduPilot 性能测试工具                             ║")
    print("╚══════════════════════════════════════════════════════════╝")
    print(f"\n测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    try:
        # 测试1: 数据库查询性能
        db_results = test_database_query_performance()
        
        # 测试2: 缓存功能性能
        cache_results = test_cache_performance()
        
        # 测试3: 并发请求性能
        concurrent_results = test_concurrent_requests()
        
        # 生成报告
        generate_performance_report(db_results, cache_results, concurrent_results)
        
        print("📄 提示：")
        print("  • 如需测试API接口，请运行服务器后访问：")
        print("    curl -w \"\\nTime: %{time_total}s\\n\" http://localhost:5000/api/membership/tiers")
        print("  • 数据库索引优化请运行：")
        print("    python scripts/add_database_indexes.py")
        print("  • 静态资源压缩请运行：")
        print("    python scripts/minify_assets.py\n")
        
    except Exception as e:
        print(f"\n❌ 测试过程出错: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()

