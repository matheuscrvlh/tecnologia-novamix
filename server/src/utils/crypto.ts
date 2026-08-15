import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

function getKey(): Buffer {
    if (!process.env.ENCRYPTION_KEY) {
        throw new Error('ENCRYPTION_KEY não encontrada no .env.')
    }
    return crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY).digest()
}

export function decrypt(dados: Buffer): string {
    const iv = dados.subarray(0, IV_LENGTH)
    const authTag = dados.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
    const cifrado = dados.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv)
    decipher.setAuthTag(authTag)
    return Buffer.concat([decipher.update(cifrado), decipher.final()]).toString('utf8')
}
