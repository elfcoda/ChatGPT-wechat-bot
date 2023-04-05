import { ChatGPTClient } from "@waylaidwanderer/chatgpt-api";
import config from "./config.js";
import ChatOptions from "./storage/chatOption.js"
import ServiceConfig from "./serviceConfig.js";
import { ConstValue } from "./constValue.js"

const clientOptions = {
  // (Optional) Support for a reverse proxy for the completions endpoint (private API server).
  // Warning: This will expose your `openaiApiKey` to a third party. Consider the risks before using this.
  // reverseProxyUrl: "",
  // (Optional) Parameters as described in https://platform.openai.com/docs/api-reference/completions
  modelOptions: {
    // You can override the model name and any other parameters here, like so:
    model: "gpt-3.5-turbo",
    // I'm overriding the temperature to 0 here for demonstration purposes, but you shouldn't need to override this
    // for normal usage.
    temperature: 0,
    // Set max_tokens here to override the default max_tokens of 1000 for the completion.
    // max_tokens: 1000,
  },
  // (Optional) Davinci models have a max context length of 4097 tokens, but you may need to change this for other models.
  // maxContextTokens: 4097,
  // (Optional) You might want to lower this to save money if using a paid model like `text-davinci-003`.
  // Earlier messages will be dropped until the prompt is within the limit.
  // maxPromptTokens: 3097,
  // (Optional) Set custom instructions instead of "You are ChatGPT...".
  // promptPrefix: 'You are Bob, a cowboy in Western times...',
  // (Optional) Set a custom name for the user
  // userLabel: 'User',
  // (Optional) Set a custom name for ChatGPT
  // chatGptLabel: 'ChatGPT',
  // (Optional) Set to true to enable `console.debug()` logging
  debug: true,
};

const cacheOptions = {
  // Options for the Keyv cache, see https://www.npmjs.com/package/keyv
  // This is used for storing conversations, and supports additional drivers (conversations are stored in memory by default)
  // For example, to use a JSON file (`npm i keyv-file`) as a database:
  // store: new KeyvFile({ filename: 'cache.json' }),
};

export default class ChatGPT {
  private chatOptions: ChatOptions
  private serviceConfig: ServiceConfig
  private chatGPT: ChatGPTClient

  constructor() {
    this.chatOptions = new ChatOptions()
    this.serviceConfig = new ServiceConfig()

    const apiKey = this.serviceConfig.getApiKey()
    this.chatGPT = new ChatGPTClient(
      apiKey,
      {
        ...clientOptions,
        reverseProxyUrl: config.reverseProxyUrl,
      },
      cacheOptions
    );
  }

  async getChatGPTReply(content, contactId) {
    const data = await this.chatGPT.sendMessage(content, this.chatOptions.getCache(contactId));
    const { response, conversationId, messageId } = data;
    await this.chatOptions.store(contactId, conversationId, messageId)

    console.log("chat options: ", this.chatOptions.getAllCache())
    // response is a markdown-formatted string
    return response;
  }

  async sayWithHiddenChar(contact, msg) {
    await contact.say(msg + ConstValue.HiddenChar)
  }

  async replyMessage(contact, content, quote: boolean) {
    const { id: contactId } = contact;
    try {
      if (content.trim().toLocaleLowerCase() === config.resetKey.toLocaleLowerCase()) {
        await this.chatOptions.delete(contactId)
        await this.sayWithHiddenChar(contact, ConstValue.Session_Reset)
        return
      }
      const message = await this.getChatGPTReply(content, contactId);

      if ((contact.topic && contact?.topic() && config.groupReplyMode) ||
         (!contact.topic && config.privateReplyMode)) {
        if (quote) {
          await this.sayWithHiddenChar(contact, message);
        } else {
          const result = content + ConstValue.QuoteSplit + message;
          await this.sayWithHiddenChar(contact, result);
        }
      } else {
        await this.sayWithHiddenChar(contact, message);
      }
    } catch (e: any) {
      console.error(e);
      if (e.message.includes(ConstValue.CommonMsg_TimeOut)) {
        await this.sayWithHiddenChar(contact, content + ConstValue.ChatGPT_TimeOut);
      } else {
        await this.sayWithHiddenChar(contact, content + ConstValue.ChatGPT_Error);
      }
    }
  }
}
