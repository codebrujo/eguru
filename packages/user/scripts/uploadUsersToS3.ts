// cd packages/user
// npm run upload-users-to-s3
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { config } from 'dotenv'
import { createCryptoService } from '@eguru/crypto'
import { createS3Service, type S3Service } from '@eguru/s3'
import { createSSMService } from '@eguru/ssm'
import { createEnvService } from '@eguru/env'
import { CryptoService } from '@eguru/types'

const loadEnvs = (): void => {
  const envPath = resolve(process.cwd(), 'scripts/data/.env')

  if (existsSync(envPath)) {
    config({ path: envPath, quiet: true })
  }
}

const main = async (
  s3: S3Service,
  crypto: CryptoService,
  fileData: string,
  name: string,
) => {
  const data = crypto.encrypt(fileData)
  await s3.put(name, data)
  const res = await s3.get(name)
  const decrypted = crypto.decrypt(res)
  const parsed = JSON.parse(decrypted)
  console.log(parsed)
}

;(async () => {
  const FILE_TO_PUT_DEV = resolve(process.cwd(), 'scripts/data/users_development.json')
  const FILE_TO_PUT_PROD = resolve(process.cwd(), 'scripts/data/users_production.json')
  const s3name = 'users'

  try {
    loadEnvs()
    const env = createEnvService()
    const s3 = createS3Service({
      accessKeyId: env.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: env.get('AWS_SECRET_ACCESS_KEY'),
      AWSRegion: env.get('AWS_REGION'),
      bucket: env.get('AWS_S3_BUCKET'),
    })
    const ssm = createSSMService({
      accessKeyId: env.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: env.get('AWS_SECRET_ACCESS_KEY'),
      AWSRegion: env.get('AWS_REGION'),
    })

    if (!existsSync(FILE_TO_PUT_DEV)) throw new Error('dev file not found')
    const secretDev = await ssm.get(env.get('CRYPTO_SECRET_PATH_DEV'))
    const cryptoDev = createCryptoService(secretDev)
    const fileDataDev = readFileSync(FILE_TO_PUT_DEV, 'utf8')
    await main(s3, cryptoDev, fileDataDev, `development/${s3name}`)

    if (!existsSync(FILE_TO_PUT_PROD)) throw new Error('prod file not found')
    const secretProd = await ssm.get(env.get('CRYPTO_SECRET_PATH_PROD'))
    const cryptoProd = createCryptoService(secretProd)
    const fileDataProd = readFileSync(FILE_TO_PUT_PROD, 'utf8')
    await main(s3, cryptoProd, fileDataProd, `production/${s3name}`)

    console.log('✅ Done')
  } catch (error) {
    console.log('❌ Error', error)
  }
})()
