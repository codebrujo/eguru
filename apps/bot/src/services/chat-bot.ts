import { UserRoles } from '@eguru/user'
import type { ChatguruService, MessageHandlerPayload, UserService } from '@eguru/types'
import { handleMessage as defaultHandler, DEFAULT_HANDLER_COMMANDS } from './chatBot'
import { MenuHandler } from './chatBot/types'
import { LoggerService } from '@eguru/types'

export type MessageContext = {
  from: string
  menuHandler: MenuHandler
  state: Record<string, unknown>
}

export const createChatBot = ({
  userService,
  logger,
  chatguru,
}: {
  userService: UserService
  logger: LoggerService
  chatguru: ChatguruService
}) => {
  const messageContext: MessageContext[] = []

  const getContextOf = (from: string) => {
    let context = messageContext.find((context) => context.from === from)
    if (context) return context
    context = { from, menuHandler: defaultHandler, state: {} }
    messageContext.push(context)
    return context
  }

  const setMenuHandlerFor = (from: string, menuHandler: MenuHandler) => {
    const context = messageContext.find((context) => context.from === from)
    if (!context) return
    context.menuHandler = menuHandler
  }

  const createSetState = (from: string) => {
    const context = getContextOf(from)
    return (_state: Record<string, unknown>) => {
      context.state = _state
    }
  }

  const createGetState = (from: string) => {
    const context = getContextOf(from)
    return () => context.state
  }

  const handleMessage = (payload: MessageHandlerPayload) => {
    const { stanza } = payload
    const from = String(stanza.attrs['from'])
    const body = stanza.getChild('body')
    if (!from || !body) return

    const isDefaultCommand = DEFAULT_HANDLER_COMMANDS.map(
      (entry) => entry.command,
    ).includes(body.getText().toLowerCase())
    if (isDefaultCommand) {
      setMenuHandlerFor(from, defaultHandler)
    }

    const fromUser = from.split('@')[0]
    if (!fromUser) return
    const user = userService.getById(fromUser) ?? userService.getDefaultUser(fromUser)
    const role = user.roles.includes(UserRoles.TRUSTED)
      ? UserRoles.TRUSTED
      : UserRoles.USER
    const setState = createSetState(fromUser)
    const serviceContext = {
      user,
      isAdmin: user.roles.includes(UserRoles.ADMIN) || false,
      role,
      logger,
      chatguru,
      setState,
      getState: createGetState(fromUser),
    }

    try {
      const messageHandler = getContextOf(from).menuHandler
      const messageHandlerResult = messageHandler(payload, serviceContext)
      setMenuHandlerFor(from, messageHandlerResult ?? messageHandler ?? defaultHandler)
      if (!messageHandlerResult) {
        setState({})
      }
    } catch (error) {
      logger.debug(
        `Error while handling message from ${from} - ${(error as Error).message}`,
      )
    }
  }

  return {
    handleMessage,
  }
}
