import type {
  ChatguruService,
  LoggerOptions,
  LoggerService,
  LogEntry,
  StackTrace,
} from '@eguru/types'

const LOGGER_BUCKET_KEY_NAME = 'logs/log'
const LOG_LEVEL_ENV_NAME = 'LOG_LEVEL'

export const createLogger = ({ s3, env }: LoggerOptions): LoggerService => {
  const runtimeEnv = env.get('NODE_ENV')
  const serviceChannelId = env.get('CHATGURU_SERVICE_CHANNEL')
  let chatguru: ChatguruService | undefined
  let log: LogEntry[] = []

  const moduleInfo: Record<string, Partial<LogEntry>> = {}

  const setLogLevel = (level: string) => {
    const levels = ['ERROR', 'INFO', 'DEBUG']
    if (!levels.includes(level)) {
      return env.get(LOG_LEVEL_ENV_NAME)
    }
    log.push({
      timestamp: new Date().toISOString(),
      level,
      message: `Log level set to ${level}`,
    })
    env.set(LOG_LEVEL_ENV_NAME, level)
    console.log(`Log level set to ${level}`)
    return level
  }

  const getLogLevel = () => env.get(LOG_LEVEL_ENV_NAME)

  const setModuleInfo = (key: string, logEntry: Partial<LogEntry>) => {
    const cleanedKey = key
      .replace(/[^$_\p{ID_Start}]/u, '_')
      .replace(/[^$_\u200C\u200D\p{ID_Continue}]/gu, '_')
    moduleInfo[cleanedKey] = {
      ...logEntry,
      timestamp: new Date().toISOString(),
    }
  }

  const notifyViaChatguru = ({
    data,
    stack,
    sendToChatguru = env.get(LOG_LEVEL_ENV_NAME) === 'DEBUG',
  }: {
    data: unknown
    sendToChatguru?: boolean
    stack?: StackTrace
  }) => {
    if (serviceChannelId && chatguru && sendToChatguru) {
      void chatguru.sendMessage(
        {
          channelId: serviceChannelId,
          messages: [
            {
              text: JSON.stringify({ data, stack }),
              timestamp: new Date().toISOString(),
            },
          ],
        },
        false,
      )
    }
  }

  const debug = (data: unknown, stack?: StackTrace) => {
    if (env.get(LOG_LEVEL_ENV_NAME) === 'DEBUG') {
      console.log(new Date().toISOString(), data, ...(stack ? [stack] : []))
      log.push({
        timestamp: new Date().toISOString(),
        level: env.get(LOG_LEVEL_ENV_NAME),
        message: data,
        stack,
      })
    }
    notifyViaChatguru({ data, stack })
  }

  const info = (data: unknown, stack?: StackTrace) => {
    if (['DEBUG', 'INFO'].includes(env.get(LOG_LEVEL_ENV_NAME))) {
      console.log(new Date().toISOString(), data, ...(stack ? [stack] : []))
      log.push({
        timestamp: new Date().toISOString(),
        level: env.get(LOG_LEVEL_ENV_NAME),
        message: data,
        stack,
      })
      notifyViaChatguru({ data, stack })
    }
  }

  const error = (data: unknown, stack?: StackTrace) => {
    console.error(new Date().toISOString(), data, ...(stack ? [stack] : []))
    log.push({
      timestamp: new Date().toISOString(),
      level: env.get(LOG_LEVEL_ENV_NAME),
      message: data,
      stack,
    })
    notifyViaChatguru({ data, stack, sendToChatguru: true })
  }

  const flushLog = async () => {
    if (log.length === 0) return
    await s3.put(
      `${LOGGER_BUCKET_KEY_NAME}_${runtimeEnv}_${new Date().toISOString()}`,
      JSON.stringify(log),
    )
    if (env.get(LOG_LEVEL_ENV_NAME) === 'DEBUG') {
      console.log(`Flushed ${log.length} log entries to S3`)
    }
    log = []
    log.push({
      timestamp: new Date().toISOString(),
      level: 'DEBUG',
      message: 'Log flushed',
    })
  }

  const getLog = () => log
  const setChatguruService = (chatguruService: ChatguruService) =>
    (chatguru = chatguruService)
  const getModuleInfo = () => moduleInfo

  return {
    info,
    error,
    debug,
    flushLog,
    setLogLevel,
    getLogLevel,
    setChatguruService,
    getLog,
    setModuleInfo,
    getModuleInfo,
  }
}
