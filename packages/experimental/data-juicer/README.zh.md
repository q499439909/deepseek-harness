---
description: "配置并排查实验性同机 Data-Juicer recipe-flow 连接、有界元数据发现工具和带认证的就绪状态 Remote。"
kind: "package-reference"
---

# @deepseek-ai/dsh-experimental-data-juicer

[English](README.md) | 中文

## 概述

本包把 DSH 连接到同机 Data-Juicer recipe-flow MCP 服务。模型可以检查有界的配置、加载策略和算子元数据，而不会启动数据处理。带认证的 Remote 报告连接就绪状态，并支持显式重连。仅在 Data-Juicer 集成的实验性发现阶段选择本包。

## 目录

- [使用此包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [进一步探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与后续工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用此包

在工具注册表与 Typert 可用的组合中挂载插件。端点必须使用 `127.0.0.1`、`::1` 或 `localhost` 上的纯 HTTP，并且不能包含凭据或 URL 片段。

```yaml
- id: data-juicer
  name: '@deepseek-ai/dsh-experimental-data-juicer'
  config:
    endpoint: http://127.0.0.1:8080/mcp
```

| 字段 | 默认值 | 含义 |
|---|---|---|
| `endpoint` | `http://127.0.0.1:8080/mcp` | 回环 Streamable HTTP MCP 端点 |
| `timeoutMs` | `60,000` | 每次连接、发现和元数据请求的期限 |
| `maxResultBytes` | `262,144` | 单次元数据操作返回的最大 UTF-8 字节数 |

生成的[配置目录](../../../docs/config-catalog.zh.md#deepseek-aidsh-experimental-data-juicer)是所有可接受字段的完整来源。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>维护者信息 — 点击展开</summary>

插件打开一个 Streamable HTTP MCP 客户端，并在报告就绪前验证必需的发现与处理工具名称。`data_juicer_discover` 把封闭操作集映射到上游配置、加载策略和算子搜索工具，仅接受文本块，拒绝 MCP 错误结果，并执行配置的字节限制。卸载会中止待处理请求、关闭客户端，并等待已跟踪操作结束。

就绪状态 Remote 返回分离的状态值。并发重连请求共享一次尝试；失败会记录不可用状态和诊断，同时不向模型暴露上游处理工具。

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

- [Data-Juicer 设计草稿](../../../docs/scratch/data-juicer/design.zh.md)——本发现包之外拟议的任务、确认、持久化和结果流程。
- [MCP 客户端包](../../mcp/mcp-client/README.zh.md)——通用外部 MCP 桥接与传输行为。
- [生成的工具目录](../../../docs/tool-catalog.zh.md)——从源码生成的模型可见 schema。

-----

<a id="model-experience"></a>
## 模型体验

### 元数据发现工具

#### 模型看到什么

插件挂载期间，模型会收到用于配置、加载策略或算子元数据的 `data_juicer_discover` 工具。结果包含有界的上游文本；连接和上游错误会让工具调用显式失败。

#### Token 影响

工具注册期间，每个请求都包含工具描述和输入 schema。成功调用会把参数和有界文本结果追加到对话历史。

#### KV 缓存影响

工具 schema 不变时，注册的工具定义保持前缀稳定。工具调用和结果追加在可复用前缀之后。

## 已知限制与后续工作

<a id="known-limitations-and-deferred-work"></a>

- **仅发现**——本包不提供 recipe 执行、数据集分析、上传、任务持久化、确认、预览、下载或结果保留。
- **仅同机 HTTP**——端点校验器拒绝 HTTPS、非回环主机、嵌入凭据和 URL 片段；远端部署需要不同的安全设计。
- **没有自动重连循环**——启动失败或连接关闭后，调用方必须请求重连。
- **仅文本元数据**——非文本 MCP 块和大于 `maxResultBytes` 的响应会失败，而不会投影或截断。

-----

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者信息 — 点击展开</summary>

更广泛的 Data-Juicer 任务与结果流程仍处于所链接设计草稿的提议阶段。本包当前只负责连接就绪状态和有界元数据发现。

</details>
