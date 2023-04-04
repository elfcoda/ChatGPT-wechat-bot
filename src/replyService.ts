import ServiceConfig from "./serviceConfig.js";
import { ReplyType } from "./gptreplytype.js";
import ChatGPT from "./chatgpt.js";

export default class ReplyService {
  private serviceConfig: ServiceConfig
  private privateKey: string
  private groupKey: string

  constructor () {
    this.serviceConfig = new ServiceConfig()
    this.privateKey = this.serviceConfig.getPrivateKey()
    this.groupKey = this.serviceConfig.getGroupKey()
  }

  async replyGroup(room, contact, receiver, content, msg, chatGPTClient, replyType): Promise<void> {
    const topic = await room.topic();
    if (!this.serviceConfig.isEnabledForGroup(topic)) {
      console.log("group disabled: ", topic)
      return
    } else {
      console.log("group enabled: ", topic)
    }

    console.log(`Group name: ${topic} talker: ${await contact.name()} content: ${content}`);

    const pattern = RegExp(`@${receiver.name()}\\s+${this.groupKey}[\\s]*`);
    if (await msg.mentionSelf()) {
      // ReplyType to be Timer/Immediately
      if (replyType !== ReplyType.Timer && replyType !== ReplyType.Immediately) {
        console.log("replyType error: ", replyType)
        return
      }

      if (pattern.test(content)) {
        const groupContent = content.replace(pattern, "");
        await chatGPTClient.replyMessage(room, groupContent);
        return;
      } else {
        console.log("Content is not within the scope of the customizition format");
      }
    } else {
      // should ends/starts with double space "  "
      // ReplyType to be Immediately
      if (replyType !== ReplyType.Immediately) {
        console.log("replyType error: ", replyType)
        return
      }

      console.log("should reply immediately with non-@ msg")
      await chatGPTClient.replyMessage(room, content);
      return;
    }
  }

  async replyMyMsgGroup(room, content, chatGPTClient: ChatGPT): Promise<void> {
    const topic = await room.topic();
    console.log(`Group name: ${topic} talker: me content: ${content}`);

    if (!this.serviceConfig.isEnabledForGroup(topic)) {
      console.log("group disabled: ", topic)
    } else {
      console.log("group enabled: ", topic)
    }

    const pattern = RegExp(`[\\s]*${this.groupKey}[\\s]*`);
    if (pattern.test(content)) {
      console.log("Content has been matched: ", content);
      const groupContent = content.replace(this.groupKey, "");
      console.log("new content: ", groupContent);
      await chatGPTClient.replyMessage(room, groupContent);
      return;
    } else {
      console.log("Content is not within the scope of the customizition format");
    }
  }

  async replyPrivate(alias, content, chatGPTClient, contact): Promise<void> {
    console.log(`talker: ${alias} content: ${content}`);
    if (content.startsWith(this.privateKey) || this.privateKey === "") {
      let privateContent = content;
      if (this.privateKey !== "") {
        privateContent = content.substring(this.privateKey.length).trim();
      }
      await chatGPTClient.replyMessage(contact, privateContent);
    } else {
      console.log(
        "Content is not within the scope of the customizition format"
      );
    }
  }
}
