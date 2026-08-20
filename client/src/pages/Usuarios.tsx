import { useState } from 'react'
import PageShell from '../components/PageShell'
import DataTable from '../components/DataTable'
import AcessosModal from '../components/AcessosModal'
import SelectFilter from '../components/SelectFilter'
import FiltersMenu from '../components/FiltersMenu'
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
    const [setorFiltro, setSetorFiltro] = useState<string | 'all'>('all')
    const [perfilFiltro, setPerfilFiltro] = useState<string | 'all'>('all')
    const [statusFiltro, setStatusFiltro] = useState<boolean | 'all'>(true)

    const setoresDisponiveis = [...new Set(rows.map((r) => r.sector_name ?? 'Sem setor'))].sort()
    const perfisDisponiveis = [...new Set(rows.map((r) => r.role))].sort()

    const filtrosAtivos =
        (setorFiltro !== 'all' ? 1 : 0) + (perfilFiltro !== 'all' ? 1 : 0) + (statusFiltro !== 'all' ? 1 : 0)

    const termo = busca.trim().toLowerCase()
    const rowsFiltradas = rows.filter((row) => {
        if (setorFiltro !== 'all' && (row.sector_name ?? 'Sem setor') !== setorFiltro) return false
        if (perfilFiltro !== 'all' && row.role !== perfilFiltro) return false
        if (statusFiltro !== 'all' && row.status !== statusFiltro) return false
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
            <div className='mb-6 flex flex-wrap items-center gap-3'>
                <input
                    type='text'
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder='Buscar por nome, login, setor...'
                    className={`${inputClass} w-full max-w-sm`}
                />
                <FiltersMenu ativos={filtrosAtivos}>
                    <SelectFilter
                        label='Setor'
                        options={setoresDisponiveis.map((setor) => ({ value: setor, label: setor }))}
                        value={setorFiltro}
                        onChange={setSetorFiltro}
                    />
                    <SelectFilter
                        label='Perfil'
                        options={perfisDisponiveis.map((perfil) => ({ value: perfil, label: perfil }))}
                        value={perfilFiltro}
                        onChange={setPerfilFiltro}
                    />
                    <SelectFilter label='Status' options={STATUS_OPCOES} value={statusFiltro} onChange={setStatusFiltro} />
                </FiltersMenu>
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
