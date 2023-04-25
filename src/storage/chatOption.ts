import LevelDB, { levelDBAllResult } from "./levelDB.js";

interface ChatOption {
  conversationId: string;
  parentMessageId: string;
}

interface ContactOption {
  chatOption: ChatOption;
  session: any;
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
  private cache: levelDBAllResult<ContactOption>

  constructor() {
    this.prefix = "ChatOptions"
    this.levelDB = new LevelDB()
    this.cache = {}
  }

  getAllCache(): levelDBAllResult<ContactOption> {
    return this.cache
  }

  getCache(contactId: string): ContactOption {
    return this.cache[contactId]
  }

  async store(contactId: string, conversationId: string, parentMessageId: string, session: any): Promise<void> {
    const option: ChatOption = {
      conversationId: conversationId,
      parentMessageId: parentMessageId,
    }

    const value: ContactOption = {
      chatOption: option,
      session: session
    }

    this.cache[contactId] = value

    await this.levelDB.add(this.prefix, contactId, value)
  }

  async load() {
    const allContactOptions: levelDBAllResult<ContactOption> = await this.levelDB.getAll(this.prefix)
    console.log("allContactOptions is: ", allContactOptions)

    this.cache = allContactOptions
  }

  async delete(contactId: string): Promise<void> {
    delete this.cache[contactId]
    await this.levelDB.delete(this.prefix, contactId)
  }


}
