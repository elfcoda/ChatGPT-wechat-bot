import LevelDB, { levelDBAllResult } from "./levelDB.js";

interface ChatOption {
  conversationId: string;
  parentMessageId: string;
}

export default class ChatOptions {
  /*
  {
      [contactId]: {
        conversationId: string,
        parentMessageId: string
      }
  }
  */
  private prefix: string
  private levelDB: LevelDB
  private cache: levelDBAllResult<ChatOption>

  constructor() {
    this.prefix = "ChatOptions"
    this.levelDB = new LevelDB()
    this.cache = {}
  }

  getAllCache(): levelDBAllResult<ChatOption> {
    return this.cache
  }

  getCache(contactId: string): ChatOption {
    return this.cache[contactId]
  }

  async store(contactId: string, conversationId: string, parentMessageId: string): Promise<void> {
    const value: ChatOption = {
      conversationId: conversationId,
      parentMessageId: parentMessageId,
    }

    this.cache[contactId] = value

    await this.levelDB.add(this.prefix, contactId, value)
  }

  async load(): Promise<levelDBAllResult<ChatOption>> {
    const allChatOptions: levelDBAllResult<ChatOption> = await this.levelDB.getAll(this.prefix)
    console.log("allChatOptions is: ", allChatOptions)

    this.cache = allChatOptions

    return allChatOptions
  }

  async delete(contactId: string): Promise<void> {
    delete this.cache[contactId]
    await this.levelDB.delete(this.prefix, contactId)
  }


}
