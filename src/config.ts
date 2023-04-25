export default {
  // 填入你的OPENAI_API_KEY
  OPENAI_API_KEY: "",
  // 反向代理地址，简单说就是你的在国外服务器地址，如何获取看README
  // 可换成你自己的，白嫖代理地址 https://ai.devtool.tech/proxy/v1/chat/completions
  reverseProxyUrl: "https://ai.devtool.tech/proxy/v1/chat/completions",
  // 在群组中设置唤醒微信机器人的关键词
  groupKey: "",
  // 在私聊中设置唤醒微信机器人的关键词
  privateKey: "",
  // 重置上下文的关键词，如可设置为reset
  resetKey: "reset",
  // 是否在群聊中带上提问的问题
  groupReplyMode: true,
  // 是否在私聊中带上提问的问题
  privateReplyMode: false,
  // is enabled for all groups
  enabledForAllGroups: false,
  // only enabled in specific groups, take effect when enabledForAllGroups is false
  enabledGroupNames: [
    "园区摩友乌托邦",
    "北极鹅",
    "企点客小服",
    "MMD 的气象学家们",
    "长三角跳伞Fun Jumpers",
    "一炉一叶三尘",
    "MS-MMD Suzhou",
    "字*难民营",
  ]
};
