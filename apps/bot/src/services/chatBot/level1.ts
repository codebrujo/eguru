import xml from '@xmpp/xml'
import { MenuHandlerResponse, SessionContext } from './types'
import { createAndSaveMenuMapping } from './level2'
import { MessageHandlerPayload } from '@eguru/types'

export const DEFAULT_HANDLER_COMMANDS = [
  {
    command: 'menu',
  },
  {
    command: 'меню',
  },
]

export const handleMessage = (
  { stanza, xmpp }: MessageHandlerPayload,
  sessionContext: SessionContext,
): MenuHandlerResponse => {
  const { setState } = sessionContext
  const defaultHandlers = [
    {
      command: 'menu',
      response: createAndSaveMenuMapping(setState),
      nextHandler: handleMessage,
    },
    {
      command: 'меню',
      response: createAndSaveMenuMapping(setState),
      nextHandler: handleMessage,
    },
  ]

  const { from } = stanza.attrs
  const body = stanza.getChildText('body')
  if (!body) return handleMessage
  let response = body
  let nextHandler = handleMessage
  const responseHandlers = defaultHandlers.find(
    ({ command }) => command === body.toLowerCase(),
  )
  if (responseHandlers) {
    response = responseHandlers.response
    nextHandler = responseHandlers.nextHandler
  }
  const message = xml('message', { type: 'chat', to: from }, xml('body', {}, response))
  xmpp.send(message)
  return nextHandler
}
