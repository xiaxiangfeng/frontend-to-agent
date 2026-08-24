# Agent 工程术语表

## Agent

由模型在受约束循环中选择行动、观察结果并调整下一步的软件系统。聊天界面本身不等于 Agent。

## Workflow

开发者预先定义步骤与控制流的执行过程。固定 workflow 和动态 Agent 可以组合使用。

## Prompt

提交给模型的指令与输入。System Prompt 只是上下文的一部分，不是完整的安全边界。

## Context

一次模型调用实际可见的信息集合，包括指令、用户问题、状态、记忆、证据和工具结果。

## Structured Output

模型按照约定结构返回的数据。它必须经过运行时 Schema 校验后才能进入领域逻辑。

## Function Calling

模型生成工具名称与结构化参数，由应用验证并决定是否执行的协议模式。

## Tool

Agent 可请求调用的受控能力。工具运行时负责 Schema、权限、超时、幂等和审计。

## RAG

Retrieval-Augmented Generation，先检索相关资料，再把受控片段交给模型生成有依据的结果。

## Source

来源身份及原始位置，例如文档、网页或数据库记录。

## Evidence

从 Source 中提取、可支持某项结论的具体片段。报告只能引用已持久化 Evidence。

## Memory

跨调用保留并在需要时重新选择的信息。短期状态、长期记忆、RAG 与 checkpoint 承担不同职责。

## Checkpoint

可恢复执行所需的已持久化状态边界，用于在失败或人工暂停后继续任务。

## Human-in-the-loop

人在关键操作前审阅影响，并选择批准、修改、拒绝或取消。

## MCP

Model Context Protocol，用标准方式连接 Host、Client、Server 及其 Tools 和 Resources。

## Trace

按 research、run、step 和具体调用关联的结构化执行记录，用于排错、评测和成本分析。

## Evaluation

用固定任务、确定性规则和人工抽查衡量 Agent 行为，并防止模型或 Prompt 变更造成回归。
