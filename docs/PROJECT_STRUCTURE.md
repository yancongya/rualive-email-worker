# RuAlive Email Worker 项目结构

## 目录结构

```
rualive-email-worker/
├── .wrangler/                   # Wrangler 配置和状态文件
│   ├── state/                   # 状态文件
│   └── tmp/                     # 临时文件
│
├── docs/                        # 项目文档
│   ├── README.md                # 文档导航
│   ├── PROJECT_STRUCTURE.md     # 项目结构说明（本文件）
│   ├── data-flow-explanation.html  # 数据流程说明
│   ├── data-flow.drawio         # 数据流程图
│   ├── detail-data-viewing-fix.md  # 详细数据查看功能修复说明
│   └── debug/                   # 调试文档
│       ├── 01_connection_issues.md
│       ├── 02_json_parsing_error.md
│       ├── 03_jsx_syntax_error.md
│       ├── 04_function_not_defined.md
│       ├── 05_effect_scanning_failure.md
│       ├── 06_best_practices.md
│       ├── 07_debug_tools_guide.md
│       ├── 08_email_worker_issues.md
│       ├── 08_file_creation_issues.md
│       ├── 09_panel_simplification_issues.md
│       ├── 10_project_change_detection.md
│       ├── 11_email_button_not_working.md
│       └── 12_detail_data_issues.md
│
├── migrations/                  # 数据库迁移和 SQL 脚本
│   ├── schema.sql               # 主数据库 schema
│   ├── schema-auth.sql          # 认证表 schema
│   ├── schema-ae-status.sql     # AE 状态表 schema
│   ├── schema-test-email.sql    # 测试邮箱表 schema
│   ├── migrate.sql              # 主迁移脚本
│   ├── migrate_work_logs.sql    # 工作日志迁移
│   ├── migrate-add-detail-data.sql  # 添加详细数据字段
│   ├── migrate-add-notification-times.sql  # 添加通知时间字段
│   ├── migrate-add-emergency-notification-settings.sql  # 添加紧急联系人设置
│   ├── migrate-add-project-lists.sql  # 添加项目列表字段
│   ├── temp-update-effects.sql  # 临时效果更新脚本
│   ├── update-details.sql       # 更新详情数据
│   ├── update-test-data.sql     # 更新测试数据
│   ├── update-test-data-v2.sql  # 更新测试数据 v2
│   └── update-test-data-v3.sql  # 更新测试数据 v3
│
├── scripts/                     # 构建和部署脚本
│   ├── build-dashboard.js       # 构建用户仪表板
│   ├── deploy-worker.bat        # 部署 Worker
│   └── upload-kv.bat            # 上传到 KV
│
├── src/                         # 源代码
│   ├── index.js                 # 主入口文件
│   ├── auth.js                  # 认证模块
│   ├── components/              # 前端组件
│   │   ├── logs-table.js        # 工作日志表格组件
│   │   ├── stats-grid.js        # 统计网格组件
│   │   ├── chart-view.js        # 图表视图组件
│   │   ├── time-selector.js     # 时间选择器组件
│   │   └── tab-manager.js       # 标签页管理组件
│   ├── user-dashboard/          # 用户仪表板
│   │   ├── index.html           # 仪表板 HTML
│   │   ├── index-inline.html    # 内联 HTML（构建后）
│   │   ├── app.js               # 仪表板主逻辑
│   │   └── style.css            # 仪表板样式
│   └── utils/                   # 工具函数
│       ├── api.js               # API 请求工具
│       └── date-utils.js        # 日期处理工具
│
├── tests/                       # 测试脚本
│   ├── test-401-debug.ps1       # 401 错误调试
│   ├── test-admin-apikey.ps1    # 管理员 API Key 测试
│   ├── test-admin-debug.ps1     # 管理员调试
│   ├── test-admin-final.ps1     # 管理员最终测试
│   ├── test-admin-fixed.ps1     # 管理员修复测试
│   ├── test-admin-login-simple.ps1  # 管理员简单登录测试
│   ├── test-admin-login.ps1     # 管理员登录测试
│   ├── test-admin-routes.ps1    # 管理员路由测试
│   ├── test-admin-slash.ps1     # 管理员斜杠测试
│   ├── test-admin-with-token.ps1  # 管理员 Token 测试
│   ├── test-api-key-email.ps1   # API Key 邮箱测试
│   ├── test-apikey-kv.ps1       # API Key KV 测试
│   ├── test-apikey-test.ps1     # API Key 测试
│   ├── test-apikey.ps1          # API Key 基本测试
│   ├── test-config-get.ps1      # 配置获取测试
│   └── test-config-load.ps1     # 配置加载测试
│
├── tools/                       # 工具脚本
│   ├── manual_update.py         # 手动更新脚本
│   └── update_details.py        # 更新详情脚本
│
├── temp/                        # 临时文件（不提交到版本控制）
│
├── admin-dashboard.html         # 管理员仪表板（旧版）
├── landing.html                 # 登录页面
├── build.bat                    # 构建脚本
├── debug-env.bat                # 调试环境脚本
├── deploy.bat                   # 部署脚本
├── package.json                 # Node.js 依赖配置
├── package-lock.json            # Node.js 依赖锁定文件
├── wrangler.toml                # Cloudflare Workers 配置
├── QUICK_START.md               # 快速开始指南
└── README.md                    # 项目说明文档
```

