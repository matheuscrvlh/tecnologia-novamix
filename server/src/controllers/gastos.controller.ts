import type { FastifyRequest, FastifyReply } from 'fastify'
import { checkPermission } from '../middlewares/auth.middlewares'
import { connHub } from '../database/hub.database'

interface GastoBody {
    user_id?: number | null
    fornecedor_id?: number
    loja_id?: number
    patrimonio?: number | null
    tipo?: string
    obs?: string | null
    area?: string
    valor?: number
    pagamento?: string
    liberacao?: string
}

const CAMPOS_OBRIGATORIOS = ['fornecedor_id', 'loja_id', 'tipo', 'area', 'valor', 'pagamento', 'liberacao'] as const

function validarCampos(body: GastoBody, res: FastifyReply) {
    const faltando = CAMPOS_OBRIGATORIOS.filter(
        (campo) => body[campo] === undefined || body[campo] === null || body[campo] === ''
    )

    if (faltando.length > 0) {
        res.code(400).send({ error: `Campos obrigatórios faltando: ${faltando.join(', ')}` })
        return false
    }

    return true
}

const SELECT_COM_RELACOES = `
    SELECT g.*, f.empresa AS fornecedor_nome, b.name AS loja_nome, u.name AS usuario_nome
    FROM tecnologia.gastos g
    LEFT JOIN tecnologia.fornecedores f ON f.id = g.fornecedor_id
    LEFT JOIN public.branchs b ON b.id = g.loja_id
    LEFT JOIN public.users u ON u.id = g.user_id
`

export async function getGastos(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const conn = await connHub()
    try {
        const { rows } = await conn.query(`${SELECT_COM_RELACOES} ORDER BY g.id DESC`)
        res.send(rows)
    } finally {
        conn.release()
    }
}

export async function createGasto(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const body = req.body as GastoBody
    if (!validarCampos(body, res)) return

    const conn = await connHub()
    try {
        const { rows } = await conn.query(
            `INSERT INTO tecnologia.gastos
                (user_id, fornecedor_id, loja_id, patrimonio, tipo, obs, area, valor, pagamento, liberacao)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING id`,
            [
                body.user_id ?? null,
                body.fornecedor_id,
                body.loja_id,
                body.patrimonio ?? null,
                body.tipo,
                body.obs ?? null,
                body.area,
                body.valor,
                body.pagamento,
                body.liberacao,
            ]
        )

        const { rows: criado } = await conn.query(`${SELECT_COM_RELACOES} WHERE g.id = $1`, [rows[0].id])
        res.code(201).send(criado[0])
    } finally {
        conn.release()
    }
}

export async function updateGasto(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const { id } = req.params as { id: string }
    const body = req.body as GastoBody
    if (!validarCampos(body, res)) return

    const conn = await connHub()
    try {
        const { rows } = await conn.query(
            `UPDATE tecnologia.gastos
             SET user_id = $1, fornecedor_id = $2, loja_id = $3, patrimonio = $4, tipo = $5,
                 obs = $6, area = $7, valor = $8, pagamento = $9, liberacao = $10
             WHERE id = $11
             RETURNING id`,
            [
                body.user_id ?? null,
                body.fornecedor_id,
                body.loja_id,
                body.patrimonio ?? null,
                body.tipo,
                body.obs ?? null,
                body.area,
                body.valor,
                body.pagamento,
                body.liberacao,
                id,
            ]
        )

        if (rows.length === 0) {
            res.code(404).send({ error: 'Gasto não encontrado.' })
            return
        }

        const { rows: atualizado } = await conn.query(`${SELECT_COM_RELACOES} WHERE g.id = $1`, [id])
        res.send(atualizado[0])
    } finally {
        conn.release()
    }
}

export async function deleteGasto(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const { id } = req.params as { id: string }

    const conn = await connHub()
    try {
        await conn.query('DELETE FROM tecnologia.gastos WHERE id = $1', [id])
        res.code(204).send()
    } finally {
        conn.release()
    }
}
