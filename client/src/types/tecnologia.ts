export interface MeInfo {
    permission: string
    branches: number[]
    isAdmin: boolean
}

export interface UsuarioHub {
    id: number
    name: string
    login: string
    role: string
    status: boolean
    created_at: string
    telephone: string | null
    last_login: string | null
    sector_id: number | null
    sector_name: string | null
}

export interface AcessoUsuario {
    system_id: number
    system_name: string
    system_link: string | null
    user_login: string
    user_password: string | null
    updated_at: string
}

export interface CadastroSimples {
    id: number
    nome: string
    status: boolean
}

export type Local = CadastroSimples
export type TipoEquipamento = CadastroSimples
export type Marca = CadastroSimples
export type Modelo = CadastroSimples
export type Area = CadastroSimples

export interface Equipamento {
    id: number
    patrimonio: number | null
    filial_id: number
    loja_nome: string | null
    local_id: number
    local_nome: string | null
    equipamento_id: number
    equipamento_nome: string | null
    marca_id: number
    marca_nome: string | null
    modelo_id: number
    modelo_nome: string | null
    ip: string | null
    codigo_aparelho: string | null
    observacao: string | null
    terceirizado: boolean
    status: boolean
    verificar: boolean
    criado_em: string
}

export interface EquipamentoPessoal {
    id: number
    patrimonio: number
    filial_id: number
    loja_nome: string | null
    tipo: string
    marca: string
    modelo: string
    user_hub_id: number
    usuario_nome: string | null
    telefone: string | null
    avarias: boolean
    avarias_obs: string | null
    status: boolean
    termo: boolean
    data_recebimento: string | null
    data_devolucao: string | null
    termo_recebimento_nome: string | null
    termo_recebimento_mimetype: string | null
    termo_recebimento_enviado_em: string | null
    termo_devolucao_nome: string | null
    termo_devolucao_mimetype: string | null
    termo_devolucao_enviado_em: string | null
}

export interface Loja {
    id: number
    name: string
    status: boolean
}

export interface Fornecedor {
    id: number
    empresa: string
    cnpj: string | null
    endereco: string | null
    cep: string | null
    status: boolean
}

export interface Gasto {
    id: number
    user_hub_id: number | null
    fornecedor_id: number
    filial_id: number
    patrimonio: number | null
    tipo: string
    obs: string | null
    area_id: number
    area_nome: string | null
    valor: string
    pagamento: string
    liberacao: number
    data_gasto: string
    fornecedor_nome: string | null
    loja_nome: string | null
    usuario_nome: string | null
    liberacao_nome: string | null
    arquivo_nome: string | null
    arquivo_mimetype: string | null
    arquivo_enviado_em: string | null
}

export interface Contrato {
    id: number
    filial_id: number
    fornecedor_id: number
    area_id: number
    data_contrato: string
    obs: string | null
    tipo_cobranca: string
    valor: string
    status: boolean
    fornecedor_nome: string | null
    loja_nome: string | null
    area_nome: string | null
    arquivo_nome: string | null
    arquivo_mimetype: string | null
    arquivo_enviado_em: string | null
}
