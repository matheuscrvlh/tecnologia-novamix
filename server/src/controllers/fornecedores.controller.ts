import type { FastifyRequest, FastifyReply } from 'fastify'
import { checkPermission } from '../middlewares/auth.middlewares'
import { connHub } from '../database/hub.database'

interface FornecedorBody {
    empresa?: string
    cnpj?: string | null
    endereco?: string | null
    cep?: string | null
    status?: boolean
}

export async function getFornecedores(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const conn = await connHub()
    try {
        const { rows } = await conn.query('SELECT * FROM tecnologia.fornecedores ORDER BY empresa')
        res.send(rows)
    } finally {
        conn.release()
    }
}

export async function createFornecedor(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const body = req.body as FornecedorBody
    if (!body.empresa) {
        res.code(400).send({ error: 'Campo obrigatório faltando: empresa' })
        return
    }

    const cnpj = body.cnpj ? body.cnpj.replace(/\D/g, '') : null
    if (cnpj && cnpj.length !== 14) {
        res.code(400).send({ error: 'CNPJ deve conter 14 dígitos.' })
        return
    }

    const conn = await connHub()
    try {
        const { rows } = await conn.query(
            `INSERT INTO tecnologia.fornecedores (empresa, cnpj, endereco, cep, status)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [body.empresa, cnpj, body.endereco ?? null, body.cep ?? null, body.status ?? true]
        )
        res.code(201).send(rows[0])
    } catch (error: any) {
        if (error?.code === '23514') {
            res.code(400).send({ error: 'CNPJ inválido.' })
            return
        }
        throw error
    } finally {
        conn.release()
    }
}
