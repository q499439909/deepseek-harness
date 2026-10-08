---
description: "Configure and debug the experimental same-host Data-Juicer recipe-flow connection, bounded metadata discovery tool, and authenticated readiness Remote."
kind: "package-reference"
---

# @deepseek-ai/dsh-experimental-data-juicer

English | [中文](README.zh.md)

## Summary

This package connects DSH to a Data-Juicer recipe-flow MCP service on the same host. The model can inspect bounded configuration, loading-strategy, and operator metadata without starting data processing. The authenticated Remote reports connection readiness and supports an explicit reconnect. Choose this package only for the experimental discovery phase of a Data-Juicer integration.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Mount the plugin with the tool registry and Typert available. Its endpoint must use plain HTTP on `127.0.0.1`, `::1`, or `localhost` and must not contain credentials or a URL fragment.

```yaml
- id: data-juicer
  name: '@deepseek-ai/dsh-experimental-data-juicer'
  config:
    endpoint: http://127.0.0.1:8080/mcp
```

| Field | Default | Meaning |
|---|---|---|
| `endpoint` | `http://127.0.0.1:8080/mcp` | Loopback Streamable HTTP MCP endpoint |
| `timeoutMs` | `60,000` | Deadline for each connection, discovery, and metadata request |
| `maxResultBytes` | `262,144` | Maximum UTF-8 bytes returned by one metadata operation |

The generated [configuration catalog](../../../docs/config-catalog.md#deepseek-aidsh-experimental-data-juicer) is the exhaustive source for accepted fields.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Maintainer details — click to expand</summary>

The plugin opens one Streamable HTTP MCP client and verifies the required discovery and processing tool names before it reports readiness. `data_juicer_discover` maps a closed operation set to the upstream configuration, loading-strategy, and operator-search tools, accepts text blocks only, rejects MCP error results, and enforces the configured byte limit. Disposal aborts pending requests, closes the client, and waits for tracked operations.

The readiness Remote returns detached status values. Concurrent reconnect requests share one attempt; a failed attempt records an unavailable status and diagnostic without exposing the upstream processing tools to the model.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [Data-Juicer design scratch](../../../docs/scratch/data-juicer/design.md) — proposed task, confirmation, persistence, and result flow beyond this discovery package.
- [MCP client package](../../mcp/mcp-client/README.md) — the general external MCP bridge and transport behavior.
- [Generated tool catalog](../../../docs/tool-catalog.md) — the model-facing schema generated from source.

-----

<a id="model-experience"></a>
## Model Experience

### Metadata discovery tool

#### What the model sees

While the plugin is mounted, the model receives the `data_juicer_discover` tool for configuration, loading-strategy, or operator metadata. Results contain bounded upstream text; connection and upstream errors fail the tool call visibly.

#### Token effect

The tool description and input schema enter each request while registered. A successful call appends its arguments and bounded text result to conversation history.

#### KV Cache effect

The registered tool definition stays prefix-stable while its schema is unchanged. Tool calls and results append after the reusable prefix.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Discovery only** — the package does not expose recipe execution, dataset analysis, uploads, task persistence, confirmation, previews, downloads, or result retention.
- **Same-host HTTP only** — the endpoint validator rejects HTTPS, non-loopback hosts, embedded credentials, and URL fragments; remote deployments require a different security design.
- **No automatic reconnect loop** — callers must request reconnect after startup failure or a closed connection.
- **Text metadata only** — non-text MCP blocks and responses larger than `maxResultBytes` fail instead of being projected or truncated.

-----

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Maintainer details — click to expand</summary>

The broader Data-Juicer task and result workflow remains proposed in the linked design scratch. This package currently owns only connection readiness and bounded metadata discovery.

</details>
