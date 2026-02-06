# 🎨 RuAlive 设计与开发规范文档

> **设计系统 (Design System) & 开发规范 (Development Spec)**

---

## 1. 核心设计理念 (Core Concept)

### 品牌格调
- **黑色幽默**：与动画师产生共鸣的幽默感
- **极简动感**：极简但富有动感的设计
- **工作搭子**：营造"工作搭子"的陪伴感

### 视觉特征
- **极深背景**：#050505 绝对深色背景
- **高对比度橙色**：#FF6B35 充满活力的橙色
- **玻璃拟态**：现代感的玻璃拟态设计
- **大尺度标题**：视觉冲击力强的大标题
- **流畅动效**：GSAP 驱动的流畅动画

### 文案调性
- **反讽**：适度反讽，缓解工作压力
- **鼓励**：积极正面的鼓励性文案
- **诙谐**：幽默诙谐的语言风格
- **中英双语**：全大写英文增强视觉张力

---

## 2. 视觉规范 (Visual Specs)

### 2.1 色彩系统 (Color Palette)

| 用途 | 颜色名称 | 颜色值 | 说明 |
| :--- | :--- | :--- | :--- |
| **背景主色** | `dark` | `#050505` | 绝对深色，用于页面底层 |
| **卡片/浮层** | `dark-surface` | `rgba(255,255,255,0.03)` | 配合 `backdrop-blur-md` 实现玻璃感 |
| **品牌主色** | `primary` | `#ff6b35` | 充满活力的橙色，用于 CTA 和重要强调 |
| **主色-亮** | `primary-light` | `#ff8c42` | 用于悬停（Hover）状态 |
| **辅助文字** | `text-dim` | `rgba(255,255,255,0.4)` | 用于副标题和说明文案 |
| **边框** | `border-dim` | `rgba(255,255,255,0.1)` | 极细边框，维持精致感 |

### 2.2 字体排版 (Typography)

#### 字体选择
- **英文字体**：`Plus Jakarta Sans` (优先使用 800/Black 字重，并开启 `italic`)
- **中文字体**：`Noto Sans SC` (900/Black 字重用于标题)

#### 标题规则
- 使用 `italic` (斜体)
- 使用 `uppercase` (全大写)
- 使用 `tracking-tighter` (紧凑字间距)

#### 字重层级
- **超大标题**：900 (Black)
- **大标题**：800 (Extra Bold)
- **正文**：400 (Regular)
- **辅助文字**：300 (Light)

---

## 3. 技术栈规范 (Tech Stack)

### 3.1 核心框架
- **框架**：React 19
- **构建工具**：Vite 5
- **语言**：TypeScript 5.3

### 3.2 样式系统
- **CSS框架**：Tailwind CSS
- **设计系统**：基于设计令牌的自定义配置

### 3.3 动画系统
- **动画核心**：GSAP (Tweening, Timeline, Observer, Draggable)
- **动画类型**：
  - 过渡动画
  - 滚动动画
  - 交互动画
  - 装饰性动画

### 3.4 图标系统
- **图标库**：Inline SVG
- **图标来源**：Lucide React 或自定义 SVG

---

## 4. 核心组件规范 (UI Components)

### 4.1 玻璃卡片 (Glassmorphism Card)

#### 样式规范
```css
bg-white/5
backdrop-blur-xl
border-white/10
rounded-[2rem]
```

#### 使用场景
- 内容卡片
- 浮动面板
- 模态窗
- 侧边栏

#### 示例代码
```jsx
<div className="bg-white/5 backdrop-blur-xl border-white/10 rounded-[2rem] p-6">
  {/* 卡片内容 */}
</div>
```

---

### 4.2 交互按钮 (The Pulse Button)

#### 主按钮样式
```css
bg-primary
text-white
font-black
italic
rounded-2xl
```

#### 交互效果
- **点击**：`active:scale-95`
- **悬停**：颜色变亮 `primary-light`
- **禁用**：`opacity-50 cursor-not-allowed`

#### 示例代码
```jsx
<button className="bg-primary text-white font-black italic rounded-2xl active:scale-95 transition-transform">
  CLICK ME
</button>
```

---

### 4.3 输入组件 (Input Fields)

#### 样式规范
```css
bg-white/5
border-white/10
focus:border-primary
rounded-xl
```

#### 交互效果
- **聚焦**：边框变为 `primary` 颜色
- **错误**：边框变为红色
- **禁用**：`opacity-50 cursor-not-allowed`

#### 示例代码
```jsx
<input 
  className="bg-white/5 border-white/10 focus:border-primary rounded-xl px-4 py-3"
  placeholder="输入内容..."
/>
```

