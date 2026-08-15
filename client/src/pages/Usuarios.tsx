import { useState } from 'react'
import PageShell from '../components/PageShell'
import DataTable from '../components/DataTable'
import AcessosModal from '../components/AcessosModal'
import PillFilter from '../components/PillFilter'
import { inputClass } from '../components/Field'
import { useMe } from '../hooks/useMe'
import { useLista } from '../hooks/useLista'
import { formatDate } from '../lib/format'
import type { UsuarioHub } from '../types/tecnologia'

const STATUS_OPCOES = [
    { value: true, label: 'Ativo' },
    { value: false, label: 'Inativo' },
]

export default function Usuarios() {
    const { me, loading: loadingMe, error: meError } = useMe()
    const { rows, loading, erro } = useLista<UsuarioHub>('/tecnologia/usuarios')
    const [usuarioAcessos, setUsuarioAcessos] = useState<UsuarioHub | null>(null)

    const [busca, setBusca] = useState('')
    const [setoresSelecionados, setSetoresSelecionados] = useState<string[]>([])
    const [perfisSelecionados, setPerfisSelecionados] = useState<string[]>([])
    const [statusSelecionado, setStatusSelecionado] = useState<boolean[]>([])

    const setoresDisponiveis = [...new Set(rows.map((r) => r.sector_name ?? 'Sem setor'))].sort()
    const perfisDisponiveis = [...new Set(rows.map((r) => r.role))].sort()

    const setoresAtivos = setoresSelecionados.length > 0 ? setoresSelecionados : setoresDisponiveis
    const perfisAtivos = perfisSelecionados.length > 0 ? perfisSelecionados : perfisDisponiveis
    const statusAtivo = statusSelecionado.length > 0 ? statusSelecionado : [true, false]

    const termo = busca.trim().toLowerCase()
    const rowsFiltradas = rows.filter((row) => {
        if (!setoresAtivos.includes(row.sector_name ?? 'Sem setor')) return false
        if (!perfisAtivos.includes(row.role)) return false
        if (!statusAtivo.includes(row.status)) return false
        if (!termo) return true
        return [row.name, row.login, row.sector_name, row.role].join(' ').toLowerCase().includes(termo)
    })

    return (
        <PageShell
            loadingMe={loadingMe}
            meError={meError}
            autorizado={me !== null}
            titulo='Usuários'
            subtitulo='Usuários cadastrados no hub.'
        >
            <div className='mb-4'>
                <input
                    type='text'
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder='Buscar por nome, login, setor...'
                    className={`${inputClass} w-full max-w-sm`}
                />
            </div>

            <div className='mb-6 flex flex-col gap-3 rounded-xl border border-gray-base/30 bg-white p-4 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                <PillFilter
                    label='Setor'
                    options={setoresDisponiveis.map((setor) => ({ value: setor, label: setor }))}
                    selected={setoresAtivos}
                    onChange={setSetoresSelecionados}
                />
                <PillFilter
                    label='Perfil'
                    options={perfisDisponiveis.map((perfil) => ({ value: perfil, label: perfil }))}
                    selected={perfisAtivos}
                    onChange={setPerfisSelecionados}
                />
                <PillFilter label='Status' options={STATUS_OPCOES} selected={statusAtivo} onChange={setStatusSelecionado} />
            </div>

            <DataTable
                loading={loading}
                erro={erro}
                rows={rowsFiltradas}
                columns={[
                    { key: 'name', label: 'Nome', render: (row) => row.name },
                    { key: 'login', label: 'Login', render: (row) => row.login },
                    { key: 'setor', label: 'Setor', render: (row) => row.sector_name ?? '-' },
                    { key: 'role', label: 'Perfil', render: (row) => row.role },
                    {
                        key: 'status',
                        label: 'Status',
                        render: (row) => (
                            <span className={row.status ? 'text-green-base' : 'text-red-base'}>
                                {row.status ? 'Ativo' : 'Inativo'}
                            </span>
                        ),
                    },
                    { key: 'created_at', label: 'Criado em', render: (row) => formatDate(row.created_at) },
                    {
                        key: 'acoes',
                        label: 'Ações',
                        align: 'right',
                        render: (row) => (
                            <button
                                type='button'
                                onClick={() => setUsuarioAcessos(row)}
                                className='font-semibold text-orange-base hover:text-orange-light'
                            >
                                Acessos
                            </button>
                        ),
                    },
                ]}
            />

            {usuarioAcessos && <AcessosModal usuario={usuarioAcessos} onFechar={() => setUsuarioAcessos(null)} />}
        </PageShell>
    )
}
