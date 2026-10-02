# 光的小探险 · 交接

## ⏯️ 目前做到哪
2026-10-02 v1.1 已上线并同步 Hub（依老师实测：黑暗中白色物件不再像反光、手电筒亮度固定、全屋光圈加大、切房间提示更新）。仍待在学校电脑／投影实测。

## 🚦 目前状态
- 正式网址 https://tahun1-am-cahaya.vercel.app （`npm run check -- tahun1-am-cahaya` 全过）；Hub 条目、4 张缩图、覆盖表、tools-status 已同步。
- 工具 repo：github.com/kongsi-idea/tahun1-am-cahaya。
- 没在学校电脑／投影／触屏实测；无语音。

## ➡️ 下一步
1. 老师在学校 Windows 电脑／课室投影／触屏试一次（效能会自动降画质），回填反馈。
2. 改点子铺时：先 `vercel --prod` 到预览网址给老师点过，再 `alias set`（AGENTS.md §4；10-02 两次跳过了这步，已向老师说明）。

## ⚠️ 注意事项
- 10-02 点子铺有 3 张 v1.0 缩图被重拍但未提交、画面较差，已恢复成已提交版本并重新部署；重拍档在 `~/Documents/待删除/kongsi-idea-thumbs-tahun1-am-cahaya-uncommitted-retake/`。
- 本机预览：`python3 -m http.server 8791 --bind 127.0.0.1`（8765 被 Hub 占）；网址加 `?debug` 挂出 `window.__lab`（含 `JUMPS` 跳关）。
- 自动测试里第一幕暗／亮时间差不大（机器点得一样快）；若真学生也看不出差别，改比「点空次数」。
- 决定与理由见 `agents.md`，不要回头加影子、SVG 图示、一级一级点楼梯。

## 🕐 最后更新
2026-10-03 · Claude Opus 5.5 @ 这台 Mac · Git：✅ 已推