import type { CryptoService, EnvService, S3Service, SSMService } from '@eguru/types'
import * as dotenv from 'dotenv'

const BUCKET_KEY_NAME = 'environmentVariables'

export const createEnvService = (): EnvService => {
  let s3: S3Service | undefined
  let crypto: CryptoService | undefined
  let ssm: SSMService | undefined

  if (!process.env['NODE_ENV']) {
    console.log('Not containerized. Loading .env')
    dotenv.config({ path: '.env' })
  }

  const get = (name: string, opts: { default?: string } = {}): string => {
    const value = process.env[name] || opts.default
    if (value === undefined) {
      throw new Error(`Environment variable ${name} is not set`)
    }
    return value
  }

  const getOrThrow = (name: string): string => {
    const value = process.env[name]
    if (value === undefined) {
      throw new Error(`Environment variable ${name} is not set`)
    }
    return value
  }

  const injectDependencies = ({
    s3: _s3,
    crypto: _crypto,
    ssm: _ssm,
  }: {
    s3?: S3Service
    crypto?: CryptoService
    ssm?: SSMService
  }) => {
    if (_s3) s3 = _s3
    if (_crypto) crypto = _crypto
    if (_ssm) ssm = _ssm
  }

  const loadFromS3 = async () => {
    if (!s3 || !crypto) throw new Error('s3 and crypto dependencies should be defined')
    const keyName = `${get('NODE_ENV', { default: 'development' })}/${BUCKET_KEY_NAME}`
    const res = await s3.get(keyName)
    const parsed = JSON.parse(crypto.decrypt(res)) as Record<string, string>
    Object.entries(parsed).forEach(([key, value]) => {
      process.env[key] = value
    })
    console.log(`Environment variables have been loaded from ${keyName} s3 bucket file`)
  }

  const set = (name: string, value: string): string => {
    process.env[name] = value
    return value
  }

  const loadSecureEnvsFromSSM = async () => {
    if (!ssm) throw new Error('ssm dependency should be defined')
    const appPrefix = getOrThrow('SSM_APP_PARAMS_PREFIX')
    const envName = getOrThrow('NODE_ENV')
    const cryptoSecretKey = `${appPrefix}${envName}/CRYPTO_SECRET`
    const s3NameKey = `${appPrefix}AWS_S3_BUCKET`
    try {
      process.env['CRYPTO_SECRET'] = await ssm.get(cryptoSecretKey)
    } catch (error) {
      console.error(`Failed to obtain ${cryptoSecretKey} key.`)
    }
    try {
      process.env['AWS_S3_BUCKET'] = await ssm.get(s3NameKey)
    } catch (error) {
      console.error(`Failed to obtain ${s3NameKey} key.`)
    }
  }

  const loadEnv = async () => {
    try {
      await loadFromS3()
    } catch (error) {
      console.error('Failed to load envs from s3', (error as Error).message)
    }
  }

  return {
    get,
    getOrThrow,
    loadFromS3,
    set,
    injectDependencies,
    loadSecureEnvsFromSSM,
    loadEnv,
  }
}