## 核心文件说明

### 配置文件
- **wrangler.toml** - Cloudflare Workers 配置，包含 D1 数据库、KV 存储绑定和 Cron 触发器
- **package.json** - Node.js 项目依赖和脚本配置

### 主入口
- **src/index.js** - Worker 主入口文件，处理所有 HTTP 请求和 Cron 触发

### 数据库
- **migrations/** - 所有数据库 schema 和迁移脚本
  - schema 文件定义表结构
  - migrate 文件执行数据库迁移
  - update 文件更新测试数据

### 前端
- **src/user-dashboard/** - 用户仪表板前端代码
- **src/components/** - 可复用的前端组件
- **src/utils/** - 前端工具函数

### 脚本
- **scripts/** - 构建和部署脚本
- **tests/** - 测试脚本（PowerShell）
- **tools/** - 辅助工具脚本（Python）

### 文档
- **docs/** - 项目文档
  - README.md - 文档导航
  - debug/ - 调试文档
  - 其他功能文档

## 数据流

1. **AE 扩展** → 扫描项目 → 生成 JSON 文件
2. **AE 扩展** → 上传数据 → Cloudflare Worker API
3. **Worker** → 处理数据 → 保存到 D1 数据库
4. **前端** → 请求 API → 获取数据 → 显示在用户面板

详细数据流程请参考：[data-flow-explanation.html](data-flow-explanation.html)

## 开发工作流

### 开发
1. 修改代码（src/ 目录）
2. 本地测试
3. 构建前端：`node scripts/build-dashboard.js`
4. 上传到 KV：`npx wrangler kv:key put ...`
5. 部署 Worker：`npx wrangler deploy`

### 数据库迁移
1. 创建迁移文件（migrations/ 目录）
2. 执行迁移：`npx wrangler d1 execute rualive --remote --file=migrations/new-migration.sql`

### 测试
1. 运行测试脚本（tests/ 目录）
2. 检查输出和错误
3. 修复问题并重新测试

## 部署

### 自动部署
```bash
# 构建并部署
npm run deploy
```

### 手动部署
```bash
# 1. 构建前端
node scripts/build-dashboard.js

# 2. 上传到 KV
npx wrangler kv:key put --binding=KV "user-dashboard-inline" --path=./src/user-dashboard/index-inline.html

# 3. 部署 Worker
npx wrangler deploy
```

## 环境变量

通过 `wrangler secret put` 设置：
- `RESEND_API_KEY` - Resend 邮件服务 API 密钥

## 数据库绑定

- **D1 数据库**：`rualive` (ID: 59a95578-9781-4592-a711-d961765766c5)
- **KV 存储**：`KV` (ID: 2ab9c0f8a4be4e56a30097fcd349befb)

## Cron 触发器

- **调度**：`0 * * * *` (每小时触发一次)
- **功能**：检查用户通知时间并发送邮件

## 依赖管理

### 安装依赖
```bash
npm install
```

### 更新依赖
```bash
npm update
```

## 注意事项

1. **temp/** 目录不应提交到版本控制
2. **node_modules/** 由 npm 管理，不应提交
3. **.wrangler/** 包含 Wrangler 状态文件，不应提交
4. 修改数据库 schema 后必须创建迁移文件
5. 部署前必须构建前端代码

## 相关文档

- [快速开始](QUICK_START.md)
- [文档导航](docs/README.md)
- [调试指南](docs/debug/07_debug_tools_guide.md)
- [最佳实践](docs/debug/06_best_practices.md)