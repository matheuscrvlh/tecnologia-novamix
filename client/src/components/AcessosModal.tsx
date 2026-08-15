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

function escapeHtml(texto: string) {
    return texto
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

function montarHtmlImpressao(nomeUsuario: string, acessos: AcessoUsuario[]) {
    const linhas = acessos
        .map(
            (a) => `
                <tr>
                    <td>${escapeHtml(a.system_name)}</td>
                    <td>${escapeHtml(a.user_login)}</td>
                    <td>${a.user_password ? escapeHtml(a.user_password) : '-'}</td>
                    <td>${formatDate(a.updated_at)}</td>
                </tr>`
        )
        .join('')

    return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Acessos de ${escapeHtml(nomeUsuario)}</title>
<style>
    body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; padding: 32px; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    p { font-size: 12px; color: #666; margin: 0 0 24px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #ddd; font-size: 13px; }
    th { text-transform: uppercase; font-size: 11px; color: #666; letter-spacing: 0.03em; }
</style>
</head>
<body>
    <h1>Acessos de ${escapeHtml(nomeUsuario)}</h1>
    <p>Gerado em ${formatDate(new Date().toISOString())}</p>
    <table>
        <thead>
            <tr><th>Sistema</th><th>Login</th><th>Senha</th><th>Atualizado em</th></tr>
        </thead>
        <tbody>${linhas}</tbody>
    </table>
</body>
</html>`
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

    function imprimir() {
        const janela = window.open('', '_blank')
        if (!janela) return

        janela.document.write(montarHtmlImpressao(usuario.name, acessos))
        janela.document.close()
        janela.focus()
        janela.print()
    }

    return (
        <Modal titulo={`Acessos de ${usuario.name}`} onFechar={onFechar}>
            <div className='flex flex-col gap-4'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
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
                            onClick={imprimir}
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
                                            className='font-semibold text-orange-base hover:text-orange-light'
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
