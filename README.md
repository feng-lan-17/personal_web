> 大屏响应式布局的最新说明见 [WIDE-LAYOUT.md](WIDE-LAYOUT.md)，前后对比见 [对比图册](qa/wide-layout/前后对比.md)。

> 当前优化版说明见 [GALLERY-EDITION.md](GALLERY-EDITION.md)。下文包含早期版本记录；当前收藏已加入明确标注的演示条目，关于页已移除大型 Logo 占位。

# lmr · 个人数字展馆

无依赖 Node.js 项目。由于当前环境缺少 npm，采用原生 HTML / CSS / JavaScript、JSON 与 Markdown，未使用 Next.js。所有图片与字体回退均可离线使用。

## 启动

在本目录执行 `node server.mjs`，访问 http://127.0.0.1:4173 。构建执行 `node build.mjs`，输出在 `dist/`。安装 npm 的环境也可用 `npm run dev` 和 `npm run build`。

## 内容维护

- `content/site.json`：品牌简介、导航、兴趣、经历、文章索引、研究与收藏。
- 新增文章：在 `writing` 数组增加唯一英文 `slug`、`title`、`category`、`summary`、`tags`、`publishedAt`、`status`，再创建 `content/posts/同名slug.md`。发布真实文章时移除 `status: "demo"`。Markdown 支持标题、段落、引用、围栏代码与本地图片，暂不支持完整 CommonMark/MDX。
- 新增研究：向 `research` 添加 `slug`、`title`、`area`、`summary`、`status`，可选 `questions`、`process`、`outcome`。未完成内容不要填写虚构成果。
- 新增收藏：向 `collections.items` 添加 `title`、`category`、`reason`、可选 `url`；分类取自 `collections.categories`。
- 经历：`about.timeline` 中使用 `date`、`title`、`description`。没有提供的经历保持空数组。
- 修改后重新启动服务器（启动时自动构建），或执行构建刷新页面。

## 素材与部署

`design-assets` 为提供的原始设计包。`public/assets/landscape.svg` 是本项目原创抽象风景，其他 SVG 与主题变量来自提供的素材包。参考图不参与页面渲染。

静态部署上传 `dist`，配置未知页面回退到 `index.html`。这是本地可运行交付，未发布公网。客户端路由页面提供基本元信息，但未做服务端渲染或每篇文章独立社交分享图。

## 待补充

真实个人简介与时间轴、真实文章、研究过程与成果、收藏条目、经授权的个人图片与社交链接。当前两篇文章明确为排版示例。


## V3 视觉重构（2026-10-28）

- 访问地址保持 http://127.0.0.1:4173/ ，启动方式仍为 `node server.mjs` 或双击 `start-lmr.cmd`。
- `public/editorial.css` 集中定义 V3 色彩、字体、布局与响应式覆盖；`public/style.css` 保留基础组件样式。
- `public/assets/lmr/` 为 V3 本地 WebP / SVG。山景来自用户提供的 AI 生成素材，不是本人摄影；研究图是概念示意，非实验结果。书页 SVG 已修正未设置 fill 导致的黑色填充。
- `public/app.js` 保留路由及原有交互，新增全站搜索（Ctrl / Cmd + K、Esc）、研究图文模板和图像失败回退。
- `content/site.json` 新增 `siteMetadata`；文章可填 `cover`，研究可填 `cover`、`field`、`methods`、`sections: [{title,body}]`、`links: [{label,url}]`。sections 正文沿用现有 Markdown 子集，可放本地示意图与实验日志；未安装数学公式排版库。
- 收藏兼容 `image`、`creator`、`sourceUrl`、`note` 等字段；旧 `url`、`reason` 仍可使用。
- 旧版内容与页面备份在 `backups/v2/`。原始素材包保留在 `redesign-kit-v3/`，不参与发布。
- 浏览器测试为 `qa/verify.mjs`（本机 Edge / Playwright 路径需按环境调整），截图与测试结果存于 `qa/`。此目录没有 Git 仓库，无法提供 Git diff。

## 内容布局精修

参考浏览：Paco 的 https://github.com/pacocoursey/paco （旧版归档仓库）与当前 https://paco.me/，Anthony Fu 的 https://github.com/antfu/antfu.me 与 https://antfu.me/。仅借鉴内容层次、简洁导航和排版思路，没有复制其代码、文案或个人资料。

`public/refinement.css` 调整为更紧凑的内容版式：首页文章小图列表、无边框研究图文、紧凑收藏入口；内页最大宽度 1040px，中文正文使用系统无衬线，主标题保留宋体。V3 页面备份保存在 `backups/v3/`。内容编辑方式不变。



## 阅读清单与页面分享（最新）

文章详情可加入稍后阅读；文章列表“我的稍后阅读”可以导入、导出 JSON。导入会合并已有清单，仅接受当前站点存在的文章。数据保存在当前浏览器；导出文件由用户自行保管。

构建在同一目录创建临时输出，校验完成后切换到 dist；切换失败时尝试恢复旧输出。输出不再包含过期文件。文章与研究详情各有独立 HTML 标题、摘要和 Open Graph 信息。将 dist 部署到静态服务时，应优先提供目录下的 index.html，并对未知路由回退到根 index.html；本地 server.mjs 已处理此规则。更新服务端代码后需重新启动服务。

打包时排除了未被样式引用的两个字体文件，节省输出空间约 5.59 MiB；这些文件仍保留在 public，实际页面网络传输量并未因此改变。原始 FLAC 保持不变；当前环境未找到音频编码器，尚未添加压缩音频版本。
