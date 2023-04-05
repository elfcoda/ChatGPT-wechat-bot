import ChatGPT from "./chatgpt.js"
import ReplyService from "./replyService.js"
import ServiceConfig from "./serviceConfig.js"

export default class Personal {
  private GuidMyself: string
  private GuidFileHelper: string
  private GuidMyselfSet: Set<string>
  private GuidFileHelperSet: Set<string>
  private replyService: ReplyService

  constructor() {
    this.GuidMyself = this.generateGUID()
    this.GuidFileHelper = this.generateGUID()
    this.GuidMyselfSet = new Set<string>()
    this.GuidFileHelperSet = new Set<string>()
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
    // available in low qps
    // cannot send msg to myself so far, so this feature is unavailable now.
    if (this.toMyself(contact, receiver)) {
      console.log("to myself: ", content);
      // respond to myself
      if (!this.GuidMyselfSet.has(this.GuidMyself)) {
        console.log("start to send");
        this.GuidMyselfSet.add(this.GuidMyself);
        await this.replyService.replyPrivate(alias, content, chatGPTClient, contact);
      } else {
        this.GuidMyselfSet.delete(this.GuidMyself);
      }

      return true
    } else {
      return false
    }
  }

  async sendToFileHelper(receiver, content, alias, chatGPTClient: ChatGPT): Promise<boolean> {
    // available in low qps
    if (this.toFileHelper(receiver)) {
      console.log("to file helper: ", content);
      // respond to file helper
      if (!this.GuidFileHelperSet.has(this.GuidFileHelper)) {
        console.log("start to send");
        this.GuidFileHelperSet.add(this.GuidFileHelper);
        await this.replyService.replyPrivate(alias, content, chatGPTClient, receiver);
      } else {
        this.GuidFileHelperSet.delete(this.GuidFileHelper);
      }

      return true
    } else {
      return false
    }
  }
}
