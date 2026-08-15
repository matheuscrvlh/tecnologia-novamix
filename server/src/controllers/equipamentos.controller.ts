import type { FastifyRequest, FastifyReply } from 'fastify'
import { checkPermission } from '../middlewares/auth.middlewares'
import { connHub } from '../database/hub.database'

interface EquipamentoBody {
    patrimonio?: number
    filial_id?: number
    local?: string
    equipamento?: string
    marca?: string
    modelo?: string
    ip?: string | null
    status?: boolean
    verificar?: boolean
}

const CAMPOS_OBRIGATORIOS = ['patrimonio', 'filial_id', 'local', 'equipamento', 'marca', 'modelo'] as const

function validarCampos(body: EquipamentoBody, res: FastifyReply) {
    const faltando = CAMPOS_OBRIGATORIOS.filter(
        (campo) => body[campo] === undefined || body[campo] === null || body[campo] === ''
    )

    if (faltando.length > 0) {
        res.code(400).send({ error: `Campos obrigatórios faltando: ${faltando.join(', ')}` })
        return false
    }

    return true
}

const SELECT_COM_FILIAL = `
    SELECT e.*, b.name AS loja_nome
    FROM tecnologia.equipamentos e
    LEFT JOIN public.branchs b ON b.id = e.filial_id
`

export async function getEquipamentos(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const conn = await connHub()
    try {
        const { rows } = await conn.query(`${SELECT_COM_FILIAL} ORDER BY e.id DESC`)
        res.send(rows)
    } finally {
        conn.release()
    }
}

export async function createEquipamento(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const body = req.body as EquipamentoBody
    if (!validarCampos(body, res)) return

    const conn = await connHub()
    try {
        const { rows } = await conn.query(
            `INSERT INTO tecnologia.equipamentos (patrimonio, filial_id, local, equipamento, marca, modelo, ip, status, verificar)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING id`,
            [
                body.patrimonio,
                body.filial_id,
                body.local,
                body.equipamento,
                body.marca,
                body.modelo,
                body.ip ?? null,
                body.status ?? true,
                body.verificar ?? false,
            ]
        )

        const { rows: criado } = await conn.query(`${SELECT_COM_FILIAL} WHERE e.id = $1`, [rows[0].id])
        res.code(201).send(criado[0])
    } finally {
        conn.release()
    }
}

export async function updateEquipamento(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const { id } = req.params as { id: string }
    const body = req.body as EquipamentoBody
    if (!validarCampos(body, res)) return

    const conn = await connHub()
    try {
        const { rows } = await conn.query(
            `UPDATE tecnologia.equipamentos
             SET patrimonio = $1, filial_id = $2, local = $3, equipamento = $4, marca = $5,
                 modelo = $6, ip = $7, status = $8, verificar = $9
             WHERE id = $10
             RETURNING id`,
            [
                body.patrimonio,
                body.filial_id,
                body.local,
                body.equipamento,
                body.marca,
                body.modelo,
                body.ip ?? null,
                body.status ?? true,
                body.verificar ?? false,
                id,
            ]
        )

        if (rows.length === 0) {
            res.code(404).send({ error: 'Equipamento não encontrado.' })
            return
        }

        const { rows: atualizado } = await conn.query(`${SELECT_COM_FILIAL} WHERE e.id = $1`, [id])
        res.send(atualizado[0])
    } finally {
        conn.release()
    }
}

export async function deleteEquipamento(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const { id } = req.params as { id: string }

    const conn = await connHub()
    try {
        await conn.query('DELETE FROM tecnologia.equipamentos WHERE id = $1', [id])
        res.code(204).send()
    } finally {
        conn.release()
    }
}
