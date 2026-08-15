import { useState } from 'react'
import Modal from './Modal'
import DataTable from './DataTable'
import { useLista } from '../hooks/useLista'
import { formatDate } from '../lib/format'
import type { AcessoUsuario, UsuarioHub } from '../types/tecnologia'

type AcessosModalProps = {
    usuario: UsuarioHub
    onFechar: () => void
}

export default function AcessosModal({ usuario, onFechar }: AcessosModalProps) {
    const { rows: acessos, loading, erro } = useLista<AcessoUsuario>(`/tecnologia/usuarios/${usuario.id}/acessos`)

    const [visiveis, setVisiveis] = useState<Record<number, boolean>>({})
    const [copiado, setCopiado] = useState(false)

    function alternarVisibilidade(systemId: number) {
        setVisiveis((v) => ({ ...v, [systemId]: !v[systemId] }))
    }

    async function copiarTudo() {
        const texto = acessos
            .map((a) => `${a.system_name}\nLogin: ${a.user_login}${a.user_password ? `\nSenha: ${a.user_password}` : ''}`)
            .join('\n\n')
        await navigator.clipboard.writeText(`Acessos de ${usuario.name}\n\n${texto}`)
        setCopiado(true)
        setTimeout(() => setCopiado(false), 2000)
    }

    return (
        <Modal titulo={`Acessos de ${usuario.name}`} onFechar={onFechar}>
            <div className='print-area flex flex-col gap-4'>
                <div className='flex flex-wrap items-center justify-between gap-2 print:hidden'>
                    <p className='text-xs text-gray-dark dark:text-dark-text-muted'>
                        Logins e senhas cadastrados pelo hub. As senhas ficam ocultas até você clicar em "mostrar".
                    </p>
                    <div className='flex gap-2'>
                        <button
                            type='button'
                            onClick={copiarTudo}
                            disabled={acessos.length === 0}
                            className='rounded-lg border border-gray-base/30 px-3 py-1.5 text-xs font-semibold text-gray-text transition-colors hover:bg-gray disabled:opacity-50 dark:border-dark-border dark:text-dark-text dark:hover:bg-dark-surface-2'
                        >
                            {copiado ? 'Copiado!' : 'Copiar tudo'}
                        </button>
                        <button
                            type='button'
                            onClick={() => window.print()}
                            disabled={acessos.length === 0}
                            className='rounded-lg border border-gray-base/30 px-3 py-1.5 text-xs font-semibold text-gray-text transition-colors hover:bg-gray disabled:opacity-50 dark:border-dark-border dark:text-dark-text dark:hover:bg-dark-surface-2'
                        >
                            Imprimir
                        </button>
                    </div>
                </div>

                <DataTable
                    loading={loading}
                    erro={erro}
                    rows={acessos}
                    rodape='Cadastro de sistemas e acessos é feito pelo hub.'
                    columns={[
                        {
                            key: 'system_name',
                            label: 'Sistema',
                            render: (row) =>
                                row.system_link ? (
                                    <a
                                        href={row.system_link}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        className='text-orange-base hover:text-orange-light'
                                    >
                                        {row.system_name}
                                    </a>
                                ) : (
                                    row.system_name
                                ),
                        },
                        { key: 'user_login', label: 'Login', render: (row) => row.user_login },
                        {
                            key: 'user_password',
                            label: 'Senha',
                            render: (row) =>
                                row.user_password ? (
                                    visiveis[row.system_id] ? (
                                        <span className='font-mono'>{row.user_password}</span>
                                    ) : (
                                        <button
                                            type='button'
                                            onClick={() => alternarVisibilidade(row.system_id)}
                                            className='font-semibold text-orange-base hover:text-orange-light print:hidden'
                                        >
                                            Mostrar
                                        </button>
                                    )
                                ) : (
                                    '-'
                                ),
                        },
                        {
                            key: 'updated_at',
                            label: 'Atualizado em',
                            render: (row) => formatDate(row.updated_at),
                        },
                    ]}
                />
            </div>
        </Modal>
    )
}
