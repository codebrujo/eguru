import { Agent, fetch as undiciFetch } from 'undici'
import type {
  ChatguruMessage,
  ChatguruService,
  EnvService,
  LoggerService,
} from '@eguru/types'

const insecureAgent = new Agent({
  connect: {
    rejectUnauthorized: false,
  },
})

export const createChatguruService = (
  env: EnvService,
  logger: LoggerService,
): ChatguruService => {
  const baseUrl = env.get('CHATGURU_URL')
  const token = env.get('CHATGURU_TOKEN')
  const appToken = env.get('CHATGURU_APP_TOKEN')

  const runtimeEnv = env.get('NODE_ENV')
  if (runtimeEnv === 'development') {
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'
  }

  const sendMessage = async (message: ChatguruMessage, enableLog = true) => {
    if (message.messages.length === 0) return
    const targetUrl = `${baseUrl}message`
    let res: Response | undefined = undefined
    if (runtimeEnv === 'development') {
      try {
        res = (await undiciFetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-app-validation': appToken,
            'x-app-s2s-token': token,
          },
          body: JSON.stringify(message),
          dispatcher: insecureAgent,
        })) as unknown as Response
        if (enableLog) {
          const execResult = await res.json()
          if (execResult.error) {
            logger.debug(JSON.stringify(execResult), {
              source: 'ChatguruService.sendMessage',
              details: `Failed to sent message to ${message.channelId} on endpoint ${targetUrl} via undici.`,
            })
            logger.debug(JSON.stringify(message), {
              source: 'ChatguruService.sendMessage',
              details: 'Message body',
            })
          } else {
            logger.debug(JSON.stringify(execResult), {
              source: 'ChatguruService.sendMessage',
              details: `Succesfully sent message to ${message.channelId} on ${targetUrl} via undici.`,
            })
          }
        }
        return res
      } catch (error) {
        if (enableLog) {
          logger.error(JSON.stringify(error), {
            source: 'ChatguruService.sendMessage',
            details: `Failed to sent message to ${message.channelId} on endpoint ${targetUrl} with error message ${(error as Error).message} via undici.`,
          })
        } else {
          console.error(
            `Failed to sent message to ${message.channelId} on endpoint ${targetUrl} with error message ${(error as Error).message} via undici.`,
          )
        }
      }
    }
    try {
      res = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-validation': appToken,
          'x-app-s2s-token': token,
        },
        body: JSON.stringify(message),
      })
      if (enableLog) {
        logger.debug(await res.json(), {
          source: 'ChatguruService.sendMessage',
          details: `Succesfully sent message to ${targetUrl} via Node fetch.`,
        })
      }
    } catch (error) {
      if (enableLog) {
        logger.error((error as Error).message, {
          source: 'ChatguruService.sendMessage',
          details: `send message to ${message.channelId} failed`,
        })
      } else {
        console.error(
          `ChatguruService.sendMessage: send message to ${message.channelId} failed. ${(error as Error).message}`,
        )
      }
    }
    return res
  }

  const addToGroup = async (channelId: string, userToAdd: string) => {
    const targetUrl = `${baseUrl}addToGroup`
    let res: Response | undefined = undefined
    const body = JSON.stringify({
      channelId,
      userToAdd,
    })
    if (runtimeEnv === 'development') {
      try {
        res = (await undiciFetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-app-validation': appToken,
            'x-app-s2s-token': token,
          },
          body,
          dispatcher: insecureAgent,
        })) as unknown as Response
        const execResult = await res.json()
        logger.debug(execResult, {
          source: 'ChatguruService.addToGroup',
          details: execResult.error
            ? `Failed to add user ${userToAdd} to group ${channelId} via undici.`
            : `Succesfully added user ${userToAdd} to group ${channelId} via undici.`,
        })
        return res
      } catch (error) {
        logger.error((error as Error).message, {
          source: 'ChatguruService.addToGroup',
          details: `add user ${userToAdd} to group ${channelId} failed.`,
        })
      }
    }
    try {
      res = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-validation': appToken,
          'x-app-s2s-token': token,
        },
        body,
      })
      const execResult = await res.json()
      logger.debug(execResult, {
        source: 'ChatguruService.addToGroup',
        details: execResult.error
          ? `Failed to add user ${userToAdd} to group ${channelId} via Node fetch.`
          : `Succesfully added user ${userToAdd} to group ${channelId} via Node fetch.`,
      })
    } catch (error) {
      logger.error((error as Error).message, {
        source: 'ChatguruService.addToGroup',
        details: `add user ${userToAdd} to group ${channelId} failed.`,
      })
    }
    return res
  }

  return { sendMessage, addToGroup }
}
