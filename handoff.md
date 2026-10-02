# 光的小探险 · 交接

## ⏯️ 目前做到哪
v1.0 已上线（2026-10-02）：https://tahun1-am-cahaya.vercel.app ；GitHub：https://github.com/kongsi-idea/tahun1-am-cahaya ；Vercel team `kongsi-idea`。Hub 已登记（新增科目 `am`＝Alam dan Manusia）。**等老师在学校电脑／投影／触屏实测，回填反馈。**
规划与已定决定：`../_planning/tahun1-am-cahaya.md`。

## 🚦 目前状态
- 对应：KP2027《Alam dan Manusia》一年级 5.1.1–5.1.4（抄录本第 62–63 页；本机 `~/Documents/资料库/_待核实/DSKP资料/`）。课本 2027 才出，例子只依 DSKP Nota。
- 老师已定：华文界面；画风＝现代排屋停电夜＋娃娃屋剖面镜头；只做第一、二幕（第三幕手工艺另做一个工具，外国例子倾向土耳其马赛克灯／泰国水灯）；第二幕放月亮。
- 第一幕：停电 → 手电筒做三件事（收玩具走到门口／照着楼梯往上走／看书上的图）→ 来电再做 → 比较时间 → 「光让我们看得见」→ 眼睛休息 10 秒（5.1.4）。
- 第二幕：找 9 样亮东西（进房间才找得到）→ 一次一样猜「会不会自己发光」→ 全黑测验 → 结果 → 月亮的秘密（5 段解说动画＋挡住太阳）→ 天亮（太阳）→ 光源总结。
- 技术：Three.js 0.170（jsdelivr importmap）、纯静态无 build；音效 WebAudio 合成；物件小图由同一批 3D 模型即时渲染（`js/thumbs.js`）；只有真光源超过 bloom 门槛（HDR 颜色）。
- 已验证：Playwright（swiftshader）1440×900 与 390×844 全流程跑通、无 console 报错；截图在 `.playwright-output/`。

## ⚠️ 已知限制／待老师判断
- 未在学校 Windows 电脑、课室投影、真实触屏上测效能与手感（有自动降画质：前 4 秒 <24fps 换省电）。
- 无语音朗读；一年级不靠老师读字能否完成第一幕，要实测。
- 第一幕「比时间」：自动测试里暗／亮时间差不大（机器点得一样快）；真学生在暗中会慢很多，但要实测确认，必要时改成比「点空次数」。
- Tema 5 Standard Prestasi 抄录缺页，评估设计待补。

## ➡️ 下一步
1. 老师在学校 Windows 电脑／课室投影／真实触屏实测，回填反馈（效能、一年级不靠读字能否完成第一幕、「比时间」是否要改成比点空次数）。
2. 按反馈修改 → 部署（`vercel deploy --prod --yes --scope kongsi-idea`）→ Hub 同步升版。
3. 马来文官方用词核对后，再把 5.1.1–5.1.4 加进 Hub `data/dskp-index.js`。
本机测试：`python3 -m http.server 8791 --bind 127.0.0.1`（8765 被 Hub 占用），网址加 `?debug`。

## 🕐 最后更新
2026-10-02
