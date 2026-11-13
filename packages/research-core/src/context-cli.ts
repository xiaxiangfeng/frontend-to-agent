import { parseArgs } from 'node:util'
import { assembleContext, buildContext } from './context-builder.ts'
import { contextItems, contextQuestions } from './context-fixture.ts'
import { reviewRequest } from './review-fixture.ts'

try {
  const { values } = parseArgs({
    options: { messages: { type: 'boolean' }, 'max-input-bytes': { type: 'string', default: '1300' } }
  })
  const maxInputBytes = Number(values['max-input-bytes'])
  const comparisons = contextQuestions.map(({ topic, question, requiredIds }) => {
    const input = {
      systemPrompt: '你是技术研究助手。根据提供的资料回答当前问题，标明出处。',
      goal: reviewRequest.goal,
      question
    }
    const all = assembleContext(input, contextItems)
    const selected = buildContext({ ...input, topic, items: contextItems, requiredIds, maxInputBytes })
    return {
      question,
      allInputBytes: all.inputBytes,
      selectedInputBytes: selected.inputBytes,
      decisions: selected.decisions,
      ...(values.messages ? { allMessages: all.messages, selectedMessages: selected.messages } : {})
    }
  })
  console.log(JSON.stringify({ mode: 'fixture', maxInputBytes, comparisons }, null, 2))
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
