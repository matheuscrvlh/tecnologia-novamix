import type { FastifyRequest, FastifyReply } from 'fastify'
import { checkPermission } from '../middlewares/auth.middlewares'
import { connHub } from '../database/hub.database'

const TIPOS_VALIDOS = ['Manutenção', 'Compra'] as const

interface GastoBody {
    fornecedor_id?: number
    filial_id?: number
    patrimonio?: number | null
    tipo?: string
    obs?: string | null
    area_id?: number
    valor?: number
    pagamento?: string
    liberacao?: number
    data_gasto?: string
}

const CAMPOS_OBRIGATORIOS = ['fornecedor_id', 'filial_id', 'tipo', 'area_id', 'valor', 'pagamento', 'liberacao'] as const

function validarCampos(body: GastoBody, res: FastifyReply) {
    const faltando = CAMPOS_OBRIGATORIOS.filter(
        (campo) => body[campo] === undefined || body[campo] === null || body[campo] === ''
    )

    if (faltando.length > 0) {
        res.code(400).send({ error: `Campos obrigatórios faltando: ${faltando.join(', ')}` })
        return false
    }

    if (!TIPOS_VALIDOS.includes(body.tipo as (typeof TIPOS_VALIDOS)[number])) {
        res.code(400).send({ error: `Tipo deve ser um dos seguintes: ${TIPOS_VALIDOS.join(', ')}` })
        return false
    }

    return true
}

const SELECT_COM_RELACOES = `
    SELECT g.*, f.empresa AS fornecedor_nome, b.name AS loja_nome, u.name AS usuario_nome,
           l.name AS liberacao_nome, a.nome AS area_nome
    FROM tecnologia.gastos g
    LEFT JOIN tecnologia.fornecedores f ON f.id = g.fornecedor_id
    LEFT JOIN public.branchs b ON b.id = g.filial_id
    LEFT JOIN public.users u ON u.id = g.user_hub_id
    LEFT JOIN public.users l ON l.id = g.liberacao
    LEFT JOIN tecnologia.areas a ON a.id = g.area_id
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
                (user_hub_id, fornecedor_id, filial_id, patrimonio, tipo, obs, area_id, valor, pagamento, liberacao, data_gasto)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, COALESCE($11, CURRENT_DATE))
             RETURNING id`,
            [
                req.user.sub,
                body.fornecedor_id,
                body.filial_id,
                body.patrimonio ?? null,
                body.tipo,
                body.obs ?? null,
                body.area_id,
                body.valor,
                body.pagamento,
                body.liberacao,
                body.data_gasto ?? null,
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
             SET fornecedor_id = $1, filial_id = $2, patrimonio = $3, tipo = $4,
                 obs = $5, area_id = $6, valor = $7, pagamento = $8, liberacao = $9,
                 data_gasto = COALESCE($10, data_gasto)
             WHERE id = $11
             RETURNING id`,
            [
                body.fornecedor_id,
                body.filial_id,
                body.patrimonio ?? null,
                body.tipo,
                body.obs ?? null,
                body.area_id,
                body.valor,
                body.pagamento,
                body.liberacao,
                body.data_gasto ?? null,
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
