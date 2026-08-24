import type { FastifyRequest, FastifyReply } from 'fastify'
import { checkPermission } from '../middlewares/auth.middlewares'
import { connHub } from '../database/hub.database'
import { salvarArquivoUpload, removerArquivo, enviarArquivo } from '../utils/upload'

const TIPOS_COBRANCA_VALIDOS = ['Mensal', 'Anual', 'Único'] as const

interface ContratoBody {
    filial_id?: number
    fornecedor_id?: number
    area_id?: number
    data_contrato?: string
    obs?: string | null
    tipo_cobranca?: string
    valor?: number
    status?: boolean
}

const CAMPOS_OBRIGATORIOS = ['filial_id', 'fornecedor_id', 'area_id', 'tipo_cobranca', 'valor'] as const

function validarCampos(body: ContratoBody, res: FastifyReply) {
    const faltando = CAMPOS_OBRIGATORIOS.filter(
        (campo) => body[campo] === undefined || body[campo] === null || body[campo] === ''
    )

    if (faltando.length > 0) {
        res.code(400).send({ error: `Campos obrigatórios faltando: ${faltando.join(', ')}` })
        return false
    }

    if (!TIPOS_COBRANCA_VALIDOS.includes(body.tipo_cobranca as (typeof TIPOS_COBRANCA_VALIDOS)[number])) {
        res.code(400).send({ error: `Tipo de cobrança deve ser um dos seguintes: ${TIPOS_COBRANCA_VALIDOS.join(', ')}` })
        return false
    }

    return true
}

const SELECT_COM_RELACOES = `
    SELECT c.*, f.empresa AS fornecedor_nome, b.name AS loja_nome, a.nome AS area_nome
    FROM tecnologia.contratos c
    LEFT JOIN tecnologia.fornecedores f ON f.id = c.fornecedor_id
    LEFT JOIN public.branchs b ON b.id = c.filial_id
    LEFT JOIN tecnologia.areas a ON a.id = c.area_id
`

export async function getContratos(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const conn = await connHub()
    try {
        const { rows } = await conn.query(`${SELECT_COM_RELACOES} ORDER BY c.id DESC`)
        res.send(rows)
    } finally {
        conn.release()
    }
}

export async function createContrato(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const body = req.body as ContratoBody
    if (!validarCampos(body, res)) return

    const conn = await connHub()
    try {
        const { rows } = await conn.query(
            `INSERT INTO tecnologia.contratos
                (filial_id, fornecedor_id, area_id, data_contrato, obs, tipo_cobranca, valor, status)
             VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), $5, $6, $7, $8)
             RETURNING id`,
            [
                body.filial_id,
                body.fornecedor_id,
                body.area_id,
                body.data_contrato ?? null,
                body.obs ?? null,
                body.tipo_cobranca,
                body.valor,
                body.status ?? true,
            ]
        )

        const { rows: criado } = await conn.query(`${SELECT_COM_RELACOES} WHERE c.id = $1`, [rows[0].id])
        res.code(201).send(criado[0])
    } finally {
        conn.release()
    }
}

export async function updateContrato(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const { id } = req.params as { id: string }
    const body = req.body as ContratoBody
    if (!validarCampos(body, res)) return

    const conn = await connHub()
    try {
        const { rows } = await conn.query(
            `UPDATE tecnologia.contratos
             SET filial_id = $1, fornecedor_id = $2, area_id = $3, data_contrato = COALESCE($4, data_contrato),
                 obs = $5, tipo_cobranca = $6, valor = $7, status = $8
             WHERE id = $9
             RETURNING id`,
            [
                body.filial_id,
                body.fornecedor_id,
                body.area_id,
                body.data_contrato ?? null,
                body.obs ?? null,
                body.tipo_cobranca,
                body.valor,
                body.status ?? true,
                id,
            ]
        )

        if (rows.length === 0) {
            res.code(404).send({ error: 'Contrato não encontrado.' })
            return
        }

        const { rows: atualizado } = await conn.query(`${SELECT_COM_RELACOES} WHERE c.id = $1`, [id])
        res.send(atualizado[0])
    } finally {
        conn.release()
    }
}

export async function deleteContrato(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const { id } = req.params as { id: string }

    const conn = await connHub()
    try {
        await conn.query('DELETE FROM tecnologia.contratos WHERE id = $1', [id])
        res.code(204).send()
    } finally {
        conn.release()
    }
}

export async function uploadArquivoContrato(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const { id } = req.params as { id: string }

    const conn = await connHub()
    try {
        const { rows: existente } = await conn.query(
            'SELECT arquivo_caminho FROM tecnologia.contratos WHERE id = $1',
            [id]
        )
        if (existente.length === 0) {
            res.code(404).send({ error: 'Contrato não encontrado.' })
            return
        }

        let arquivo
        try {
            arquivo = await salvarArquivoUpload(req, 'contratos')
        } catch (err: any) {
            res.code(err.statusCode ?? 400).send({ error: err.message ?? 'Erro ao enviar arquivo.' })
            return
        }

        await removerArquivo(existente[0].arquivo_caminho)

        const { rows } = await conn.query(
            `UPDATE tecnologia.contratos
             SET arquivo_nome = $1, arquivo_caminho = $2, arquivo_mimetype = $3, arquivo_enviado_em = NOW()
             WHERE id = $4
             RETURNING id`,
            [arquivo.nomeOriginal, arquivo.caminhoRelativo, arquivo.mimetype, id]
        )

        const { rows: atualizado } = await conn.query(`${SELECT_COM_RELACOES} WHERE c.id = $1`, [rows[0].id])
        res.send(atualizado[0])
    } finally {
        conn.release()
    }
}

export async function getArquivoContrato(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const { id } = req.params as { id: string }
    const { baixar } = req.query as { baixar?: string }

    const conn = await connHub()
    try {
        const { rows } = await conn.query(
            'SELECT arquivo_nome, arquivo_caminho, arquivo_mimetype FROM tecnologia.contratos WHERE id = $1',
            [id]
        )

        if (rows.length === 0 || !rows[0].arquivo_caminho) {
            res.code(404).send({ error: 'Arquivo não encontrado.' })
            return
        }

        await enviarArquivo(res, rows[0].arquivo_caminho, rows[0].arquivo_nome, rows[0].arquivo_mimetype, baixar === '1')
    } finally {
        conn.release()
    }
}

export async function deleteArquivoContrato(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const { id } = req.params as { id: string }

    const conn = await connHub()
    try {
        const { rows: existente } = await conn.query(
            'SELECT arquivo_caminho FROM tecnologia.contratos WHERE id = $1',
            [id]
        )
        if (existente.length === 0) {
            res.code(404).send({ error: 'Contrato não encontrado.' })
            return
        }

        await removerArquivo(existente[0].arquivo_caminho)

        const { rows } = await conn.query(
            `UPDATE tecnologia.contratos
             SET arquivo_nome = NULL, arquivo_caminho = NULL, arquivo_mimetype = NULL, arquivo_enviado_em = NULL
             WHERE id = $1
             RETURNING id`,
            [id]
        )

        const { rows: atualizado } = await conn.query(`${SELECT_COM_RELACOES} WHERE c.id = $1`, [rows[0].id])
        res.send(atualizado[0])
    } finally {
        conn.release()
    }
}
