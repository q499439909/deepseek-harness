# 01: 连接服务并查询算子

**What to build:** 用户可选启用 Data-Juicer 集成，通过 Web 看到官方 recipe-flow Streamable HTTP 服务的连接状态，并让 agent 查询可用算子和参数。首版为单用户同机回环部署，用户自行安装并启动 Data-Juicer。

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] 默认不启用集成、不安装 Data-Juicer、不向模型添加其工具；启用说明解释手动部署和服务地址配置。
- [ ] 连接状态在 Web 可见，服务不可用、协议失败或依赖不兼容时给出可操作反馈，不能误报已连接。
- [ ] 在与官方锁文件兼容的环境完成真实 HTTP 握手，并查询官方 recipe-flow 的配置、数据加载策略和算子信息。
- [ ] 复用现有 MCP、工具和 UI 扩展方式，形成一个数据处理能力入口；不修改 agent loop，也不按每个算子创建能力入口。
- [ ] 原始处理和分析执行工具不作为模型可调用工具暴露；模型不能通过该集成绕过后续用户确认。
- [ ] 地址、超时等部署可调项有可校验配置；关闭集成正确释放连接并移除相应模型能力。
- [ ] 用真实 HTTP 发现测试、不可用服务测试和 keyless 模型输出场景验证行为；Web copy 使用 locale，GUI 改动附真实服务/模型流程 GIF 并遵循产品/设计审查要求。
