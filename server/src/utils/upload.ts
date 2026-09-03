import { randomUUID } from 'crypto'
import { createWriteStream } from 'fs'
import { mkdir, unlink } from 'fs/promises'
import path from 'path'
import { pipeline } from 'stream/promises'
import type { FastifyRequest, FastifyReply } from 'fastify'

export const UPLOADS_ROOT = path.resolve(process.cwd(), 'uploads')

const EXTENSOES_PERMITIDAS = new Set([
    '.pdf',
    '.jpg',
    '.jpeg',
    '.png',
    '.heic',
    '.heif',
    '.webp',
    '.doc',
    '.docx',
])

// Fotos tiradas direto pela câmera do celular costumam vir com um nome de
// arquivo genérico (ou sem extensão reconhecida) — nesse caso usamos o
// mimetype informado pelo navegador, que é sempre confiável.
const EXTENSAO_POR_MIMETYPE: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/heic': '.heic',
    'image/heif': '.heif',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
}

const TAMANHO_MAXIMO_BYTES = 25 * 1024 * 1024

export interface ArquivoSalvo {
    nomeOriginal: string
    nomeArquivo: string
    caminhoRelativo: string
    mimetype: string
}

export async function salvarArquivoUpload(req: FastifyRequest, pasta: string): Promise<ArquivoSalvo> {
    const part = await req.file({ limits: { fileSize: TAMANHO_MAXIMO_BYTES } })

    if (!part) {
        throw { statusCode: 400, message: 'Nenhum arquivo enviado.' }
    }

    const extensaoDoNome = path.extname(part.filename ?? '').toLowerCase()
    const extensao = EXTENSOES_PERMITIDAS.has(extensaoDoNome)
        ? extensaoDoNome
        : EXTENSAO_POR_MIMETYPE[part.mimetype?.toLowerCase()]

    if (!extensao) {
        throw { statusCode: 400, message: 'Tipo de arquivo não permitido. Use PDF, imagem (inclusive HEIC) ou documento do Word.' }
    }

    const destinoDir = path.join(UPLOADS_ROOT, pasta)
    await mkdir(destinoDir, { recursive: true })

    const nomeArquivo = `${randomUUID()}${extensao}`
    const caminhoAbsoluto = path.join(destinoDir, nomeArquivo)

    try {
        await pipeline(part.file, createWriteStream(caminhoAbsoluto))
    } catch {
        throw { statusCode: 400, message: 'Erro ao salvar o arquivo. Verifique o tamanho (máx. 25MB).' }
    }

    if (part.file.truncated) {
        await unlink(caminhoAbsoluto).catch(() => {})
        throw { statusCode: 400, message: 'Arquivo excede o tamanho máximo de 25MB.' }
    }

    return {
        nomeOriginal: part.filename,
        nomeArquivo,
        caminhoRelativo: path.posix.join(pasta, nomeArquivo),
        mimetype: part.mimetype,
    }
}

export async function removerArquivo(caminhoRelativo: string | null | undefined) {
    if (!caminhoRelativo) return
    const caminhoAbsoluto = path.join(UPLOADS_ROOT, caminhoRelativo)
    await unlink(caminhoAbsoluto).catch(() => {})
}

export async function enviarArquivo(
    res: FastifyReply,
    caminhoRelativo: string,
    nomeOriginal: string,
    mimetype: string,
    baixar: boolean
) {
    const caminhoAbsoluto = path.join(UPLOADS_ROOT, caminhoRelativo)
    const disposicao = baixar ? 'attachment' : 'inline'

    res.header('Content-Disposition', `${disposicao}; filename="${encodeURIComponent(nomeOriginal)}"`)
    res.type(mimetype)

    const { createReadStream } = await import('fs')
    return res.send(createReadStream(caminhoAbsoluto))
}
