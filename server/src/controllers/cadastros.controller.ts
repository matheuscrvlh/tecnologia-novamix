import type { FastifyRequest, FastifyReply } from 'fastify'
import { checkPermission } from '../middlewares/auth.middlewares'
import { connHub } from '../database/hub.database'

interface CadastroBody {
    nome?: string
    status?: boolean
}

export function criarCrudCadastro(tabela: string, entidadeLabel: string) {
    async function listar(req: FastifyRequest, res: FastifyReply) {
        const permission = await checkPermission(req, res)
        if (!permission) return

        const conn = await connHub()
        try {
            const { rows } = await conn.query(`SELECT * FROM tecnologia.${tabela} ORDER BY nome`)
            res.send(rows)
        } finally {
            conn.release()
        }
    }

    async function criar(req: FastifyRequest, res: FastifyReply) {
        const permission = await checkPermission(req, res)
        if (!permission) return

        const body = req.body as CadastroBody
        if (!body.nome?.trim()) {
            res.code(400).send({ error: 'Campo obrigatório faltando: nome' })
            return
        }

        const conn = await connHub()
        try {
            const { rows } = await conn.query(
                `INSERT INTO tecnologia.${tabela} (nome, status) VALUES ($1, $2) RETURNING *`,
                [body.nome.trim(), body.status ?? true]
            )
            res.code(201).send(rows[0])
        } catch (error: any) {
            if (error?.code === '23505') {
                res.code(400).send({ error: `${entidadeLabel} já cadastrado(a).` })
                return
            }
            throw error
        } finally {
            conn.release()
        }
    }

    async function atualizar(req: FastifyRequest, res: FastifyReply) {
        const permission = await checkPermission(req, res)
        if (!permission) return

        const { id } = req.params as { id: string }
        const body = req.body as CadastroBody
        if (!body.nome?.trim()) {
            res.code(400).send({ error: 'Campo obrigatório faltando: nome' })
            return
        }

        const conn = await connHub()
        try {
            const { rows } = await conn.query(
                `UPDATE tecnologia.${tabela} SET nome = $1, status = $2 WHERE id = $3 RETURNING *`,
                [body.nome.trim(), body.status ?? true, id]
            )

            if (rows.length === 0) {
                res.code(404).send({ error: `${entidadeLabel} não encontrado(a).` })
                return
            }

            res.send(rows[0])
        } catch (error: any) {
            if (error?.code === '23505') {
                res.code(400).send({ error: `${entidadeLabel} já cadastrado(a).` })
                return
            }
            throw error
        } finally {
            conn.release()
        }
    }

    async function excluir(req: FastifyRequest, res: FastifyReply) {
        const permission = await checkPermission(req, res)
        if (!permission) return

        const { id } = req.params as { id: string }

        const conn = await connHub()
        try {
            await conn.query(`DELETE FROM tecnologia.${tabela} WHERE id = $1`, [id])
            res.code(204).send()
        } catch (error: any) {
            if (error?.code === '23503') {
                res.code(400).send({ error: `Não é possível excluir: ${entidadeLabel} está em uso.` })
                return
            }
            throw error
        } finally {
            conn.release()
        }
    }

    return { listar, criar, atualizar, excluir }
}
