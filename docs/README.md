# RuAlive Email Worker 文档导航

## 快速开始

- [快速开始指南](../QUICK_START.md) - 5分钟快速部署 Worker
- [部署指南](../README.md) - 完整的部署步骤和配置说明

## 项目文档

### 架构与结构
- [项目结构说明](PROJECT_STRUCTURE.md) - 目录结构和文件说明
- [数据流程说明](data-flow-explanation.html) - 数据流转的可视化说明
- [数据流程图](data-flow.drawio) - 数据流程的 Drawio 源文件

### 功能文档
- [详细数据查看功能修复](detail-data-viewing-fix.md) - 修复详细数据显示问题
- [效果数据优化方案](effect-data-optimization.md) - 优化效果数据统计逻辑

### 调试文档
详见 [debug/](debug/) 目录：
- [详细数据查看问题排查](debug/12-detail-data-issues.md)

## API 文档

### 端点列表
- `GET /health` - 健康检查
- `GET /api/config` - 获取用户配置
- `POST /api/config` - 更新用户配置
- `POST /api/work-data` - 上传工作数据
- `POST /api/send-now` - 立即发送邮件
- `GET /api/logs` - 获取发送日志
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/user` - 获取当前用户
- `GET /api/admin/dashboard` - 管理员仪表板
- `POST /api/admin/test-email` - 发送测试邮件

### 数据结构

#### 上传数据格式
```json
{
  "work_hours": 2.5,
  "keyframe_count": 100,
  "json_size": 1024,
  "composition_count": 5,
  "layer_count": 20,
  "effect_count": 15,
  "projects": [
    {
      "name": "项目名称",
      "path": "项目路径",
      "statistics": {
        "compositions": 5,
        "layers": 20,
        "keyframes": 100,
        "effects": 15
      },
      "details": {
        "compositions": ["合成1", "合成2"],
        "layers": ["图层1", "图层2"],
        "keyframes": {"图层1": 50, "图层2": 50},
        "effects": ["效果1", "效果2"]
      },
      "accumulatedRuntime": 9000
    }
  ]
}
```

#### 数据库 Schema
详见 `../migrations/schema.sql`

## 开发指南

### 本地开发
```bash
# 安装依赖
npm install

# 开发服务器
npm run dev

# 查看日志
npm run tail
```

### 数据库操作
```bash
# 创建数据库
npm run db:create

# 运行迁移
npm run db:migrate

# 执行 SQL 命令
npx wrangler d1 execute rualive --remote --command="SELECT * FROM work_logs"
```

### KV 操作
```bash
# 创建 KV 命名空间
npm run kv:create

# 上传 KV 数据
npm run kv:upload
```

### 部署
```bash
# 部署到生产环境
npm run deploy

# 部署到预览环境
npm run deploy:preview
```

## 常见问题

### 部署相关
- **Q: 如何设置环境变量？**
  A: 使用 `wrangler secret put` 命令，例如：`wrangler secret put RESEND_API_KEY`

- **Q: 如何查看 Worker 日志？**
  A: 使用 `npm run tail` 命令查看实时日志

### 数据相关
- **Q: 数据上传失败怎么办？**
  A: 检查 [详细数据查看问题排查](debug/12-detail-data-issues.md) 文档

- **Q: 如何查看数据库中的数据？**
  A: 使用 `npx wrangler d1 execute rualive --remote --command="SELECT * FROM work_logs"`

### 邮件相关
- **Q: 邮件发送失败怎么办？**
  A: 检查 RESEND_API_KEY 是否正确设置，查看 Worker 日志

- **Q: 如何修改邮件发送时间？**
  A: 在用户面板中修改通知时间设置

## 技术栈

- **运行时**: Cloudflare Workers
- **数据库**: Cloudflare D1 (SQLite)
- **KV 存储**: Cloudflare KV
- **邮件服务**: Resend
- **前端**: 原生 JavaScript + CSS
- **部署**: Wrangler CLI

## 相关链接

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Cloudflare KV 文档](https://developers.cloudflare.com/kv/)
- [Resend 文档](https://resend.com/docs)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)

## 更新日志

### 2026-01-23
- 修复数据结构不匹配问题
- 优化数据转换逻辑
- 添加上传数据 Toast 提示

### 2026-01-20
- 添加详细数据查看功能
- 优化效果数据统计
- 添加缓存机制

## 联系支持

如有问题，请查看 [调试文档](debug/) 或提交 Issue。