import { WechatyBuilder } from "wechaty";
import qrcodeTerminal from "qrcode-terminal";
import config from "./config.js";
import ChatGPT from "./chatgpt.js";
import { sleep } from "./utils.js";

const enum ReplyType {
  NoReply = 0,
  Immediately = 1,
  Timer = 2,
}

let userMe: any = null;
let bot: any = {};
const startTime = new Date();
let lastGPTImmediatelyReply = startTime;
let chatGPTClient: any = null;
let GuidMyself = generateGUID();
let GuidFileHelper = generateGUID();
const GuidMyselfSet = new Set<string>();
const GuidFileHelperSet = new Set<string>();
// room topic or user id
const queuePeerIDToReplySet = new Set<string>();
const hiddenChar = "\u200B";
initProject();

function generateGUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function toMyself(from, to)
{
  try {
    return from.id === to.id;
  } catch (error) {
    return false;
  }
}

function isMe(user) {
  try {
    return user.id === userMe.id;
  } catch (error) {
    return false;
  }
}

function toFileHelper(to)
{
  try {
    return to.id === "filehelper"
  } catch (error) {
    return false;
  }
}

function getPeer(from, to) {
  if (from.id === userMe.id) {
    return to;
  } else {
    return from;
  }
}

function startsOrEndsWithSpace(text) {
  return text.startsWith(" ") || text.endsWith(" ")
}

async function onMessage(msg) {
  // 避免重复发送
  if (msg.date() < startTime) {
    return;
  }
  const contact = msg.talker();
  const receiver = msg.to();
  const peer = getPeer(contact, receiver);
  // console.log("user: ", userMe);
  // console.log("received a msg: ", msg);
  // console.log("received a msg. from: ", contact, ", to: ", receiver);
  if (msg.text().endsWith(hiddenChar)) {
    console.log("detected hiddenChar in the end of text");
    // sent by gpt, ignore
    return;
  } else {
    console.log("hiddenChar not found in the end of text");
  }
  const content = msg.text().trim();
  const room = msg.room();
  const alias = (await contact.alias()) || (await contact.name());
  const isText = msg.type() === bot.Message.Type.Text;

  if (msg.self()) {
    console.log("it's myself");
    // if I replied in early, do not  queue to reply again so remove from set.
    if (room) {
      if (queuePeerIDToReplySet.has(room.topic())) {
        queuePeerIDToReplySet.delete(room.topic());
      }
    } else {
      if (queuePeerIDToReplySet.has(peer.id)) {
        queuePeerIDToReplySet.delete(peer.id);
      }
    }
  }

  if (!isText) {
    console.log("not a text.");
    return;
  }

  // available in low qps
  // cannot send msg to myself so far, so this feature is unavailable now.
  if (toMyself(contact, receiver)) {
    console.log("to myself: ", content);
    // respond to myself
    if (!GuidMyselfSet.has(GuidMyself)) {
      console.log("start to send");
      GuidMyselfSet.add(GuidMyself);
      await replyPrivate(alias, content, config.privateKey, chatGPTClient, contact);
    } else {
      GuidMyselfSet.delete(GuidMyself);
    }

    return;
  }

  // available in low qps
  if (toFileHelper(receiver)) {
    console.log("to file helper: ", content);
    // respond to file helper
    if (!GuidFileHelperSet.has(GuidFileHelper)) {
      console.log("start to send");
      GuidFileHelperSet.add(GuidFileHelper);
      await replyPrivate(alias, content, config.privateKey, chatGPTClient, receiver);
    } else {
      GuidFileHelperSet.delete(GuidFileHelper);
    }

    return;
  }

  // whoever send the msg
  let replyType: ReplyType = ReplyType.NoReply;
  if (startsOrEndsWithSpace(msg.text())) {
    console.log("text starts or ends with space");
    replyType = ReplyType.Immediately;
  } else {
    console.log("text doesn't starts or ends with space");
    replyType = getReplyType(content);
  }

  console.log("replyType is ", replyType);
  if (!room) {
    console.log("not a room")
  } else {
    console.log("room topic: ", room.topic())
  }
  if (replyType === ReplyType.Immediately) {
    let immediatelyCheckTime = new Date();
    // in case gpt answer gptself's question, we limit the time to 20 seconds to answer in my side
    if ((immediatelyCheckTime.getTime() - lastGPTImmediatelyReply.getTime() < 20000) && msg.self()) {
      console.log("would not handle this msg");
      return;
    }

    // immediately send
    console.log("immediately send");
    if (!room) {
      await replyPrivate(alias, content, config.privateKey, chatGPTClient, peer);
    } else {
      // TODO
      // await replyGroup(room, contact, receiver, content, config.groupKey, msg, chatGPTClient);
    }
    lastGPTImmediatelyReply = new Date();

    return;
  } else if (replyType === ReplyType.NoReply) {
    console.log("no need to reply.");
    return;
  }

  if (msg.self()) {
    return;
  }

  // queue msg to reply if I don't reply yet, only reply peer's msg
  if (room)
  {
    // chat group mentions me
    queuePeerIDToReplySet.add(room.topic());
    await sleep(30* 1000);

    if (queuePeerIDToReplySet.has(room.topic())) {
      console.log(`finds ${room.topic()} in set`);
      await replyGroup(room, contact, receiver, content, config.groupKey, msg, chatGPTClient);
      return;
    } else {
      console.log(`${room.topic()} not found in set`);
    }
  }
  else
  {
    // contact sends to me
    queuePeerIDToReplySet.add(contact.id);
    await sleep(30 * 1000);

    if (queuePeerIDToReplySet.has(contact.id)) {
      console.log(`finds ${contact.id} in set`);
      await replyPrivate(alias, content, config.privateKey, chatGPTClient, contact);
      return;
    } else {
      console.log(`${contact.id} not found in set`);
    }
  }
}

