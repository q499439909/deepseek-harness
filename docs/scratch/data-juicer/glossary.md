# Data-Juicer processing language

English | [中文](glossary.zh.md)

These definitions describe the proposed data-processing domain. They do not change the meaning of Session, Turn, Workspace, or background job in DSH.

## Language

**Processing task**: One complete user-requested data-processing objective, from clarification through review, execution, and inspection of results. It may span several conversation turns.

_Avoid_: Turn, operator call, background job

**Recipe version**: An immutable processing plan specifying the input bindings, ordered operators, parameters, effective processing configuration, and intended outputs.

_Avoid_: Mutable approved plan

**Approval**: A user's authorization to execute one specific recipe version.

_Avoid_: Agent consent, generic permission to process anything

**Execution attempt**: One submission of an approved recipe version to the processing service; a retry is a distinct attempt of the same task.

_Avoid_: New task for every retry

**Data source**: Uploaded data or a local dataset selected as input to a processing task.

_Avoid_: Workspace, tenant

**Artifact**: A retained data file, image, or report produced by an execution attempt.

_Avoid_: Path string, entire model response

**Result summary**: The processing outcome and available aggregate statistics, separate from the complete output dataset.

_Avoid_: Complete dataset
