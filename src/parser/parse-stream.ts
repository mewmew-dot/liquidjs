import Token from 'src/parser/token'
import ITemplate from 'src/template/itemplate'
import TagToken from './tag-token'

type ParseToken = ((token: Token, remainTokens: Array<Token>) => ITemplate)

export default class ParseStream {
  private tokens: Array<Token>
  private handlers: {[key: string]: (arg: any) => void} = {}
  private stopRequested: boolean = false
  private parseToken: ParseToken

  constructor (tokens: Array<Token>, parseToken: ParseToken) {
    this.tokens = tokens
    this.parseToken = parseToken
  }
  on<T extends ITemplate | Token | undefined> (name: string, cb: (arg: T) => void): ParseStream {
    this.handlers[name] = cb
    return this
  }
  trigger <T extends Token | ITemplate> (event: string, arg?: T) {
    const h = this.handlers[event]
    if (typeof h === 'function') {
      h(arg)
      return true
    }
    return false
  }
  start () {
    this.trigger('start')
    let token: Token | undefined
    while (!this.stopRequested && (token = this.tokens.shift())) {
      if (this.trigger('token', token)) continue
      if (token.type === 'tag' && this.trigger(`tag:${(<TagToken>token).name}`, token)) {
        continue
      }
      const template = this.parseToken(token, this.tokens)
      this.trigger('template', template)
    }
    if (!this.stopRequested) this.trigger('end')
    return this
  }
  stop () {
    this.stopRequested = true
    return this
  }
}
