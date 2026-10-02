# 紫微斗数 AI 聊天（本地版）

基于 [ziwei-doushu](https://github.com/Renhuai123/ziwei-doushu) 开源排盘引擎 + [Agnes AI](https://www.agnes-ai.com/zh-Hans/docs/quickstart) 对话解读。

## 怎么用

需要同时开两个终端：

```powershell
cd ziwei-chat

# 终端 1：Python 桥（本机 Node 直连 Agnes 会被劫持）
npm run bridge

# 终端 2：网页
npm run dev
```

浏览器打开：

- 排盘 + AI 聊天：http://localhost:3000/chart
- 首页：http://localhost:3000

流程：填写出生信息 → 起盘 → 右侧「AI 命盘解读」提问。

## 配置

`.env.local`（已忽略 Git）：

- `AGNES_API_KEY` — Agnes Key
- `AGNES_BASE_URL=http://127.0.0.1:18787/v1` — 走本机桥
- `AGNES_MODEL=agnes-2.5-flash`

## 说明

- 排盘由本地引擎计算（确定性）
- 解读由 Agnes 根据命盘摘要生成（流式）
- 开源仓库不含商业断语库；解读质量依赖 Prompt + 模型
- **请勿把 API Key 发到公开聊天**；泄露后请到 Agnes 控制台轮换
