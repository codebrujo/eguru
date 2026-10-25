import type { PutParameterCommandOutput } from '@aws-sdk/client-ssm'
import type { Client } from '@xmpp/client'
import type { Element } from '@xmpp/xml'

export type StackTrace = {
  source: string
  details: string
}

export type MultiStackTrace = {
  level: 'ERROR' | 'INFO'
  source: string
  details: string
}

export type LogEntry = {
  timestamp: string
  level: string
  message: unknown
  stack?: StackTrace
  multistack?: MultiStackTrace[]
}

export type ChatguruMessage = {
  channelId: string
  messages: Array<{
    text: string
    timestamp: string
    media?: Array<{
      url: string
      type: string
    }>
  }>
}

export type ChatguruService = {
  sendMessage(message: ChatguruMessage, enableLog?: boolean): Promise<Response | undefined>
  addToGroup(channelId: string, userToAdd: string): Promise<Response | undefined>
}

export type LoggerOptions = {
  s3: S3Service
  env: EnvService
}

export type LoggerService = {
  info(data: unknown, stack?: StackTrace): void
  error(data: unknown, stack?: StackTrace): void
  debug(data: unknown, stack?: StackTrace): void
  flushLog(): Promise<void>
  setLogLevel(level: string): string
  getLogLevel(): string
  setChatguruService(chatguru: ChatguruService): void
  getLog(): LogEntry[]
  setModuleInfo(key: string, logEntry: Partial<LogEntry>): void
  getModuleInfo(): Record<string, Partial<LogEntry>>
}

export type CryptoService = {
  encrypt(data: string): string
  decrypt(data: string): string
}

export type S3Service = {
  get(key: string): Promise<string>
  put(key: string, data: string): Promise<void>
}

export type S3ServiceOptions = {
  accessKeyId: string
  secretAccessKey: string
  AWSRegion: string
  bucket: string
}

export type SSMService = {
  get(name: string): Promise<string>
  set(name: string, value: string): Promise<PutParameterCommandOutput>
}

export type SSMServiceOptions = {
  accessKeyId: string
  secretAccessKey: string
  AWSRegion: string
}

export type EnvService = {
  get(name: string, opts?: { default?: string }): string
  getOrThrow(name: string): string
  loadFromS3(): Promise<void>
  set(name: string, value: string): string
  injectDependencies(deps: { s3?: S3Service; crypto?: CryptoService; ssm?: SSMService }): void
  loadSecureEnvsFromSSM(): Promise<void>
  loadEnv(): Promise<void>
}

export enum UserRoles {
  ADMIN = 'admin',
  TRUSTED = 'trusted',
  USER = 'user',
}

export type User = {
  id: string
  name: string
  roles: UserRoles[]
}

export type UserService = {
  loadUsers(): Promise<User[]>
  getById(id: string): User | undefined
  getDefaultUser(id: string): User
}

export type CreateUserServiceOptions = {
  s3: S3Service
  crypto: CryptoService
  env: EnvService
}

export type MessageHandlerPayload = {
  stanza: Element
  logger: LoggerService
  xmpp: Client
}

export type XMPPService = {
  isOnline: () => boolean
  start: () => ReturnType<Client['start']>
  addMessageHandler: (handler: (payload: MessageHandlerPayload) => void) => void
}

export type XMPPServiceOptions = {
  userName: string
  userPassword: string
  xmppVirtualHost: string
  logger: LoggerService
}
