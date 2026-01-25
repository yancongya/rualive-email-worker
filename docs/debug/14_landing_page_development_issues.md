# Landing Page 开发问题记录

## 日期
2026-01-25

## 问题列表

### 1. Vite 不处理 index.tsx 文件

**问题描述：**
修改 `index.tsx` 文件后，浏览器中看不到任何变化，构建输出显示只有 9 个模块被转换，而不是预期的 39 个模块。

**根本原因：**
`public/index.html` 中缺少 `<script type="module" src="index.tsx"></script>` 标签。Vite 需要在 HTML 中有对 TSX 文件的引用才能处理它。

**解决方案：**
在 `public/index.html` 的 `<body>` 标签内添加：
```html
<script type="module" src="./index.tsx"></script>
```

**验证方法：**
- 构建输出从 "✓ 9 modules transformed" 增加到 "✓ 39 modules transformed"
- 主 JS 文件大小从 36KB 增加到 614KB
- 邮箱地址 `2655283737@qq.com` 出现在构建后的文件中

---

### 2. 开发服务器与生产构建的混淆

**问题描述：**
使用 `wrangler dev`（端口 8787）时，浏览器报错：
```
Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "".
```

**根本原因：**
- `wrangler dev` 是 Cloudflare Workers 的静态文件服务器
- 它不会编译 TSX 文件，只是返回原始文本
- 浏览器尝试加载 `./index.tsx` 时收到的是原始文本，导致 MIME type 错误

**解决方案：**
使用 Vite 开发服务器而不是 Wrangler dev：
```bash
cd public
npx vite
```
Vite 开发服务器会自动编译 TSX 文件并注入正确的 script 标签。

**开发工作流：**
- **开发模式**：使用 `npx vite`（端口 3001），Vite 会自动处理 TSX 编译
- **生产构建**：使用 `npx vite build`，生成优化后的静态文件
- **部署**：使用 `npm run deploy`，部署到 Cloudflare Workers

---

### 3. SVG 动画配置错误

**问题描述：**
用户反馈 SVG 描边动画被错误修改：
- 背景从虚线（`strokeDasharray="16 16"`）变为实线
- Transform scale 值被错误地减小
- Showcase 部分的悬停效果被修改

**根本原因：**
在尝试添加裁切进场动画时，错误地修改了全局配置，而不是只针对特定页面。

**解决方案：**
1. 使用 `git reset --hard HEAD~1` 回滚到正确的提交
2. 保留 TSX 脚本引用的修复
3. 恢复正确的 SVG 配置：
   - 背景虚线：`strokeDasharray="16 16"` + `className="animate-marching-ants"`
   - Transform scale 值：`[1.1, 0.9, 1.6, 1.8, 0.9, 0.8, 2.5]`（Showcase 改为 0.8）

---

### 4. Showcase 页面背景 SVG 太大

**问题描述：**
用户反馈界面展示页面的背景 SVG 太大，看不清楚。

**解决方案：**
将 Showcase 页面的 transform scale 从 1.5 改为 0.8：
```typescript
{ x: '0vw', y: '0vh', scale: 0.8, rotate: 90, opacity: 0.55 },   // Showcase
```

---

### 5. Showcase 图片使用 SVG 而非 PNG

**问题描述：**
用户希望使用图片文件（PNG/JPG）而不是 SVG 来展示界面。

**解决方案：**
1. 安装 cairosvg 工具：
   ```bash
   pip install cairosvg
   ```

2. 将 SVG 文件转换为 PNG：
   ```python
   import cairosvg
   cairosvg.svg2png(url='01-panel.svg', write_to='01-panel.png', output_width=1200, output_height=800)
   ```

3. 更新代码中的图片路径：
   ```typescript
   // 从
   { title: "AE 插件面板", img: "/assets/showcase/01-panel.svg" }
   // 改为
   { title: "AE 插件面板", img: "/assets/showcase/01-panel.png" }
   ```

---

### 6. FAQ 页面问号太小

