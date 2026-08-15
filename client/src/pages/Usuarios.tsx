import { useState } from 'react'
import PageShell from '../components/PageShell'
import DataTable from '../components/DataTable'
import AcessosModal from '../components/AcessosModal'
import { useMe } from '../hooks/useMe'
import { useLista } from '../hooks/useLista'
import { formatDate } from '../lib/format'
import type { UsuarioHub } from '../types/tecnologia'

export default function Usuarios() {
    const { me, loading: loadingMe, error: meError } = useMe()
    const { rows, loading, erro } = useLista<UsuarioHub>('/tecnologia/usuarios')
    const [usuarioAcessos, setUsuarioAcessos] = useState<UsuarioHub | null>(null)

    return (
        <PageShell
            loadingMe={loadingMe}
            meError={meError}
            autorizado={me !== null}
            titulo='Usuários'
            subtitulo='Usuários cadastrados no hub.'
        >
            <DataTable
                loading={loading}
                erro={erro}
                rows={rows}
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
