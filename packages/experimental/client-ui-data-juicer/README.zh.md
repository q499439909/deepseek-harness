---
description: "在 Web 插件详情中显示 Data-Juicer 连接就绪状态和重试控件。"
kind: "package-reference"
---

# @deepseek-ai/dsh-experimental-client-ui-data-juicer

[English](README.md) | 中文

## 概述

这个可选浏览器插件在现有插件详情中显示 Data-Juicer 连接就绪状态。它观察已认证的 `dataJuicer` Remote，显示配置的服务地址和诊断信息，并提供显式连接检查。它不会安装 Data-Juicer，也不会启动数据处理。

## 目录

- [使用此包](#use-this-package)
- [了解实现](#understand-the-implementation)
- [延伸阅读](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与延后工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用此包

从插件页面启用 [Data-Juicer bundle](../data-juicer-bundle/README.zh.md)。在运行 DSH 的同一台机器上启动兼容的 recipe-flow MCP 服务，然后打开 bundle 详情查看就绪状态。**检查连接**会重试配置的服务地址。此卡片只提供信息，不会运行 recipe 或分析数据集。

-----

<a id="understand-the-implementation"></a>
## 了解实现

<details>
<summary>维护者详情——点击展开</summary>

Client 导出挂载生成的 Remote 贡献、注册本地化字典，并添加一个以 Data-Juicer bundle 为键的 `plugins.bundle.config` slot。一个可重连的流更新可观察就绪状态。销毁时会关闭流、等待观察结束、撤销 slot 并卸载 Remote。

</details>

-----

<a id="further-exploration"></a>
## 延伸阅读

- [Data-Juicer 连接包](../data-juicer/README.zh.md)——服务地址校验、就绪状态和元数据发现。
- [Data-Juicer 设计草案](../../../docs/scratch/data-juicer/design.zh.md)——超出发现阶段的处理工作流提案。

-----

<a id="model-experience"></a>
## 模型体验

### 连接就绪状态卡片

#### 模型看到的内容

无。此卡片在模型请求之外观察 `dataJuicer` Remote 并调用重连。

#### Token 影响

零 token。

#### KV Cache 影响

无直接影响。

## 已知限制与延后工作

<a id="known-limitations-and-deferred-work"></a>

- **仅就绪状态**——不提供上传、recipe、任务、预览、报告或结果控件。
- **使用现有详情界面**——只有启用可选 bundle 且插件详情可用时才显示此卡片。

-----

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者详情——点击展开</summary>

无。

</details>
