---
description: "Working design for approved Data-Juicer processing tasks and persistent Web results in DSH."
status: draft
---

# Data-Juicer integration design

English | [中文](design.zh.md)

## Summary

This scratch document records the agreed product requirements and a proposed implementation. It is not a description of shipped functionality. Users describe a processing objective, review a recipe, approve that exact version, and inspect the retained results in DSH Web. [The glossary](glossary.md) defines the processing terms.

## Table of Contents

- [Existing components](#existing-components)
- [Dev Note](#dev-note)

<a id="existing-components"></a>
## Existing components

DSH has an [external MCP client](../../../packages/mcp/mcp-client/README.md), [domain storage](../../../packages/storage/storage-domain/README.md), a [SQLite backend](../../../packages/storage/storage-sqlite/README.md), [image and file attachments](../../../packages/attachment/attachment/README.md), and [Web document previews](../../../packages/client/ui-sidebar-documentpreview/README.md). [Path-based deliveries](../../../packages/deliverables/tool-present/README.md) do not preserve file contents. These components provide integration points; they do not implement the task workflow described below.

<a id="dev-note"></a>
## Dev Note

This section is a non-authoritative implementation proposal based on the accepted requirements. Concrete package names, record schemas, API routes, storage ordering, and UI layouts remain subject to implementation review.

### Scope and deployment

The integration is optional and documented for discovery. Users install Data-Juicer and start its official recipe-flow MCP service themselves. DSH connects through Streamable HTTP. The first deployment runs both services on the same machine, with Data-Juicer listening on loopback. It supports one operator, uploaded data, and any local input path accessible to that operator. It does not establish tenant isolation. Future tenant support requires authenticated ownership and authorization for inputs, execution, artifacts, and downloads; Workspace membership alone cannot supply this authorization.

### User workflow

One processing task represents one complete requested Data-Juicer operation and may span several conversation turns. A Session has at most one unresolved processing task, including a task with unknown execution status. A completed, cancelled, or failed task can be followed by another task. Multiple operator steps belong to one recipe and do not each create a new task.

The agent clarifies ambiguous requirements before composing the recipe. Before approval, it may inspect formats, fields, bounded samples, and operator parameters. Full processing, transformations, and model/API calls require approval. The plan card shows the input, ordered operators, important parameters, expected outputs, and expandable YAML, with Execute, Modify, and Cancel actions. A modification creates a new recipe version and invalidates previous approval.

The Execute action records approval for the exact version and invokes a program-enforced execution check. The model cannot approve its own recipe. Concurrent clicks must admit only one execution attempt. The execution request includes the validated input bindings, recipe, effective configuration, and assigned output locations; free-form overrides must not change these after approval. Raw MCP processing tools must not remain available to the agent as an alternative execution route. Operator discovery remains available through the integration.

### Task states and interruption

Proposed states are clarifying, planning, awaiting-approval, running, completed, failed, cancelled, and unknown. Edits return the task to planning; submitting a validated plan enters awaiting-approval. Execute admits an attempt only for the approved version. Cancellation before execution is supported. Reliable cancellation during execution is deferred because disconnecting a synchronous MCP call does not establish that the service stopped processing.

Execution completion requires both successful processing and durable publication of its output manifest. Processing failure records an error and any partial-output information. Publication failure must distinguish completed processing from unavailable results. After restart or transport loss, an in-flight attempt becomes unknown unless its outcome can be verified. Neither reconnect nor restart automatically resubmits it. An unresolved attempt continues to block the next task; retry requires an explicit user action after checking the prior execution and cannot knowingly overlap it.

### Durable records and files

Use a new domain through the existing storage facility, routed to SQLite for this deployment. Each task is one aggregate record containing its Session association, clarified requirements, source bindings, immutable recipe versions, approval, execution attempts, status, timestamps, errors, summary, and artifact manifest. Keeping the single-Session active-task constraint and atomic attempt admission in the owning service is required; exact record layout remains a design decision. Do not rely on independent KV writes as a multi-record transaction.

Uploaded inputs are copied into managed storage. Local inputs retain their original locations and are not automatically copied; changes between planning and execution must be detected where practical and reported for renewed confirmation. Each task and attempt receives separate managed output storage. Inputs and prior results are never overwritten by default. Artifacts preserve the bytes produced by that attempt, including referenced media required for preview or download. A manifest associates each artifact with its task, attempt, media type, size, display name, and internal storage reference. Dataset manifests that only point at mutable external media do not constitute retained image outputs.

Task state survives restart. Output files, images, and reports remain available until explicit deletion. Local source files are not deleted with a task. Shared attachment objects require reference-aware deletion. The UI must show unavailable artifacts accurately when storage is missing or retention cleanup fails.

The domain record owns operational state; Session events record model-visible requirements, recipe versions, approvals, status summaries, and artifact references. Browser pagination, downloads, and previewing images do not automatically enter model context. Only explicit user requests to analyze selected rows or images admit those samples. The implementation must define recovery for a durable task write followed by a failed Session append before promising consistent replay. Forked or imported Session history must not reuse approval to execute a copied task.

### Web results

Each task has its own card showing the plan or current state. A completed card shows elapsed time, input/output counts where available, stage statistics where supplied, warnings, and the complete artifact list. Missing statistics are displayed as unavailable, not guessed. The first view includes bounded image thumbnails. The existing right sidebar provides paginated image browsing, dataset row previews, report viewing, and complete artifact downloads. Large datasets stay outside model context.

Reuse existing tool-card, attachment, sidebar, and locale components. A UI-only plugin is insufficient: Host code must validate output references, preserve bytes, bind them to tasks and Sessions, and authorize preview/download requests. Existing durable MCP image handling is useful, but ordinary dataset downloads require a suitable file-serving API. Preview handlers must treat generated HTML and other active content as untrusted output.

### Repository responsibilities

DSH owns a complete data-processing capability with a Service Definition for tasks and execution, a Data-Juicer Service Provider, and model/UI Consumers. The provider privately uses the existing MCP transport rather than exposing unrestricted processing calls. DSH also owns input resolution, version-specific approval, durable state, managed outputs, Session projections, artifact access APIs, optional composition, and Web cards. Package splits follow independently evolving roles rather than one package per operation; the agent loop does not need a new processing branch.

Data-Juicer owns operator execution and recipe semantics. Verify the environment against its lockfile before integration testing. The current checkout's MCP helpers return textual paths and catch processing exceptions into ordinary strings; an upstream improvement should supply explicit errors and structured output metadata without copying DSH-specific approval or tenancy into Data-Juicer. Streamable HTTP is the required transport. Stdio repair is outside this design. Until structured outputs are available, a narrowly tested provider must handle the existing result format and reject reported processing errors.

### Verification and implementation order

First verify a real HTTP handshake and a small text recipe against a lock-compatible Data-Juicer environment. Then implement persistent tasks and version-specific approval, followed by managed artifact publication and the Web views. Acceptance requires actual uploaded/local text processing and image outputs, approval-bypass rejection, duplicate-execution rejection, recipe-edit invalidation, distinct retry outputs, restart recovery, unknown-status handling, and result persistence without dataset bytes entering model requests. Capability, lifecycle, API, and UI tests need focused coverage; model-visible behavior needs keyless recorded Session cases. GUI changes require a GIF recorded from the real server/model flow and product/design review under repository policy.

### Remaining engineering decisions

Record schemas, input identity checks, effective-config validation, output collection for media datasets, cross-store recovery, statistics collection, file-serving APIs, and provider error mapping require implementation investigation. Real multi-tenant authorization, remote data transfer, durable remote job reconciliation, and running-task cancellation are later product capabilities. A configurable upload/preview budget is required; values depend on measured processing and browser behavior.
