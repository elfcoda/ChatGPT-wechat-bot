import { WechatyBuilder } from "wechaty";
import qrcodeTerminal from "qrcode-terminal";
import config from "./config.js";
import ChatGPT from "./chatgpt.js";
import { sleep } from "./utils.js";
import { ReplyType } from "./gptreplytype.js";
import GPTReplyType from "./gptreplytype.js";
import Personal from "./personal.js"
import ReplyService from "./replyService.js"

let userMe: any = null;
let bot: any = {};
const startTime = new Date();
let chatGPTClient: ChatGPT
let gptReplyType: GPTReplyType
let personal: Personal
let replyService: ReplyService

// room topic or user id
const queuePeerIDToReplySet = new Set<string>();
const hiddenChar = "\u200B";
initProject();

function getPeer(from, to) {
  if (from.id === userMe.id) {
    return to;
  } else {
    return from;
  }
}

async function onMessage(msg) {
  // 避免重复发送
  if (msg.date() < startTime) {
    return;
  }
  console.log("start to process msg: ", msg.text())
  const contact = msg.talker();
  const receiver = msg.to();
  const peer = getPeer(contact, receiver);
  // console.log("user: ", userMe);
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

  // personal.sendToMyself(contact, receiver, content, alias, chatGPTClient);
  // personal.sendToFileHelper(receiver, content, alias, chatGPTClient);

  // whoever send the msg
  let replyType = await gptReplyType.getReplyType(msg);
  console.log("replyType is ", replyType);

  if (replyType === ReplyType.Immediately) {
    if (!room) {
      await replyService.replyPrivate(alias, content, chatGPTClient, peer);
    } else {
      console.log("start to reply my msg in group");
      if (msg.self()) {
        // only I can trigger, other members should in another way
        await replyService.replyMyMsgGroup(room, content, chatGPTClient);
      } else {
        // other members' immediate reply, could be @ me or non-@ me
        await replyService.replyGroup(room, contact, receiver, content, msg, chatGPTClient, ReplyType.Immediately)
      }
    }

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
    // chat group members' msg
    queuePeerIDToReplySet.add(room.topic());
    await sleep(30* 1000);

    if (queuePeerIDToReplySet.has(room.topic())) {
      console.log(`finds ${room.topic()} in set`);
      // should @ me, delay reply
      await replyService.replyGroup(room, contact, receiver, content, msg, chatGPTClient, ReplyType.Timer);
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
      await replyService.replyPrivate(alias, content, chatGPTClient, contact);
      return;
    } else {
      console.log(`${contact.id} not found in set`);
    }
  }
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
    gptReplyType = new GPTReplyType();
    personal = new Personal();
    replyService = new ReplyService();
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
