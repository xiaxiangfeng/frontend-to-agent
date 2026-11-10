import { randomUUID } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import { type ConversationMessage, type ConversationStore } from '@agent-book/research-core'

export const packageName = '@agent-book/persistence' as const

export function openConversationStore (filename: string): ConversationStore {
  const database = new DatabaseSync(filename, { enableForeignKeyConstraints: true })

  try {
    database.exec(`
      PRAGMA busy_timeout = 5000;
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        user_id TEXT NOT NULL
      ) STRICT;
      CREATE TABLE IF NOT EXISTS conversation_turns (
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        turn_index INTEGER NOT NULL CHECK (turn_index >= 0),
        user_message TEXT NOT NULL,
        assistant_message TEXT NOT NULL,
        PRIMARY KEY (conversation_id, turn_index)
      ) STRICT;
    `)

    const insertConversation = database.prepare(`
      INSERT INTO conversations (id, tenant_id, user_id) VALUES (?, ?, ?)
    `)
    const readConversation = database.prepare(`
      SELECT t.turn_index, t.user_message, t.assistant_message
      FROM conversations c
      LEFT JOIN conversation_turns t ON t.conversation_id = c.id
      WHERE c.id = ? AND c.tenant_id = ? AND c.user_id = ?
      ORDER BY t.turn_index
    `)
    const insertTurn = database.prepare(`
      INSERT INTO conversation_turns (conversation_id, turn_index, user_message, assistant_message)
      SELECT c.id, ?, ?, ?
      FROM conversations c
      WHERE c.id = ? AND c.tenant_id = ? AND c.user_id = ?
        AND ? = COALESCE((
          SELECT MAX(t.turn_index) + 1
          FROM conversation_turns t WHERE t.conversation_id = c.id
        ), 0)
      ON CONFLICT (conversation_id, turn_index) DO NOTHING
    `)

    return {
      create (owner) {
        const id = randomUUID()
        insertConversation.run(id, owner.tenantId, owner.userId)
        return id
      },
      read (id, owner) {
        const rows = readConversation.all(id, owner.tenantId, owner.userId)
        if (rows.length === 0) return null

        const messages: ConversationMessage[] = []
        for (const row of rows) {
          if (row.turn_index === null) continue
          // The STRICT table stores both messages as non-null text in each turn.
          messages.push(
            { role: 'user', content: row.user_message as string },
            { role: 'assistant', content: row.assistant_message as string }
          )
        }
        return { conversationId: id, version: messages.length / 2, messages }
      },
      appendTurn (id, owner, version, question, answer) {
        const result = insertTurn.run(version, question, answer, id, owner.tenantId, owner.userId, version)
        return result.changes === 1
      },
      close () {
        database.close()
      }
    }
  } catch (error) {
    database.close()
    throw error
  }
}
