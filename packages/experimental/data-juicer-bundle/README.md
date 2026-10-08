---
description: "Enable the experimental Data-Juicer discovery connection and its Web readiness card."
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-data-juicer-bundle

English | [中文](README.zh.md)

## Summary

This optional bundle composes the experimental Data-Juicer discovery connection and its Web readiness card. Shipped profiles leave it disabled. Data-Juicer, Python, models, and the recipe-flow service remain deployment-owned prerequisites.

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

Install and start a compatible recipe-flow MCP service on the same machine as DSH. Enable Data-Juicer from Plugins, then open its details to inspect the configured endpoint and check the connection. Enabling the bundle does not install or launch the external service.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Maintainer details — click to expand</summary>

The static `cordis.patch.yml` inserts the Host discovery service and browser readiness contribution. The CLI package carries this bundle as an optional dependency so Plugin management can enable it without adding it to default profiles.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [Data-Juicer connection package](../data-juicer/README.md)
- [Data-Juicer browser contribution](../client-ui-data-juicer/README.md)

-----

<a id="model-experience"></a>
## Model Experience

### Metadata discovery tool

#### What the model sees

The Host package registers the bounded `data_juicer_discover` metadata tool described in its package reference. The bundle adds no other model input.

#### Token effect

The tool description and input schema enter each request while the bundle is enabled. Successful calls append their arguments and bounded text results to conversation history.

#### KV Cache effect

The discovery tool definition remains in the reusable request prefix while the bundle is enabled.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Discovery only** — the bundle does not enable recipe execution, dataset analysis, uploads, task persistence, previews, downloads, or retained results.
- **Same-host service** — the current connection accepts loopback HTTP endpoints only.

-----

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Maintainer details — click to expand</summary>

None.

</details>