**问题描述：**
疑难杂症页面的背景问号 SVG 路径太小，不明显。

**解决方案：**
重新设计问号路径，将其放大约 1.5 倍：
```typescript
// 原路径
"M 350,300 C 350,200 450,200 450,300 C 450,400 400,400 400,500 C 400,600 400,650 400,700"

// 新路径（放大版）
"M 300,150 C 300,50 500,50 500,150 C 500,250 400,250 400,350 C 400,450 400,500 400,550 C 400,600 380,650 380,700 C 380,750 420,750 420,700"
```

---

### 7. Hero 页面点击直接进入登录页

**问题描述：**
点击首页任何地方都会直接进入登录页，而不是只有点击 CTA 按钮才进入。

**根本原因：**
Hero 容器有 `onClick={() => switchView('auth')}` 事件监听器。

**解决方案：**
移除 Hero 容器的 onClick 事件：
```typescript
// 从
<div className="container mx-auto text-center mt-12 sm:mt-0 cursor-pointer" onClick={() => switchView('auth')}>

// 改为
<div className="container mx-auto text-center mt-12 sm:mt-0">
```

---

### 8. Showcase 横向滚动范围过大

**问题描述：**
在界面展示页面，滚动任何地方都会触发横向滑动，导致无法正常纵向滚动到下一页。

**解决方案：**
修改 Observer 配置，只在鼠标悬停在图片组件上时才拦截滚动：
```typescript
const isShowcaseSection = currentSectionRef.current === 5;
const isOnSlide = (self.event.target as HTMLElement).closest('.showcase-slide');

if (isShowcaseSection && isOnSlide && !isHeader) {
  // 横向滑动
  moveSlideToIndex(currentSlideIndexRef.current + 1);
} else {
  // 纵向滚动
  goToSection(currentSectionRef.current + 1);
}
```

---

### 9. Footer GitHub 链接改为邮箱复制功能

**问题描述：**
用户希望将 footer 中的 GitHub 链接改为邮箱图标，点击后复制邮箱地址到剪切板。

**解决方案：**
1. 添加邮箱图标 SVG
2. 实现复制功能：
```typescript
const handleCopyEmail = () => {
  navigator.clipboard.writeText('2655283737@qq.com');
  alert('Email copied to clipboard');
};
```

3. 更新 footer JSX：
```typescript
<button onClick={handleCopyEmail} className="p-2 hover:bg-white/10 transition-colors">
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="3">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <path d="M22 6l-10 7L2 6"/>
  </svg>
</button>
```

---

## 技术要点总结

### Vite 开发服务器配置
- **入口点**：HTML 文件必须引用 TSX 文件
- **热重载**：Vite 自动处理文件变化
- **端口冲突**：如果 3000 端口被占用，Vite 会自动尝试下一个端口

### SVG 路径设计
- 使用贝塞尔曲线（C 命令）创建平滑路径
- ViewBox 设置为 0 0 800 800
- Transform 配置控制位置、缩放、旋转和透明度

### GSAP 动画
- 使用 `gsap.timeline()` 创建动画序列
- 使用 `elastic.out(1, 0.85)` 缓动函数创建弹性效果
- 使用 `power3.inOut` 创建平滑的过渡效果

### 图片处理
- 使用 cairosvg 将 SVG 转换为 PNG
- 保持宽高比（16:10 或 4:3）
- 输出分辨率建议 1200x800

## 开发建议

1. **使用 git 进行版本控制**：在做出重大修改前先提交，方便回滚
2. **分阶段测试**：每次修改后立即在浏览器中验证效果
3. **保持代码简洁**：避免在单个组件中添加过多逻辑
4. **使用 TypeScript**：类型检查可以避免很多运行时错误
5. **定期备份**：重要的配置文件和资源文件应该有备份

## 参考资料

- [Vite 官方文档](https://vitejs.dev/)
- [GSAP 官方文档](https://greensock.com/gsap/)
- [React 官方文档](https://react.dev/)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)