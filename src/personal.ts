import ChatGPT from "./chatgpt.js"
import ReplyService from "./replyService.js"
import ServiceConfig from "./serviceConfig.js"

export default class Personal {
  private replyService: ReplyService

  constructor() {
    this.replyService = new ReplyService()
  }

  generateGUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  toMyself(from, to): boolean
  {
    try {
      return from.id === to.id;
    } catch (error) {
      return false;
    }
  }

  toFileHelper(to): boolean
  {
    try {
      return to.id === "filehelper"
    } catch (error) {
      return false;
    }
  }

  async sendToMyself(contact, receiver, content, alias, chatGPTClient: ChatGPT): Promise<boolean> {
    // cannot send msg to myself so far, so this feature is unavailable now.
    if (this.toMyself(contact, receiver)) {
      console.log("to myself: ", content);
      await this.replyService.replyPrivate(alias, content, chatGPTClient, contact, false);
      return true
    } else {
      return false
    }
  }

  async sendToFileHelper(receiver, content, alias, chatGPTClient: ChatGPT): Promise<boolean> {
    if (this.toFileHelper(receiver)) {
      console.log("to file helper: ", content);
      await this.replyService.replyPrivate(alias, content, chatGPTClient, receiver, false);
      return true
    } else {
      return false
    }
  }
}
