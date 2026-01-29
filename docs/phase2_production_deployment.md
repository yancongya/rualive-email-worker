# 第二阶段生产环境部署指南

## 概述

本文档说明如何将第二阶段的数据库迁移部署到生产环境。

**部署日期**: 2026-01-29
**版本**: migration_003_add_project_tables.sql
**风险等级**: 中等

## 前置条件

- ✅ Wrangler CLI 已安装
- ✅ 已登录 Cloudflare 账户
- ✅ 有生产环境访问权限
- ✅ 本地测试已完成并验证通过

## 部署步骤

### 步骤1：检查当前生产环境状态

```bash
cd rualive-email-worker

# 查看当前数据库中的表
npx wrangler d1 execute rualive --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"

# 预期结果应该包含：
# - users
# - sessions
# - invite_codes
# - user_configs
# - work_data
# - email_logs
# - api_keys
# - test_email_logs
# - work_logs
```

### 步骤2：备份数据库（推荐）

虽然 D1 数据库会自动备份，但建议手动记录当前状态：

```bash
# 查看当前数据量
npx wrangler d1 execute rualive --remote --command "SELECT COUNT(*) as count FROM work_logs"

# 查看最近的数据
npx wrangler d1 execute rualive --remote --command "SELECT work_date, project_count, work_hours FROM work_logs ORDER BY work_date DESC LIMIT 5"
```

### 步骤3：执行数据库迁移

```bash
# 在生产环境执行迁移
npx wrangler d1 execute rualive --remote --file migrations/migration_003_add_project_tables.sql
```

**预期输出**：
```
⛅️ wrangler 3.114.17
-----------------------------------------------
🌀 Executing on remote database rualive
🚣 9 commands executed successfully.
```

### 步骤4：验证表创建

```bash
# 验证新表是否创建
npx wrangler d1 execute rualive --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('projects', 'project_daily_stats')"
```

**预期结果**：
```
┌─────────────────────┐
│ name                │
├─────────────────────┤
│ projects            │
│ project_daily_stats │
└─────────────────────┘
```

### 步骤5：验证索引创建

```bash
# 验证索引是否创建
npx wrangler d1 execute rualive --remote --command "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name IN ('projects', 'project_daily_stats')"
```

**预期结果**：应该看到 9 个索引（包括自动索引）

### 步骤6：验证表结构

```bash
# 查看 projects 表结构
npx wrangler d1 execute rualive --remote --command "PRAGMA table_info(projects)"

# 查看 project_daily_stats 表结构
npx wrangler d1 execute rualive --remote --command "PRAGMA table_info(project_daily_stats)"
```

### 步骤7：测试数据插入（可选）

在生产环境插入测试数据验证功能：

```bash
# 插入测试项目
npx wrangler d1 execute rualive --remote --command "INSERT INTO projects (user_id, project_id, project_name, project_path, first_work_date, last_work_date) VALUES ('test_user_id', 'test_project_id', '测试部署.aep', '/test/test.aep', '2026-01-29', '2026-01-29')"

# 验证插入
npx wrangler d1 execute rualive --remote --command "SELECT * FROM projects WHERE project_id = 'test_project_id'"

# 删除测试数据
npx wrangler d1 execute rualive --remote --command "DELETE FROM projects WHERE project_id = 'test_project_id'"
```

### 步骤8：部署 Worker 代码

```bash
# 部署 Worker 到生产环境
cd rualive-email-worker
npx wrangler deploy
```

## 注意事项

### ⚠️ 重要提醒

1. **迁移是幂等的**
   - 使用 `CREATE TABLE IF NOT EXISTS` 和 `CREATE INDEX IF NOT EXISTS`
   - 可以安全地重复执行

2. **不影响现有数据**
   - 新表独立于现有表
   - 不会修改 work_logs 表结构
   - 不会删除任何现有数据

3. **外键约束**
   - projects.user_id 引用 users.id
   - project_daily_stats.project_id 引用 projects.id
   - 删除用户时会级联删除相关项目

4. **性能影响**
   - 索引会略微增加写入时间
   - 查询性能会显著提升
   - 建议在低峰期执行

## 回滚方案

如果需要回滚，执行以下步骤：

```bash
# 方案1：删除新表（如果不需要保留数据）
npx wrangler d1 execute rualive --remote --command "DROP TABLE IF EXISTS project_daily_stats"
npx wrangler d1 execute rualive --remote --command "DROP TABLE IF EXISTS projects"

# 方案2：停用新功能（如果表中有数据）
# 不删除表，但在代码中不使用新表
# 保持向后兼容
```

## 验证清单

部署后请验证以下项目：

- [ ] 表创建成功（projects, project_daily_stats）
- [ ] 索引创建成功（9个索引）
- [ ] 表结构正确（所有字段和约束）
- [ ] 外键约束生效
- [ ] UNIQUE 约束生效
- [ ] Worker 部署成功
- [ ] 现有功能不受影响
- [ ] 数据上传功能正常
- [ ] work_logs 数据正常

## 监控指标

部署后监控以下指标：

1. **Worker 日志**
   ```bash
   npm run tail
   ```

2. **错误率**
   - 观察 Worker 错误日志
   - 检查 API 错误响应

3. **响应时间**
   - 数据上传响应时间
   - API 查询响应时间

4. **数据库性能**
   - 查询执行时间
   - 数据库连接数

## 常见问题

### Q1: 迁移失败怎么办？

**A**: 检查以下内容：
1. 确认网络连接正常
2. 确认 Wrangler 已登录
3. 查看错误日志
4. 检查是否有权限问题

### Q2: 迁移会影响现有功能吗？

**A**: 不会。迁移只添加新表，不修改现有表。现有功能继续使用 work_logs 表。

### Q3: 重复执行迁移会怎样？

**A**: 使用 `IF NOT EXISTS`，重复执行是安全的，不会报错也不会重复创建。

### Q4: 如何确认迁移成功？

**A**: 执行验证步骤（步骤4-7），所有验证通过即表示迁移成功。

## 支持联系

如果遇到问题：
1. 查看日志文件
2. 检查 Cloudflare Dashboard
3. 联系技术支持

## 相关文档

- [本地测试报告](./phase2_test_report.md)
- [实施计划](./phase2_implementation_plan.md)
- [数据库迁移脚本](../migrations/migration_003_add_project_tables.sql)

---

**文档版本**: 1.0
**创建日期**: 2026-01-29
**维护者**: RuAlive@烟囱鸭 Team