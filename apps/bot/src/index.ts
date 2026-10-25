import { createCryptoService } from '@eguru/crypto'
import { createChatguruService } from '@eguru/chatguru'
import { createEnvService } from '@eguru/env'
import { createS3Service } from '@eguru/s3'
import { createSSMService } from '@eguru/ssm'
import { createXmppService } from '@eguru/xmpp'
import { createChatBot } from './services/chat-bot'
import { createLogger } from '@eguru/logger'
import { createUserService } from '@eguru/user'

const env = createEnvService()
const ssm = createSSMService({
  accessKeyId: env.getOrThrow('AWS_ACCESS_KEY_ID'),
  secretAccessKey: env.getOrThrow('AWS_SECRET_ACCESS_KEY'),
  AWSRegion: env.getOrThrow('AWS_REGION'),
})
env.injectDependencies({ ssm })

async function main() {
  await env.loadSecureEnvsFromSSM()
  const crypto = createCryptoService(env.get('CRYPTO_SECRET'))
  const s3 = createS3Service({
    accessKeyId: env.get('AWS_ACCESS_KEY_ID'),
    secretAccessKey: env.get('AWS_SECRET_ACCESS_KEY'),
    AWSRegion: env.get('AWS_REGION'),
    bucket: env.get('AWS_S3_BUCKET'),
  })

  env.injectDependencies({ s3, crypto })
  await env.loadEnv()
  const logger = createLogger({ s3, env })
  const chatguru = createChatguruService(env, logger)
  logger.setChatguruService(chatguru)
  const userService = await createUserService({ s3, crypto, env })
  const chatBot = createChatBot({ userService, logger, chatguru })
  const xmpp = await createXmppService({
    userName: env.getOrThrow('XMPP_BOT_NAME'),
    userPassword: env.getOrThrow('XMPP_BOT_PASSWORD'),
    xmppVirtualHost: env.getOrThrow('XMPP_VIRTUAL_HOST'),
    logger,
  })

  chatguru.sendMessage({
    channelId: env.getOrThrow('CHATGURU_SERVICE_CHANNEL'),
    messages: [
      {
        text: `eGuru service is up and running in ${env.getOrThrow('NODE_ENV')} env.`,
        timestamp: new Date().toISOString()
      },
    ],
  })

  return {
    crypto,
    s3,
    logger,
    userService,
    chatBot,
    xmpp,
  }
}

main()
  .then((services) => {
    services.xmpp.addMessageHandler(services.chatBot.handleMessage)
  })
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
