import config from "./config.js";
import secret from "./secret.js";

export default class ServiceConfig {
  constructor () {}

  isEnabledForGroup(topic: string): boolean {
    if (config.enabledForAllGroups) {
      return true
    } else {
      return config.enabledGroupNames.includes(topic)
    }
  }

  getApiKey(): string {
    let apiKey = config.OPENAI_API_KEY;
    if (apiKey === null || apiKey === "") {
      apiKey = secret.OPENAI_API_KEY;
      if (apiKey === null || apiKey === "") {
        const errMsg = "OPENAI_API_KEY not found";
        console.error(errMsg);
        throw new Error(errMsg);
      }
    }
    return apiKey
  }

  getPrivateKey(): string {
    return config.privateKey
  }

  getGroupKey(): string {
    return config.groupKey
  }
}
