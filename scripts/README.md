# 部署流程说明

## 问题背景

之前的部署流程存在以下问题：
- 每次部署需要手动执行多个步骤
- 翻译文件（locals文件夹）容易遗漏
- 文件复制到错误的目录
- 缺少验证机制

## 新的部署流程

### 1. 验证构建结果
```bash
npm run verify:build
```
检查dist目录中是否包含所有必要的文件：
- HTML文件
- JavaScript文件
- 翻译文件（zh.json, en.json）

### 2. 完整部署流程（推荐）
```bash
npm run deploy:full
```
自动执行以下步骤：
1. 验证构建结果
2. 清理旧的部署文件
3. 复制构建文件到部署目录
4. 执行Cloudflare部署

### 3. 仅构建前端
```bash
npm run build:frontend
```

## 工作流程

### 修改翻译文件后
```bash
npm run build:frontend   # 重新构建
npm run deploy:full      # 完整部署
```

### 修改前端代码后
```bash
npm run deploy:full      # 直接完整部署
```

## 验证文件清单

以下文件必须存在于dist目录中：
- public/user-v6.html
- public/admin.html
- public/auth.html
- public/index.html
- public/locals/user/zh.json
- public/locals/user/en.json
- assets/user-v6-*.js
- assets/admin-*.js
- assets/auth-*.js
- assets/client-*.js

## 常见问题

### Q: 验证失败怎么办？
A: 重新运行 `npm run build:frontend`

### Q: 翻译文件没有生效？
A: 确保修改了 public/locals/user/*.json 文件，然后重新构建和部署

### Q: 部署后404错误？
A: 运行 `npm run verify:build` 检查文件是否完整

## 注意事项

1. **不要手动复制文件**：使用 `npm run deploy:full` 自动完成
2. **不要直接修改dist目录**：所有修改都应该在源文件中进行
3. **翻译文件位置**：翻译文件位于 `public/locals/user/` 目录
4. **构建前先验证**：可以使用 `npm run verify:build` 检查构建结果