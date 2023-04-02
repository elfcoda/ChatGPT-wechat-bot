import { WechatyBuilder } from "wechaty";
import qrcodeTerminal from "qrcode-terminal";
import config from "./config.js";
import ChatGPT from "./chatgpt.js";

let bot: any = {};
const startTime = new Date();
let chatGPTClient: any = null;
initProject();
async function onMessage(msg) {
  console.log("received a msg.");
  // 避免重复发送
  if (msg.date() < startTime) {
    return;
  }
  const contact = msg.talker();
  const receiver = msg.to();
  const content = msg.text().trim();
  const room = msg.room();
  const alias = (await contact.alias()) || (await contact.name());
  const isText = msg.type() === bot.Message.Type.Text;
  if (msg.self()) {
    return;
  }

  if (!isText) {
    console.log("not a text.");
    return;
  }

  if (!isNeedAnswer(content)) {
    console.log("no need to answer.");
    return;
  }

  if (room && isText)
  {
    const topic = await room.topic();
    console.log(
      `Group name: ${topic} talker: ${await contact.name()} content: ${content}`
    );

    const pattern = RegExp(`^@${receiver.name()}\\s+${config.groupKey}[\\s]*`);
    if (await msg.mentionSelf()) {
      if (pattern.test(content)) {
        const groupContent = content.replace(pattern, "");
        chatGPTClient.replyMessage(room, groupContent);
        return;
      } else {
        console.log(
          "Content is not within the scope of the customizition format"
        );
      }
    }
  }
  else if (isText)
  {
    console.log(`talker: ${alias} content: ${content}`);
    if (content.startsWith(config.privateKey) || config.privateKey === "") {
      let privateContent = content;
      if (config.privateKey !== "") {
        privateContent = content.substring(config.privateKey.length).trim();
      }
      chatGPTClient.replyMessage(contact, privateContent);
    } else {
      console.log(
        "Content is not within the scope of the customizition format"
      );
    }
  }
}

function isNeedAnswer(content: string)
{
  const includeList = ['why', 'what', 'how', 'when', 'tell', 'Why', 'What', 'How', 'When', 'Tell', 'explain', 'Explain', 'generate', 'Generate', 'give', 'Give',
    '?', 'ask', 'question', 'could', 'Could', 'may', 'May', 'might', 'Might', 'should', 'Should',
    '为什么', '为啥', '什么', '是吗', '好吗', '怎么', '怎样', '告诉', '说说', '说下', '解释', '生成', '输出', '给出', '是不是', '？', '问', '有没有', '有吗', '能', '帮', '请', '做', '吗', '么', '吧', '把', '啥', '谁',
    '几', '多少'
  ]

  for (const element of includeList)
  {
    if (content.includes(element)) {
      console.log("catch element: ", element);
      return true;
    }
  }

  console.log("doesn't catch a word");
  return false;
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
