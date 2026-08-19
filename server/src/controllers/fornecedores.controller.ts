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

function validarCorpo(body: FornecedorBody, res: FastifyReply) {
    if (!body.empresa?.trim()) {
        res.code(400).send({ error: 'Campo obrigatório faltando: empresa' })
        return null
    }

    const cnpj = body.cnpj ? body.cnpj.replace(/\D/g, '') : null
    if (cnpj && cnpj.length !== 14) {
        res.code(400).send({ error: 'CNPJ deve conter 14 dígitos.' })
        return null
    }

    const cep = body.cep ? body.cep.replace(/\D/g, '') : null
    if (cep && cep.length !== 8) {
        res.code(400).send({ error: 'CEP deve conter 8 dígitos.' })
        return null
    }

    return { empresa: body.empresa.trim(), cnpj, endereco: body.endereco?.trim() || null, cep, status: body.status ?? true }
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

    const dados = validarCorpo(req.body as FornecedorBody, res)
    if (!dados) return

    const conn = await connHub()
    try {
        const { rows } = await conn.query(
            `INSERT INTO tecnologia.fornecedores (empresa, cnpj, endereco, cep, status)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [dados.empresa, dados.cnpj, dados.endereco, dados.cep, dados.status]
        )
        res.code(201).send(rows[0])
    } catch (error: any) {
        if (error?.code === '23514') {
            res.code(400).send({ error: 'CNPJ ou CEP inválido.' })
            return
        }
        if (error?.code === '23505') {
            res.code(400).send({ error: 'Fornecedor já cadastrado.' })
            return
        }
        res.code(400).send({ error: 'Não foi possível salvar o fornecedor. Confira os dados informados.' })
    } finally {
        conn.release()
    }
}

export async function updateFornecedor(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const { id } = req.params as { id: string }
    const dados = validarCorpo(req.body as FornecedorBody, res)
    if (!dados) return

    const conn = await connHub()
    try {
        const { rows } = await conn.query(
            `UPDATE tecnologia.fornecedores
             SET empresa = $1, cnpj = $2, endereco = $3, cep = $4, status = $5
             WHERE id = $6
             RETURNING *`,
            [dados.empresa, dados.cnpj, dados.endereco, dados.cep, dados.status, id]
        )

        if (rows.length === 0) {
            res.code(404).send({ error: 'Fornecedor não encontrado.' })
            return
        }

        res.send(rows[0])
    } catch (error: any) {
        if (error?.code === '23514') {
            res.code(400).send({ error: 'CNPJ ou CEP inválido.' })
            return
        }
        if (error?.code === '23505') {
            res.code(400).send({ error: 'Fornecedor já cadastrado.' })
            return
        }
        res.code(400).send({ error: 'Não foi possível salvar o fornecedor. Confira os dados informados.' })
    } finally {
        conn.release()
    }
}

export async function deleteFornecedor(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const { id } = req.params as { id: string }

    const conn = await connHub()
    try {
        await conn.query('DELETE FROM tecnologia.fornecedores WHERE id = $1', [id])
        res.code(204).send()
    } catch (error: any) {
        if (error?.code === '23503') {
            res.code(400).send({ error: 'Não é possível excluir: fornecedor está em uso.' })
            return
        }
        res.code(400).send({ error: 'Não foi possível excluir o fornecedor.' })
    } finally {
        conn.release()
    }
}