async function replyGroup(room, contact, receiver, content, groupKey, msg, chatGPTClient)
{
  const topic = await room.topic();
  console.log(`Group name: ${topic} talker: ${await contact.name()} content: ${content}`);

  const pattern = RegExp(`^@${receiver.name()}\\s+${groupKey}[\\s]*`);
  if (await msg.mentionSelf()) {
    if (pattern.test(content)) {
      const groupContent = content.replace(pattern, "");
      await chatGPTClient.replyMessage(room, groupContent);
      return;
    } else {
      console.log(
        "Content is not within the scope of the customizition format"
      );
    }
  }
}

async function replyPrivate(alias, content, privateKey, chatGPTClient, contact)
{
  console.log(`talker: ${alias} content: ${content}`);
  if (content.startsWith(config.privateKey) || config.privateKey === "") {
    let privateContent = content;
    if (config.privateKey !== "") {
      privateContent = content.substring(config.privateKey.length).trim();
    }
    await chatGPTClient.replyMessage(contact, privateContent);
  } else {
    console.log(
      "Content is not within the scope of the customizition format"
    );
  }
}

function getReplyType(content: string): ReplyType
{
  if (content.toLowerCase().includes("gpt") &&
      (content.toLowerCase().includes("hi") || content.toLowerCase().includes("hey") || content.toLowerCase().includes("hello") ||
      content.toLowerCase().includes("嗨") || content.toLowerCase().includes("嘿") || content.toLowerCase().includes("哈喽"))) {
        // immediately send
        console.log("content includes gpt");
        return ReplyType.Immediately;
    }

  const startsWithList = ["\\", "/", " ", ".", ":", "<", ">", "-", "`", "~", "!", "?", "|", "'", "@", "#", "$", "^", "*"]
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

  if (content.toLowerCase().startsWith("hi") ||
      content.toLowerCase().startsWith("hello") ||
      content.toLowerCase().startsWith("嗨") ||
      content.toLowerCase().startsWith("哈喽") ||
      content.toLowerCase().startsWith("您好") ||
      content.toLowerCase().startsWith("你好")) {
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

function onScan(qrcode)
{
  qrcodeTerminal.generate(qrcode, { small: true });
  const qrcodeImageUrl = [
    "https://api.qrserver.com/v1/create-qr-code/?data=",
    encodeURIComponent(qrcode),
  ].join("");

  console.log(qrcodeImageUrl);
}

async function onLogin(user) {
  console.log(`${user} has logged in`);
  const date = new Date();
  userMe = user
  console.log(`Current time:${date}`);
}

function onLogout(user) {
  console.log(`${user} has logged out`);
}

async function initProject() {
  try {
    chatGPTClient = new ChatGPT();
    bot = WechatyBuilder.build({
      name: "WechatEveryDay",
      puppet: "wechaty-puppet-wechat", // 如果有token，记得更换对应的puppet
      puppetOptions: {
        uos: true,
      },
    });

    bot
      .on("scan", onScan)
      .on("login", onLogin)
      .on("logout", onLogout)
      .on("message", onMessage);

    bot
      .start()
      .then(() => console.log("Start to log in wechat..."))
      .catch((e) => console.error(e));
  } catch (error) {
    console.log("init error: ", error);
  }
}
