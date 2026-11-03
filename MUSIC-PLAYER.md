# 音乐悬浮播放

音频状态由 public/music.js 中唯一的 #site-audio 持有，停在 #audio-parking，独立于专辑弹窗和页面 main。关闭专辑后继续播放；跨页时由 app.js 的 renderPage 只替换 main，不销毁 audio。右下角迷你播放器支持暂停、继续、打开专辑与停止；停止会清空资源、进度和恢复收听记录。重开同一专辑保留当前进度，首次打开不自动播放。

刷新后若仍有未停止的进度，只显示「恢复收听」，等待点击；不会自动播放。浏览器支持时同步 Media Session。样式在 public/interaction.css。

路由与挂载：public/app.js 的 renderPage / unmountPage；页面特效与阅读工具需可重复 mount/unmount，不能依赖模块二次 import。
