import type { FastifyRequest, FastifyReply } from 'fastify'
import { checkPermission } from '../middlewares/auth.middlewares'
import { connHub } from '../database/hub.database'
import { encrypt, decrypt } from '../utils/crypto'

interface AcessoBody {
    system_id?: number
    user_login?: string
    user_password?: string | null
}

export async function getAcessosUsuario(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const { id } = req.params as { id: string }

    const conn = await connHub()
    try {
        const { rows } = await conn.query(
            `SELECT us.system_id, s.name AS system_name, s.link AS system_link,
                    us.user_login, us.user_password, us.updated_at
             FROM public.users_systems us
             JOIN public.systems s ON s.id = us.system_id
             WHERE us.user_id = $1
             ORDER BY s.name`,
            [id]
        )

        const acessos = rows.map((row) => {
            let senha: string | null = null
            if (row.user_password) {
                try {
                    senha = decrypt(row.user_password)
                } catch {
                    senha = null
                }
            }

            return {
                system_id: row.system_id,
                system_name: row.system_name,
                system_link: row.system_link,
                user_login: row.user_login,
                user_password: senha,
                updated_at: row.updated_at,
            }
        })

        res.send(acessos)
    } finally {
        conn.release()
    }
}

export async function salvarAcesso(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const { id } = req.params as { id: string }
    const body = req.body as AcessoBody

    if (!body.system_id || !body.user_login) {
        res.code(400).send({ error: 'Campos obrigatórios faltando: system_id, user_login' })
        return
    }

    const senhaCifrada = body.user_password ? encrypt(body.user_password) : null

    const conn = await connHub()
    try {
        await conn.query(
            `INSERT INTO public.users_systems (user_id, system_id, user_login, user_password, updated_at)
             VALUES ($1, $2, $3, $4, now())
             ON CONFLICT (user_id, system_id)
             DO UPDATE SET user_login = $3, user_password = $4, updated_at = now()`,
            [id, body.system_id, body.user_login, senhaCifrada]
        )
        res.code(204).send()
    } finally {
        conn.release()
    }
}

export async function excluirAcesso(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const { id, systemId } = req.params as { id: string; systemId: string }

    const conn = await connHub()
    try {
        await conn.query('DELETE FROM public.users_systems WHERE user_id = $1 AND system_id = $2', [id, systemId])
        res.code(204).send()
    } finally {
        conn.release()
    }
}
