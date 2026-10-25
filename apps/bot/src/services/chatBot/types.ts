import {
  User,
  UserRoles,
  ChatguruService,
  LoggerService,
  MessageHandlerPayload,
} from '@eguru/types'

export type SessionContext = {
  user: User
  isAdmin: boolean
  role: UserRoles
  logger: LoggerService
  chatguru: ChatguruService
  setState: (_state: Record<string, unknown>) => void
  getState: () => Record<string, unknown>
}

export type MenuHandlerResponse = (
  payload: MessageHandlerPayload,
  context: SessionContext,
) => MenuHandler | undefined
export type MenuHandler = (
  payload: MessageHandlerPayload,
  context: SessionContext,
) => MenuHandlerResponse | undefined

export type MenuAndHandler = {
  menu: string
  handler: MenuHandler
}
