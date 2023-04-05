export const enum QuoteInstType {
  NotHandle = 0,
  Handle = 1,
}

export default class QuoteInst {
  constructor () {}

  quoteInstruction(inst: string): QuoteInstType {
    const instList = ["帮我", "答复", "回答", "回复", "恢复", "会打", "@gp", "@gpt", "@chatgpt", "@chat gpt", "gpt", "?", "？"]
    for (const element of instList) {
      if (inst.includes(element)) {
        console.log("inst includes element: ", element)
        return QuoteInstType.Handle
      }
    }
    return QuoteInstType.NotHandle
  }
}
