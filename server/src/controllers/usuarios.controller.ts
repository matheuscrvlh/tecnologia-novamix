import type { FastifyRequest, FastifyReply } from 'fastify'
import { checkPermission } from '../middlewares/auth.middlewares'
import { connHub } from '../database/hub.database'

export async function getUsuarios(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const conn = await connHub()
    try {
        const { rows } = await conn.query(`
            SELECT u.id, u.name, u.login, u.role, u.status, u.created_at,
                   u.telephone, u.last_login, u.sector_id, s.name AS sector_name
            FROM public.users u
            LEFT JOIN public.sectors s ON s.id = u.sector_id
            ORDER BY u.name
        `)
        res.send(rows)
    } finally {
        conn.release()
    }
}
