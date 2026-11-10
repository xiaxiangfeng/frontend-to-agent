import { type ChatMessage, type ChatModel, type ModelReply } from '@agent-book/model-runtime'

export const packageName = '@agent-book/research-core' as const

export interface ConversationOwner {
  tenantId: string
  userId: string
}

export type ConversationMessage = ChatMessage & { role: 'user' | 'assistant' }

export interface Conversation {
  conversationId: string
  version: number
  messages: ConversationMessage[]
}

export interface ConversationStore {
  create (owner: ConversationOwner): string
  read (id: string, owner: ConversationOwner): Conversation | null
  appendTurn (id: string, owner: ConversationOwner, version: number, question: string, answer: string): boolean
  close (): void
}

interface SendMessage {
  conversationId: string
  owner: ConversationOwner
  content: string
}

type SendResult = { kind: 'replied', reply: ModelReply } | { kind: 'not-found' | 'model-failed' | 'conflict' }

export async function sendConversationMessage (
  dependencies: { store: ConversationStore, model: ChatModel },
  input: SendMessage
): Promise<SendResult> {
  const { store, model } = dependencies
  const { conversationId, owner, content } = input
  const conversation = store.read(conversationId, owner)
  if (!conversation) return { kind: 'not-found' }

  let reply: ModelReply
  try {
    reply = await model.complete([
      { role: 'system', content: '你是一位技术研究助手，请用简短中文回答。' },
      ...conversation.messages,
      { role: 'user', content }
    ])
  } catch {
    return { kind: 'model-failed' }
  }

  const saved = store.appendTurn(conversationId, owner, conversation.version, content, reply.text)
  return saved ? { kind: 'replied', reply } : { kind: 'conflict' }
}
