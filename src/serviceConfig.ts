import config from "./config.js";

export default class ServiceConfig {
  constructor () {}

  isEnabledForGroup(topic: string): boolean {
    if (config.enabledForAllGroups) {
      return true
    } else {
      return config.enabledGroupNames.includes(topic)
    }
  }

  getPrivateKey(): string {
    return config.privateKey
  }

  getGroupKey(): string {
    return config.groupKey
  }
}
