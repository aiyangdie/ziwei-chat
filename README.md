<p align="center"><img src="assets/covers/23-ziwei-chat.jpg" alt="紫微斗数 项目封面" width="100%"></p>

<h1 align="center">紫微斗数 · 开源排盘引擎</h1>

<p align="center">可独立运行的排盘引擎 + 古籍原文库 + 51.8 万命盘样本数据集</p>

## 简介

把紫微斗数从「玄学黑箱」拆成可验证的工程件：一张命盘由哪些星曜、宫位、四化按什么规则落位，都能在源码里逐条对。引擎与界面分离，界面只是 Demo，排盘结果供自己的产品直接调用。

## 功能

- **排盘引擎**：按传统规则生成十二宫盘，与常见排盘库的差异在 `lib/` 内逐项拆解
- **古籍原文库**：`lib/classics/` 收录典籍原文，可与星曜解释对照
- **知识图谱**：`lib/seo/` 生成结构化的概念关联，便于检索
- **样本数据集**：约 51.8 万命盘样本，用于回归测试与统计分析
- **可替换的界面**：Demo 只演示数据能不能被读懂，不是产品形态

## 数据

样本集发布在 [Releases](https://github.com/aiyangdie/ziwei-chat/releases) 的 `v3.0-samples` 标签下，macOS / Linux 与 Windows 都给出下载命令；数据许可是 CC BY 4.0，引用请注明来源。

## 快速开始

```bash
git clone https://github.com/aiyangdie/ziwei-chat.git
cd ziwei-chat
npm install
```

复制 `.env.local` 并填入自己的 AI API Key，然后：

```bash
npm run dev
```

## 项目结构

```
lib/            排盘引擎核心
lib/classics/   古籍原文
lib/seo/        知识图谱与结构化数据
app/            演示界面
```

## 开源边界

仓库只包含排盘引擎、古籍整理与演示界面，不含商业产品形态、运营文案与私有数据。维护节奏与贡献方式见仓库 Issues。

## 许可证

[MIT](LICENSE)
