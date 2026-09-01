import type { FastifyRequest, FastifyReply } from 'fastify'
import { checkPermission } from '../middlewares/auth.middlewares'
import { connHub } from '../database/hub.database'

interface EquipamentoBody {
    patrimonio?: number
    filial_id?: number
    local_id?: number
    equipamento_id?: number
    marca_id?: number
    modelo_id?: number
    ip?: string | null
    codigo_aparelho?: string | null
    status?: boolean
    verificar?: boolean
}

const CAMPOS_OBRIGATORIOS = [
    'patrimonio',
    'filial_id',
    'local_id',
    'equipamento_id',
    'marca_id',
    'modelo_id',
] as const

function validarCampos(body: EquipamentoBody, res: FastifyReply) {
    const faltando = CAMPOS_OBRIGATORIOS.filter(
        (campo) => body[campo] === undefined || body[campo] === null || (body[campo] as unknown) === ''
    )

    if (faltando.length > 0) {
        res.code(400).send({ error: `Campos obrigatórios faltando: ${faltando.join(', ')}` })
        return false
    }

    return true
}

const SELECT_COM_FILIAL = `
    SELECT e.*, b.name AS loja_nome, l.nome AS local_nome, t.nome AS equipamento_nome,
           m.nome AS marca_nome, mo.nome AS modelo_nome
    FROM tecnologia.equipamentos e
    LEFT JOIN public.branchs b ON b.id = e.filial_id
    LEFT JOIN tecnologia.locais l ON l.id = e.local_id
    LEFT JOIN tecnologia.tipos_equipamento t ON t.id = e.equipamento_id
    LEFT JOIN tecnologia.marcas m ON m.id = e.marca_id
    LEFT JOIN tecnologia.modelos mo ON mo.id = e.modelo_id
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
            `INSERT INTO tecnologia.equipamentos (patrimonio, filial_id, local_id, equipamento_id, marca_id, modelo_id, ip, codigo_aparelho, status, verificar)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING id`,
            [
                body.patrimonio,
                body.filial_id,
                body.local_id,
                body.equipamento_id,
                body.marca_id,
                body.modelo_id,
                body.ip ?? null,
                body.codigo_aparelho ?? null,
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
             SET patrimonio = $1, filial_id = $2, local_id = $3, equipamento_id = $4, marca_id = $5,
                 modelo_id = $6, ip = $7, codigo_aparelho = $8, status = $9, verificar = $10
             WHERE id = $11
             RETURNING id`,
            [
                body.patrimonio,
                body.filial_id,
                body.local_id,
                body.equipamento_id,
                body.marca_id,
                body.modelo_id,
                body.ip ?? null,
                body.codigo_aparelho ?? null,
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
