# 任务管理：本地 Markdown

[English](issue-tracker.md) | 中文

规格保存在 `.scratch/<feature>/spec.md`。

任务单保存在 `.scratch/<feature>/issues/<NN>-<slug>.md`，每个任务单独一个文件。

发布是指写入本地文件，不创建 GitHub Issues。

按引用的文件路径读取任务单。

在文件顶部附近记录[分流状态](triage-labels.zh.md)，在 `Blocked by` 下记录依赖。

在 `## Comments` 下追加讨论。

Data-Juicer 使用 `.scratch/data-juicer/`，保留现有十个任务单。
