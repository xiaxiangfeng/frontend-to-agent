# Agent 工程术语表

## LLM

Large Language Model，根据输入上下文预测并生成 Token 的模型。它是 Agent 的推理组件，不负责应用权限、持久化或最终事实校验。

## Agent

由模型在受约束循环中选择行动、观察结果并调整下一步的软件系统。聊天界面本身不等于 Agent。

## Agent Loop

反复执行“构建上下文、提出行动、校验并执行、记录观察、判断是否停止”的受控循环。

## Workflow

开发者预先定义步骤与控制流的执行过程。固定 workflow 和动态 Agent 可以组合使用。


## Tenant

租户。系统中用于隔开组织、数据和资源权限的边界。一个租户里可以有多个用户，具体访问范围还需要结合用户身份和权限判断。

## Conversation

会话。由会话 ID 标识的一段多轮消息历史。应用先检查会话的访问权限，再读取历史，按本次任务需要组装模型上下文。

## Run

从接收一个目标到完成、失败、取消或暂停的一次完整执行实例。

## Step

Run 中可单独记录和重试的一个执行单元，例如一次模型调用、工具调用或人工决策。
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

## Guardrail

限制输入、输出或行动的确定性规则，例如 Schema 校验、权限检查、预算上限与人工审批。Guardrail 不能只依赖 Prompt。
