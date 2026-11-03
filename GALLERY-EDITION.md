# lmr 当前优化版 · 维护说明

本次基于 `lmr-handoff-2026-10-28.zip` 对应工作区继续修改。原交接包保持不变；修改前源码备份位于 `backups/pre-gallery-polish/`。

## 当前页面变化

- 首页：保留居中海报、手写签名、红屋与雪山主题；缩短底部过渡，使用图片透明度淡出替代整层白雾；英文手写体降低视觉权重。栏目入口恢复编号与细分隔线；文章区区分主文和次文；研究保留一大两小；收藏加入三项演示预览。
- 关于：移除重复的大型签名占位，改为介绍、关注领域、当前探索链接、经历时间线与风景札记。风景素材明确注明 AI 来源，没有冒充个人实拍。
- 文章：列表主次、封面与搜索筛选统一；详情拆出独立阅读模板，改善标题、阅读行宽、图注、引用、代码、目录和前后篇导航。阅读进度以实际正文位置计算。
- 研究：保留三个 SVG，重排领域、状态、问题和方法标签。扩展章节与基础内容一起生成目录，避免锚点重复。
- 收藏：七个类别各提供一项明确标注的演示陈列，支持分类、键盘打开详情、Esc 关闭、焦点恢复、全站搜索与详情链接。所有内容都是原创概念条目，不是真实偏好、书籍或专辑推荐。

## 文件入口

| 文件 | 当前职责 |
| --- | --- |
| `public/app.js` | 数据加载、路由组合、搜索、主题、筛选、收藏弹窗与阅读反馈 |
| `public/content-views.js` | 文章、研究、关于、收藏组件；共享阅读模板与 Markdown 子集 |
| `public/gallery.css` | 本次统一视觉与响应式规则，最后加载 |
| `public/hero-coast.css` | 保留的海报基础结构与书法字体；本次精修由 gallery.css 覆盖 |
| `public/editorial.css` | 色彩、字体等基础变量与 V3 组件样式 |
| `public/refinement.css` | 既有布局与签名字标规则 |
| `content/site.json` | 数据索引、关于段落、研究问题、演示收藏 |
| `public/assets/lmr/collection/` | 本次原创 SVG 陈列图，不是第三方作品封面 |
| `qa/gallery-validation.mjs` | 本机 Edge 全站与新增功能验证脚本 |
| `qa/gallery-edition/` | 实际截图与验证报告 |

原有一次性改造脚本（包括本次生成的 `gallery-upgrade.mjs` 等）不需要重新运行。正式日常维护直接修改 public 和 content。

## 运行与更新

```powershell
cd D:\personal_web
node server.mjs
```

访问 `http://127.0.0.1:4173/`。已有服务运行时，修改后执行 `node build.mjs`，浏览器 Ctrl + F5 刷新。不需要安装前端依赖。当前版本仍是原生 JS / CSS 项目，没有迁移框架或增加后台。

## 内容维护

- 文章仍使用 `content/site.json` 的 `writing` 索引及 `content/posts/[slug].md`。`status: "demo"` 表示演示内容，真实文章移除该标记。`tags` 用于展示与检索。
- Markdown 子集支持段落、标题、引用、简单列表、行内代码、粗体、围栏代码与本地图片。图片格式可写 `![替代文字](/assets/lmr/image.webp "图注")`。没有完整 CommonMark / MDX、数学公式或脚注系统。
- `about.paragraphs` 是关于页段落；`about.interests` 是领域标签；`about.timeline` 是真实经历，使用 `date/title/description`。当前时间线为空。
- 研究使用 `questions/process/outcome/sections/links` 等字段；`shortTitle` 用于关于页紧凑入口。未提供实际实验时不要填写虚构结果。`sections: [{title,body}]` 的标题现在会进入目录。
- 收藏条目必须有唯一 `id`、`title`、`category`；可填 `image`、`note`、`creator`、`date`、`tags`、`sourceUrl`。`display` 控制概念展示比例，可取 `book-object/photo-object/record-object/film-object/tool-object/web-object/quote-object-wrap`。
- 摘录可用 `quote` 字段，换行使用 `\n`。演示条目保留 `status: "demo"`；正式收藏应提供真实内容与来源后再移除该标记。
- 收藏详情深链接为 `/collection?item=条目id`，当前分类按 category 过滤，搜索弹窗可检索收藏标题和备注。

## 真实资料与限制

待补充：本人确认的个人介绍、经历时间线、真实文章、研究过程与成果、真实收藏、照片与社交信息。现在的新增陈列全部为演示，未虚构真实经历或成果。

既有背景来源未改变，依然是根据用户参考生成的 AI 风景；本次只调整网页内裁切、色彩与底部过渡，没有引入新的生成风景。

现有 CSS 为逐版继承的样式链，后续可逐步合并，但应以当前截图作回归基准。仍没有 CMS、登录、数据库、公网发布或服务端 SEO；前端 404 视图的 HTTP 状态仍由原服务逻辑决定。收藏的完整界面已经实现，正式私人内容仍需本人补充。

## 验证范围

最终结果见 `qa/gallery-edition/results.md`。脚本检查桌面 1440、平板 768、手机 390，以及桌面 / 手机深色模式；逐页检查标题、字体与图片加载、资源错误和横向溢出；验证新增收藏的类别、详情、关闭、焦点、深链接与搜索，以及关于入口、目录、复制链接、阅读进度和移动导航。

这是本机 Edge 的模拟视口验证，不等同于真实 Safari 或多款手机设备测试。

> 后续的大屏容器与网格已集中到 public/layout.css；当前以 WIDE-LAYOUT.md 及 qa/wide-layout 的对比与测试结果为准。
