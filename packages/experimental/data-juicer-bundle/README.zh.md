---
description: "启用实验性 Data-Juicer 发现连接及其 Web 就绪状态卡片。"
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-data-juicer-bundle

[English](README.md) | 中文

## 概述

这个可选 bundle 组合实验性 Data-Juicer 发现连接及其 Web 就绪状态卡片。随附 profile 默认不启用它。Data-Juicer、Python、模型和 recipe-flow 服务仍由部署方预先提供。

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

在运行 DSH 的同一台机器上安装并启动兼容的 recipe-flow MCP 服务。从插件页面启用 Data-Juicer，然后打开详情查看配置的服务地址并检查连接。启用 bundle 不会安装或启动外部服务。

-----

<a id="understand-the-implementation"></a>
## 了解实现

<details>
<summary>维护者详情——点击展开</summary>

静态 `cordis.patch.yml` 插入 Host 发现服务和浏览器就绪状态贡献。CLI 包将这个 bundle 作为可选依赖携带，使插件管理功能可以启用它，但不会把它加入默认 profile。

</details>

-----

<a id="further-exploration"></a>
## 延伸阅读

- [Data-Juicer 连接包](../data-juicer/README.zh.md)
- [Data-Juicer 浏览器贡献](../client-ui-data-juicer/README.zh.md)

-----

<a id="model-experience"></a>
## 模型体验

### 元数据发现工具

#### 模型看到的内容

Host 包注册了其包参考中说明的、有大小限制的 `data_juicer_discover` 元数据工具。bundle 不增加其他模型输入。

#### Token 影响

启用 bundle 时，每次请求都会包含工具说明和输入 schema。成功调用会把参数和有大小限制的文本结果追加到对话历史。

#### KV Cache 影响

启用 bundle 时，发现工具定义会保留在可复用的请求前缀中。

## 已知限制与延后工作

<a id="known-limitations-and-deferred-work"></a>

- **仅发现**——bundle 不启用 recipe 执行、数据集分析、上传、任务持久化、预览、下载或结果保留。
- **同机服务**——当前连接只接受 loopback HTTP 服务地址。

-----

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者详情——点击展开</summary>

无。

</details>
