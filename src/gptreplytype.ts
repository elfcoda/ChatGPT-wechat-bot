
export const enum ReplyType {
  NoReply = 0,
  Immediately = 1,
  Timer = 2,
}

export default class GPTReplyType {
  constructor() {
  }

  async getReplyType(msg): Promise<ReplyType> {
    const rawContent = msg.text()
    const isMentionedMe = await msg.mentionSelf()
    const room = msg.room()

    // specific for myselves' trigger feature in private chat and groups.
    if (msg.self()) {
    }

    // general case
    if (room && !msg.self()) {
      return this.getReplyTypeRoom(rawContent, isMentionedMe)
    } else {
      return this.getReplyTypePrivate(rawContent)
    }
  }

  getReplyTypePrivate(rawContent: string): ReplyType
  {
    if (rawContent.startsWith(" ") || rawContent.endsWith(" ")) {
      console.log("raw content starts/ends with \" \"");
      return ReplyType.Immediately;
    }

    const content = rawContent.trim();

    if (content.toLowerCase().includes("gpt") &&
        (content.toLowerCase().includes("hi") || content.toLowerCase().includes("hey") || content.toLowerCase().includes("hello") ||
        content.toLowerCase().includes("嗨") || content.toLowerCase().includes("嘿") || content.toLowerCase().includes("哈喽"))) {
          // immediately send
          console.log("content includes gpt");
          return ReplyType.Immediately;
    }

    if (content.toLowerCase().includes("@gpt") || content.toLowerCase().includes("@chatgpt") || content.toLowerCase().includes("@chat gpt")) {
      console.log("content includes @gpt")
      return ReplyType.Immediately;
    }

    const startsWithList = ["\\", "/", " ", ".", ":", "<", ">", "-", "`", "~", "!", "?", "|", "'", "#", "$", "^", "*"]
    for (const element of startsWithList) {
      if (content.toLowerCase().startsWith(element)) {
        console.log("content starts with startsWithList element \"", element, "\"");
        return ReplyType.Immediately;
      }
    }

    const endsWithList = [".", "。", "?", "？", "\\", "/", " ", "'", "$", "^"]
    for (const element of endsWithList) {
      if (content.toLowerCase().endsWith(element)) {
        console.log("content ends with endsWithList element \"", element, "\"");
        return ReplyType.Immediately;
      }
    }

    if (content.toLowerCase().includes("  ")) {
      console.log("content includes double spaces");
      return ReplyType.Immediately;
    }

    if (content.toLowerCase().includes("hi") ||
        content.toLowerCase().includes("hello") ||
        content.toLowerCase().includes("嗨") ||
        content.toLowerCase().includes("哈喽") ||
        content.toLowerCase().includes("您好") ||
        content.toLowerCase().includes("你好")) {
          // immediately send
          console.log("content starts with greetings");
          return ReplyType.Immediately;
        }

    const includeList = ['why', 'what', 'how', 'when', 'tell', 'Why', 'What', 'How', 'When', 'Tell', 'explain', 'Explain', 'generate', 'Generate', 'give', 'Give',
      '?', 'ask', 'question', 'could', 'Could', 'may', 'May', 'might', 'Might', 'should', 'Should',
      '为什么', '为啥', '什么', '是吗', '好吗', '怎么', '怎样', '告诉', '说说', '说下', '解释', '生成', '输出', '给出', '是不是', '？', '问', '有没有', '有吗', '能', '帮', '请', '做', '吗', '么', '吧', '把', '啥', '谁', '给我',
      '几', '多少', '哪'
    ]

    for (const element of includeList)
    {
      if (content.includes(element)) {
        console.log("catch element \"", element, "\"");
        return ReplyType.Timer;
      }
    }

    console.log("doesn't catch a word");
    return ReplyType.NoReply;
  }

  getReplyTypeRoom(rawContent: string, isMentionedMe: boolean): ReplyType
  {
    if (rawContent.startsWith("  ") || rawContent.endsWith("  ")) {
      console.log("raw content starts/ends with \"  \"");
      return ReplyType.Immediately;
    }

    const content = rawContent.trim();
    // @ or non-@
    if (content.toLowerCase().includes("gpt") &&
        (content.toLowerCase().includes("hi") || content.toLowerCase().includes("hey") || content.toLowerCase().includes("hello") ||
        content.toLowerCase().includes("嗨") || content.toLowerCase().includes("嘿") || content.toLowerCase().includes("哈喽"))) {
          // immediately send
          console.log("content includes gpt");
          return ReplyType.Immediately;
      }

    if (content.toLowerCase().includes("@gpt") || content.toLowerCase().includes("@chatgpt") || content.toLowerCase().includes("@chat gpt")) {
      console.log("content includes @gpt")
      return ReplyType.Immediately;
    }

    const startsWithList = ["`", "^", "*", "  "]
    for (const element of startsWithList) {
      if (content.toLowerCase().startsWith(element)) {
        console.log("content starts with startsWithList element \"", element, "\"");
        return ReplyType.Immediately;
      }
    }

    const endsWithList = ["$", "  "]
    for (const element of endsWithList) {
      if (content.toLowerCase().endsWith(element)) {
        console.log("content ends with endsWithList element \"", element, "\"");
        return ReplyType.Immediately;
      }
    }

    if (content.toLowerCase().includes("大家好，") ||
        content.toLowerCase().includes("大家好 ")) {
          // immediately send
          console.log("content starts with greetings");
          return ReplyType.Immediately;
        }

    // @ me
    if (isMentionedMe) {
      const includeList = ['why', 'what', 'how', 'when', 'tell', 'Why', 'What', 'How', 'When', 'Tell', 'explain', 'Explain', 'generate', 'Generate', 'give', 'Give',
        '?', 'ask', 'question', 'could', 'Could', 'may', 'May', 'might', 'Might', 'should', 'Should',
        '为什么', '为啥', '什么', '是吗', '好吗', '怎么', '怎样', '告诉', '说说', '说下', '解释', '生成', '输出', '给出', '是不是', '？', '问', '有没有', '有吗', '能', '帮', '请', '做', '吗', '么', '吧', '把', '啥', '谁', '给我',
        '几', '多少', '哪', '写一个', '写出', '写下'
      ]

      for (const element of includeList)
      {
        if (content.includes(element)) {
          console.log("catch element \"", element, "\"");
          return ReplyType.Timer;
        }
      }
    }

    console.log("doesn't catch a word");
    return ReplyType.NoReply;
  }
}
