import xml from '@xmpp/xml'
import { MenuHandlerResponse, SessionContext } from './types'
import { handleMessage } from './'
import { MessageHandlerPayload } from '@eguru/types'

enum Level2Commands {
  ShowSubscriptionsMenu = '1',
  ActivatePrivateGroups = '2',
  Return = '3',
}

const defaultLanguage = 'ru-RU' as const

const menuDictionary = {
  menuHeader: {
    'ru-RU': 'Меню управления сервисом trade. Доступные команды:',
  },
  menuFooter: {
    'ru-RU': 'В ответном сообщении отправь номер нужного пункта меню.',
  },
  showSubscriptions: {
    'ru-RU': 'Показать меню управления подписками.',
  },
  activatePrivateGroups: {
    'ru-RU': 'Добавить мои группы (при их наличии).',
  },
  activatePrivateGroupsCommandSent: {
    'ru-RU': 'Команда на добавление групп отправлена.',
  },
  activatePrivateGroupsNoGroups: {
    'ru-RU': 'У вас нет групп.',
  },
  return: {
    'ru-RU': 'Возврат',
  },
}

type Level2State = {
  menuMapping: {
    commandKey: string
    command: Level2Commands
  }[]
}

export const createAndSaveMenuMapping = (
  setState: (state: Record<string, unknown>) => void,
): string => {
  const menuMapping: Level2State['menuMapping'] = []
  let commandKey = 1
  let menuText = `${menuDictionary.menuHeader[defaultLanguage]}
${commandKey}. ${menuDictionary.showSubscriptions[defaultLanguage]}`
  menuMapping.push({
    commandKey: String(commandKey),
    command: Level2Commands.ShowSubscriptionsMenu,
  })
  menuText = `${menuText}
${++commandKey}. ${menuDictionary.activatePrivateGroups[defaultLanguage]}`
  menuMapping.push({
    commandKey: String(commandKey),
    command: Level2Commands.ActivatePrivateGroups,
  })
  menuText = `${menuText}
${++commandKey}. ${menuDictionary.return[defaultLanguage]}
${menuDictionary.menuFooter[defaultLanguage]}`
  menuMapping.push({
    commandKey: String(commandKey),
    command: Level2Commands.Return,
  })
  setState({
    level2: {
      menuMapping,
    },
  })
  return menuText
}

export const level2Handler = (
  { stanza, xmpp }: MessageHandlerPayload,
  sessionContext: SessionContext,
): MenuHandlerResponse => {
  const { from } = stanza.attrs
  const { getState, setState, user, chatguru } = sessionContext
  const body = stanza.getChildText('body')
  const state = getState()['level2'] as Level2State | undefined
  const userMenuOptions = state?.menuMapping ?? []
  const userChoice = userMenuOptions.find((i) =>
    body?.toLowerCase().includes(i.commandKey),
  )
  switch (userChoice?.command) {
    case Level2Commands.ShowSubscriptionsMenu:
      console.log('Run ShowSubscriptionsMenu')
      break
    case Level2Commands.ActivatePrivateGroups:
      console.log('Run ActivatePrivateGroups')
      break
    case Level2Commands.Return:
      return handleMessage
    default:
      const message = xml(
        'message',
        { type: 'chat', to: from },
        xml('body', {}, createAndSaveMenuMapping(setState)),
      )
      xmpp.send(message)
      break
  }

  return level2Handler
}
