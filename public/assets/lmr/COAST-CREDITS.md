# 冰岛风格首页背景与字体

本次使用内置 imagegen 生成独立无字图片；没有复制或嵌入摄影师作品。生成图用于意境设计，并非真实旅行记录。

最终背景：public/assets/lmr/hero-iceland-v2.webp
小屏资源：public/assets/lmr/hero-iceland-v2-1200.webp
排版样式：public/hero-coast.css
实际截图：qa/coast-hero-1440.png、qa/coast-hero-768.png、qa/coast-hero-390.png

参考网页：
- https://www.hansstrand.se/iceland-gallery
- https://www.hasselblad.com/inspiration/stories/iceland-in-mesmerising-100mp-detail-hans-strand/
- https://fstoppers.com/media/652188

构图提炼：缩小黑沙比例，银蓝色海面为主体，以浪线引导视线至右侧远山；轻薄层云，避免压迫的暴风雨云；极小人物仅提供尺度。

字体：Ma Shan Zheng（标题字子集）与 Allura（英文手写），来自 Google Fonts，SIL Open Font License 见 public/assets/lmr/fonts 下的 OFL 文件。本地加载，不依赖字体外链。原系统字体文件未随站点分发。

## 最终生成提示词

Use case photorealistic-natural. Generate a completely text-free 2:1 ultra-wide high-quality fine-art photographic Iceland coast landscape background. New composition, NOT a storm scene. Viewer stands a little above a curving shore, looking out to the enormous open silver-blue North Atlantic and distant sharp Vestrahorn-like volcanic headland on the far right. PROPORTIONS CRITICAL: black sand occupies only 12-18% of total frame as a slim graceful curved strip along bottom and far right; open ocean with luminous silver reflections and delicate receding white surf occupies 40-45%; pale blue-gray sky 35-40%; distant mountains under 15%. No huge dark foreground, no immense sand plain. Shoreline forms a gentle elegant S curve from bottom center to right third. Ocean and thin wash of reflected water dominate lower image, delicate long exposure water trails yet believable natural texture, no giant waves. Sky: smooth high luminous overcast with a few subtle horizontal wisps, soft open white-silver cloud deck, NO heavy rolling thunderclouds, NO black clouds, no dramatic storm, no fantasy cloud bank or thick fog wall. Light: tranquil cold dawn, luminous clean midtones, restrained cool steel-blue cyan gray and black volcanic stone, minimal and photographic, natural dynamic range, no aggressive HDR. Distant dark slate headland and a few delicate sharp rocky forms emerge from subtle sea haze to the right. Left 45% is uninterrupted calm sky and calm silver-blue ocean, low visual detail so elegant dark typography can be placed in HTML. One tiny barely noticeable human silhouette on the narrow far-right shoreline, less than 1% frame height; no visible face, no bright jacket. Mood: sublime solitude, the edge of the world, airy enormous distance, quiet photographic restraint, premium editorial travel photography with authentic textures. Avoid: sand taking more than 20%, large dark triangles, dramatic threatening storm clouds, sunset, orange warmth, overprocessed contrast, big human figures, UI, text, logo, watermarks. No lettering whatsoever.
