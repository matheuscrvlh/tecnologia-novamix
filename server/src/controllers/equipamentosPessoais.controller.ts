import type { FastifyRequest, FastifyReply } from 'fastify'
import { checkPermission } from '../middlewares/auth.middlewares'
import { connHub } from '../database/hub.database'

interface EquipamentoPessoalBody {
    patrimonio?: number
    filial_id?: number
    tipo?: string
    marca?: string
    modelo?: string
    user_hub_id?: number
    telefone?: string | null
    avarias?: boolean
    avarias_obs?: string | null
    status?: boolean
    termo?: boolean
    data_recebimento?: string | null
    data_devolucao?: string | null
}

const CAMPOS_OBRIGATORIOS = ['patrimonio', 'filial_id', 'tipo', 'marca', 'modelo', 'user_hub_id'] as const

function validarCampos(body: EquipamentoPessoalBody, res: FastifyReply) {
    const faltando = CAMPOS_OBRIGATORIOS.filter(
        (campo) => body[campo] === undefined || body[campo] === null || body[campo] === ''
    )

    if (faltando.length > 0) {
        res.code(400).send({ error: `Campos obrigatórios faltando: ${faltando.join(', ')}` })
        return false
    }

    return true
}

const SELECT_COM_USUARIO = `
    SELECT ep.*, u.name AS usuario_nome, b.name AS loja_nome
    FROM tecnologia.equipamentos_pessoais ep
    LEFT JOIN public.users u ON u.id = ep.user_hub_id
    LEFT JOIN public.branchs b ON b.id = ep.filial_id
`

export async function getEquipamentosPessoais(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const conn = await connHub()
    try {
        const { rows } = await conn.query(`${SELECT_COM_USUARIO} ORDER BY ep.id DESC`)
        res.send(rows)
    } finally {
        conn.release()
    }
}

export async function createEquipamentoPessoal(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const body = req.body as EquipamentoPessoalBody
    if (!validarCampos(body, res)) return

    const conn = await connHub()
    try {
        const { rows } = await conn.query(
            `INSERT INTO tecnologia.equipamentos_pessoais
                (patrimonio, filial_id, tipo, marca, modelo, user_hub_id, telefone, avarias, avarias_obs, status, termo, data_recebimento, data_devolucao)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             RETURNING id`,
            [
                body.patrimonio,
                body.filial_id,
                body.tipo,
                body.marca,
                body.modelo,
                body.user_hub_id,
                body.telefone ?? null,
                body.avarias ?? false,
                body.avarias_obs ?? null,
                body.status ?? true,
                body.termo ?? false,
                body.data_recebimento ?? null,
                body.data_devolucao ?? null,
            ]
        )

        const { rows: criado } = await conn.query(`${SELECT_COM_USUARIO} WHERE ep.id = $1`, [rows[0].id])
        res.code(201).send(criado[0])
    } finally {
        conn.release()
    }
}

export async function updateEquipamentoPessoal(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const { id } = req.params as { id: string }
    const body = req.body as EquipamentoPessoalBody
    if (!validarCampos(body, res)) return

    const conn = await connHub()
    try {
        const { rows } = await conn.query(
            `UPDATE tecnologia.equipamentos_pessoais
             SET patrimonio = $1, filial_id = $2, tipo = $3, marca = $4, modelo = $5, user_hub_id = $6,
                 telefone = $7, avarias = $8, avarias_obs = $9, status = $10, termo = $11,
                 data_recebimento = $12, data_devolucao = $13
             WHERE id = $14
             RETURNING id`,
            [
                body.patrimonio,
                body.filial_id,
                body.tipo,
                body.marca,
                body.modelo,
                body.user_hub_id,
                body.telefone ?? null,
                body.avarias ?? false,
                body.avarias_obs ?? null,
                body.status ?? true,
                body.termo ?? false,
                body.data_recebimento ?? null,
                body.data_devolucao ?? null,
                id,
            ]
        )

        if (rows.length === 0) {
            res.code(404).send({ error: 'Equipamento pessoal não encontrado.' })
            return
        }

        const { rows: atualizado } = await conn.query(`${SELECT_COM_USUARIO} WHERE ep.id = $1`, [id])
        res.send(atualizado[0])
    } finally {
        conn.release()
    }
}

export async function deleteEquipamentoPessoal(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const { id } = req.params as { id: string }

    const conn = await connHub()
    try {
        await conn.query('DELETE FROM tecnologia.equipamentos_pessoais WHERE id = $1', [id])
        res.code(204).send()
    } finally {
        conn.release()
    }
}
