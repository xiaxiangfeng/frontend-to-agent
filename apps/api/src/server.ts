import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { loadEnvFile } from 'node:process'
import { fileURLToPath } from 'node:url'
import { buildApp } from './app.js'
import { chatOptionsFromEnvironment } from './chat-config.js'

async function start () {
  const rootDirectory = fileURLToPath(new URL('../../../', import.meta.url))
  const envFile = join(rootDirectory, '.env')
  if (existsSync(envFile)) loadEnvFile(envFile)

  const chat = chatOptionsFromEnvironment(process.env, rootDirectory)
  const app = buildApp({ logger: true }, chat)
  const port = Number(process.env.PORT ?? 3000)
  const host = process.env.HOST ?? (chat ? '127.0.0.1' : '0.0.0.0')

  try {
    await app.listen({ host, port })
  } catch (error) {
    await app.close()
    throw error
  }

  const close = () => {
    app.close().catch(error => {
      app.log.error(error)
      process.exitCode = 1
    })
  }
  process.once('SIGINT', close)
  process.once('SIGTERM', close)
}

try {
  await start()
} catch (error) {
  console.error(error)
  process.exitCode = 1
}
