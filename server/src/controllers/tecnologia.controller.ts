import type { FastifyRequest, FastifyReply } from 'fastify'
import { checkBranch, checkPermission } from '../middlewares/auth.middlewares'

const ADMIN_ACCESS = 'admin'

export async function getMe(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const branches = await checkBranch(req, res)
    if (!branches) return

    res.send({ permission, branches, isAdmin: permission === ADMIN_ACCESS })
}
