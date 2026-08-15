import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

function getKey(): Buffer {
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
    if (key.length !== 32) {
        throw new Error('ENCRYPTION_KEY deve ter 32 bytes (64 caracteres hexadecimais).')
    }
    return key
}

export function encrypt(texto: string): Buffer {
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)
    const cifrado = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()])
    return Buffer.concat([iv, cipher.getAuthTag(), cifrado])
}

export function decrypt(dados: Buffer): string {
    const iv = dados.subarray(0, IV_LENGTH)
    const authTag = dados.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
    const cifrado = dados.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv)
    decipher.setAuthTag(authTag)
    return Buffer.concat([decipher.update(cifrado), decipher.final()]).toString('utf8')
}
