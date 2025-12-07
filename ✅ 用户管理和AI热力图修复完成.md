# ✅ 用户管理和AI热力图修复完成

## 修复时间
2025-10-14 19:53

## 问题1: 用户管理页面404错误

### 错误信息
```
[2025-10-14 19:53:23] WARNING in app: 404错误: http://localhost:5000/api/admin/admin/users
```

### 根本原因
API路径重复了 `admin` 前缀：
- **错误路径**: `/api/admin/admin/users` ❌
- **正确路径**: `/api/admin/users` ✅

### 原因分析
`admin-frontend/src/utils/request.ts` 中已设置 `baseURL = 'http://localhost:5000/api/admin'`，但 `users.ts` 中的API路径又加了 `/admin` 前缀，导致路径重复。

### 修复内容
**文件**: `admin-frontend/src/api/users.ts`

修改所有API路径，移除多余的 `/admin` 前缀：

| 修复前 | 修复后 |
|--------|--------|
| `/admin/users` | `/users` ✅ |
| `/admin/users/:id` | `/users/:id` ✅ |
| `/admin/users/:id/toggle` | `/users/:id/toggle` ✅ |
| `/admin/users/:id/reset-password` | `/users/:id/reset-password` ✅ |
| `/admin/users/:id/grant-membership` | `/users/:id/grant-membership` ✅ |
| `/admin/users/batch-toggle` | `/users/batch-toggle` ✅ |
| `/admin/users/batch-delete` | `/users/batch-delete` ✅ |
| `/admin/users/export` | `/users/export` ✅ |
| `/admin/users/create` | `/users/create` ✅ |

### 最终完整路径
因为 `baseURL` 已经包含 `/api/admin`，所以：
- 前端请求: `/users`
- 实际完整路径: `http://localhost:5000/api/admin/users` ✅
- 后端路由: `@app.route('/api/admin/users')` ✅

---

## 问题2: AI使用热力图500错误

### 错误信息
```
[2025-10-14 19:53:22] ERROR in app: 获取AI使用热力图数据失败: type object 'UsageLog' has no attribute 'feature_name'
AttributeError: type object 'UsageLog' has no attribute 'feature_name'
```

### 根本原因
数据库模型字段名不匹配：
- **数据库模型**: `UsageLog.feature_code` ✅
- **代码中使用**: `UsageLog.feature_name` ❌

### 修复内容
**文件**: `app.py` (第7629-7644行)

**修复前**:
```python
usage_data = db.session.query(
    func.date(UsageLog.created_at).label('date'),
    UsageLog.feature_name,  # ❌ 错误字段名
    func.count(UsageLog.id).label('count')
).filter(
    UsageLog.created_at >= start_date,
    UsageLog.created_at <= end_date,
    UsageLog.feature_name.in_(list(ai_features.keys()))  # ❌ 错误字段名
).group_by(
    func.date(UsageLog.created_at),
    UsageLog.feature_name  # ❌ 错误字段名
).all()

for record in usage_data:
    date_str = record.date.strftime('%Y-%m-%d')
    feature_label = ai_features.get(record.feature_name, record.feature_name)  # ❌ 错误字段名
    heatmap_data.append([date_str, feature_label, record.count])
```

**修复后**:
```python
usage_data = db.session.query(
    func.date(UsageLog.created_at).label('date'),
    UsageLog.feature_code,  # ✅ 正确字段名
    func.count(UsageLog.id).label('count')
).filter(
    UsageLog.created_at >= start_date,
    UsageLog.created_at <= end_date,
    UsageLog.feature_code.in_(list(ai_features.keys()))  # ✅ 正确字段名
).group_by(
    func.date(UsageLog.created_at),
    UsageLog.feature_code  # ✅ 正确字段名
).all()

for record in usage_data:
    date_str = record.date.strftime('%Y-%m-%d')
    feature_label = ai_features.get(record.feature_code, record.feature_code)  # ✅ 正确字段名
    heatmap_data.append([date_str, feature_label, record.count])
```

### 数据库模型确认
**文件**: `models_membership.py`
```python
class UsageLog(db.Model):
    """功能使用记录表"""
    __tablename__ = 'usage_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    # 功能类型
    feature_code = db.Column(db.String(50), nullable=False)  # ✅ 正确字段名
    
    # 使用详情
    action = db.Column(db.String(100))
    ...
```

---

## 修复总结

### ✅ 已修复的问题
1. **用户管理页面404错误** - API路径重复问题
2. **AI使用热力图500错误** - 数据库字段名不匹配问题

### 📁 修改的文件
1. `admin-frontend/src/api/users.ts` - 修正API路径
2. `app.py` - 修正数据库字段名（4处）

### 🎯 影响的功能
1. ✅ 用户管理列表查询
2. ✅ 用户CRUD操作
3. ✅ 用户批量操作
4. ✅ Dashboard AI使用热力图

### 🧪 测试建议
1. **用户管理页面**:
   ```
   访问: http://localhost:3000/admin/users
   预期: 正常显示用户列表，无404错误
   ```

2. **Dashboard页面**:
   ```
   访问: http://localhost:3000/admin/dashboard
   预期: AI使用热力图正常显示，无500错误
   ```

---

## 状态
🎉 **全部修复完成！**

请刷新浏览器页面，用户管理和Dashboard功能应该完全正常了！

