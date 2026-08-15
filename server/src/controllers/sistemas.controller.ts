import type { FastifyRequest, FastifyReply } from 'fastify'
import { checkPermission } from '../middlewares/auth.middlewares'
import { connHub } from '../database/hub.database'

interface SistemaBody {
    name?: string
    link?: string | null
    status?: boolean
}

export async function getSistemas(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const conn = await connHub()
    try {
        const { rows } = await conn.query('SELECT id, name, link, status FROM public.systems ORDER BY name')
        res.send(rows)
    } finally {
        conn.release()
    }
}

export async function createSistema(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const body = req.body as SistemaBody
    if (!body.name) {
        res.code(400).send({ error: 'Campo obrigatório faltando: name' })
        return
    }

    const conn = await connHub()
    try {
        const { rows } = await conn.query(
            `INSERT INTO public.systems (name, link, status)
             VALUES ($1, $2, $3)
             RETURNING id, name, link, status`,
            [body.name, body.link ?? null, body.status ?? true]
        )
        res.code(201).send(rows[0])
    } finally {
        conn.release()
    }
}
