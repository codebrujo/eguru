import crypto from 'node:crypto'
import type { CryptoService } from '@eguru/types'

export const createCryptoService = (secret: string): CryptoService => {
  const algorithm = 'aes-256-cbc'
  const key = crypto.scryptSync(secret, 'salt', 32)

  const encode = (data: string): string => {
    const buff = Buffer.from(data, 'utf-8')
    return buff.toString('base64')
  }

  const decode = (data: string): string => {
    const buff = Buffer.from(data, 'base64')
    return buff.toString('utf-8')
  }

  const encrypt = (text: string): string => {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(algorithm, key, iv)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const encryptedText = `${iv.toString('hex')}:${encrypted}`
    return encode(encryptedText)
  }

  const decrypt = (text: string): string => {
    const decoded = decode(text)
    const parts = decoded.split(':')
    if (parts.length !== 2) throw new Error('Invalid encrypted data')
    const iv = Buffer.from(parts[0]!, 'hex')
    const encryptedData = parts[1]!
    const decipher = crypto.createDecipheriv(algorithm, key, iv)
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }

  return {
    encrypt,
    decrypt,
  }
}
