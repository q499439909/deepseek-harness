---
description: "Display Data-Juicer connection readiness and retry controls in the Web Plugins details view."
kind: "package-reference"
---

# @deepseek-ai/dsh-experimental-client-ui-data-juicer

English | [中文](README.zh.md)

## Summary

This optional browser plugin shows Data-Juicer connection readiness in the existing Plugins details view. It observes the authenticated `dataJuicer` Remote, displays the configured endpoint and diagnostics, and provides an explicit connection check. It does not install Data-Juicer or start processing.

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

Enable the [Data-Juicer bundle](../data-juicer-bundle/README.md) from Plugins. Start a compatible recipe-flow MCP service on the same machine as DSH, then open the bundle details to inspect readiness. **Check connection** retries the configured endpoint. The card remains informational and does not run a recipe or analyze a dataset.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Maintainer details — click to expand</summary>

The Client export mounts the generated Remote contribution, registers locale dictionaries, and adds one `plugins.bundle.config` slot keyed to the Data-Juicer bundle. One reconnect-safe stream updates an observable readiness store. Disposal closes the stream, waits for observation to finish, withdraws the slot, and unmounts the Remote.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [Data-Juicer connection package](../data-juicer/README.md) — endpoint validation, readiness, and metadata discovery.
- [Data-Juicer design scratch](../../../docs/scratch/data-juicer/design.md) — proposed processing workflow beyond discovery.

-----

<a id="model-experience"></a>
## Model Experience

### Connection readiness card

#### What the model sees

Nothing. The card observes the `dataJuicer` Remote and invokes reconnect outside model requests.

#### Token effect

Zero tokens.

#### KV Cache effect

No direct effect.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Readiness only** — no upload, recipe, task, preview, report, or result controls are present.
- **Existing details surface** — the card appears only while the optional bundle is enabled and its Plugins details view is available.

-----

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Maintainer details — click to expand</summary>

None.

</details>