---

## 5. 动画与交互规范 (Motion & UX)

### 5.1 页面切换 (The View-Switcher)

#### 转场效果
1. 淡出：`gsap.to(opacity: 0)`
2. 修改状态
3. 淡入：`gsap.to(opacity: 1)`

#### 重置逻辑
- 回到首页时重置 `currentSection` 为 0
- 复位 `wrapper` 的 `y` 位移

#### 示例代码
```jsx
const switchView = async (newView) => {
  await gsap.to(container, { opacity: 0, duration: 0.3 });
  setCurrentView(newView);
  await gsap.to(container, { opacity: 1, duration: 0.3 });
};
```

---

### 5.2 装饰动效 (Aesthetic Motion)

#### 心跳感
- 重要数字或 Logo 增加 `animate-pulse`
- 使用 GSAP 创建自定义心跳动画

#### 彩蛋
- 保留随机 Slogan 弹出
- 隐藏交互元素的趣味反馈

#### 示例代码
```jsx
// GSAP 心跳动画
useEffect(() => {
  gsap.to(logo, {
    scale: 1.1,
    duration: 0.5,
    repeat: -1,
    yoyo: true
  });
}, []);
```

---

### 5.3 滚动动画 (Scroll Animations)

#### 使用场景
- 元素进入视口时触发
- 滚动进度指示
- 视差滚动效果

#### 实现方式
```jsx
<ScrollTrigger>
  <motion.div>
    {/* 滚动触发的内容 */}
  </motion.div>
</ScrollTrigger>
```

---

## 6. 响应式设计 (Responsive Design)

### 断点系统

| 断点名称 | 屏幕宽度 | 设备类型 |
| :--- | :--- | :--- |
| `sm` | ≥ 640px | 小型手机 |
| `md` | ≥ 768px | 平板 |
| `lg` | ≥ 1024px | 笔记本 |
| `xl` | ≥ 1280px | 桌面显示器 |
| `2xl` | ≥ 1536px | 大型显示器 |

### 设计原则
- **移动优先**：优先设计移动端体验
- **渐进增强**：在大屏幕上添加更多功能
- **触摸友好**：按钮和交互区域足够大

---

## 7. 可访问性 (Accessibility)

### 7.1 键盘导航
- 所有交互元素支持键盘操作
- 焦点指示清晰可见
- Tab 键顺序合理

### 7.2 屏幕阅读器
- 语义化 HTML 标签
- ARIA 标签正确使用
- 图标有替代文本

### 7.3 色彩对比
- 文字与背景对比度 ≥ 4.5:1
- 重要信息不仅依赖颜色传达
- 支持高对比度模式

---

## 8. 性能优化 (Performance Optimization)

### 8.1 加载优化
- 代码分割 (Code Splitting)
- 懒加载 (Lazy Loading)
- 图片优化 (WebP 格式)

### 8.2 渲染优化
- 虚拟滚动 (Virtual Scrolling)
- 防抖/节流 (Debounce/Throttle)
- useMemo/useCallback 使用

### 8.3 动画优化
- 使用 CSS transform 和 opacity
- 避免布局抖动 (Layout Thrashing)
- 使用 will-change 提示浏览器

---

## 9. 国际化 (Internationalization)

### 9.1 支持语言
- 中文（简体）
- 英文

### 9.2 实现方式
- 使用 i18next 库
- 语言包结构化
- 日期/时间本地化

### 9.3 最佳实践
- 所有用户可见文本可翻译
- 数字和日期格式本地化
- 避免硬编码文本

---

## 10. 开发工作流 (Development Workflow)

### 10.1 代码规范
- 使用 ESLint + Prettier
- 遵循 Airbnb JavaScript 规范
- 组件使用函数式组件

### 10.2 Git 工作流
- 功能分支开发
- 提交信息规范
- 代码审查 (Code Review)

### 10.3 测试策略
- 单元测试 (Jest)
- 集成测试 (React Testing Library)
- E2E 测试 (Playwright)

---

## 11. 常见问题 (FAQ)

### Q: 为什么选择 #050505 作为背景色？
A: 绝对深色背景提供更好的沉浸感，减少眼睛疲劳，同时让橙色主题更加突出。

### Q: 为什么使用 GSAP 而不是 CSS 动画？
A: GSAP 提供更强大的动画控制能力，支持复杂的时间轴和交互效果。

### Q: 如何保证暗色主题的可读性？
A: 通过严格对比度测试（≥ 4.5:1）和用户测试确保所有文本可读。

---

**文档版本**: 1.0  
**最后更新**: 2026-01-30