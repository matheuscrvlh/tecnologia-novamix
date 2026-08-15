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
}

export interface Equipamento {
    id: number
    patrimonio: number
    loja: string
    local: string
    equipamento: string
    marca: string
    modelo: string
    ip: string | null
    status: boolean
    verificar: boolean
    criado_em: string
}

export type EquipamentoInput = Omit<Equipamento, 'id' | 'criado_em'>

export interface EquipamentoPessoal {
    id: number
    patrimonio: number
    loja: string
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

export type EquipamentoPessoalInput = Omit<EquipamentoPessoal, 'id' | 'usuario_nome'>

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

export type FornecedorInput = Omit<Fornecedor, 'id'>

export interface Gasto {
    id: number
    user_id: number | null
    fornecedor_id: number
    loja_id: number
    patrimonio: number | null
    tipo: string
    obs: string | null
    area: string
    valor: string
    pagamento: string
    liberacao: string
    fornecedor_nome: string | null
    loja_nome: string | null
    usuario_nome: string | null
}

export type GastoInput = Omit<Gasto, 'id' | 'fornecedor_nome' | 'loja_nome' | 'usuario_nome'>
