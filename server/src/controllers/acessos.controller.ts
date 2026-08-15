import type { FastifyRequest, FastifyReply } from 'fastify'
import { checkPermission } from '../middlewares/auth.middlewares'
import { connHub } from '../database/hub.database'
import { decrypt } from '../utils/crypto'

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
