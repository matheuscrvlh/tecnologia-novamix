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

export interface Equipamento {
    id: number
    patrimonio: number
    filial_id: number
    loja_nome: string | null
    local: string
    equipamento: string
    marca: string
    modelo: string
    ip: string | null
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
    area: string
    valor: string
    pagamento: string
    liberacao: string
    data_gasto: string
    fornecedor_nome: string | null
    loja_nome: string | null
    usuario_nome: string | null
}
