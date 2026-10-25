import { client, xml } from '@xmpp/client'
import type { MessageHandlerPayload, XMPPService, XMPPServiceOptions } from '@eguru/types'

export const createXmppService = async ({
  userName,
  userPassword,
  xmppVirtualHost,
  logger,
}: XMPPServiceOptions): Promise<XMPPService> => {
  const messageHandlers: Array<(payload: MessageHandlerPayload) => void> = []

  const xmpp = client({
    service: `xmpp://${xmppVirtualHost}:5222`,
    domain: xmppVirtualHost,
    username: userName,
    password: userPassword,
  })

  xmpp.on('online', async (address) => {
    logger.info(`Bot ${userName} connected as ${address.toString()}`)
    await xmpp.send(xml('presence'))
  })

  xmpp.on('stanza', (stanza) => {
    if (
      stanza.is('message') &&
      stanza.getChild('body') &&
      stanza.attrs['type'] !== 'error'
    ) {
      const from = stanza.attrs['from']
      if (from?.startsWith(`${userName}@${xmppVirtualHost}`)) {
        return
      }

      const messageHandlerPayload = {
        stanza,
        logger,
        xmpp,
      }
      const body = stanza.getChildText('body') ?? ''
      if (
        body.includes(
          'I sent you an OMEMO encrypted message but your client doesn’t seem to support that',
        )
      ) {
        const message = xml(
          'message',
          { type: 'chat', to: from },
          xml(
            'body',
            {},
            'Бот не поддерживает шифрованные сообщения. Отключите оконечное шифрование в этом чате.',
          ),
        )
        void xmpp.send(message)
        return
      }

      messageHandlers.forEach((handler) => handler(messageHandlerPayload))
    }
  })

  const start = () => xmpp.start()

  await start()

  console.log('xmpp service has been initialized.')

  const isOnline = () => xmpp.status === 'online'

  const addMessageHandler = (handler: (payload: MessageHandlerPayload) => void) => {
    messageHandlers.push(handler)
  }

  return {
    isOnline,
    start,
    addMessageHandler,
  }
}
