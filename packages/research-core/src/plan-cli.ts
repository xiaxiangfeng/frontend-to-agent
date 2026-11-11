import { existsSync } from 'node:fs'
import { loadEnvFile } from 'node:process'
import { parseArgs } from 'node:util'
import { createQwenModel, qwenOptionsFromEnvironment, type ChatModel } from '@agent-book/model-runtime'
import { createResearchPlan } from './research-plan.ts'
import { reviewPlan, reviewRequest } from './review-fixture.ts'

const fixtureModel: ChatModel = {
  async complete () {
    return { text: JSON.stringify(reviewPlan), elapsedMs: 0, usage: null, finishReason: 'stop' }
  }
}

function createLiveModel (): ChatModel {
  if (existsSync('.env')) loadEnvFile()
  return createQwenModel(qwenOptionsFromEnvironment(process.env))
}

try {
  const { values } = parseArgs({ options: { live: { type: 'boolean' } } })
  const model = values.live ? createLiveModel() : fixtureModel
  const result = await createResearchPlan(model, reviewRequest)
  console.log(JSON.stringify({ mode: values.live ? 'qwen' : 'fixture', ...result }, null, 2))
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
