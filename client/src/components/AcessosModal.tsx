import { useState } from 'react'
import Modal from './Modal'
import DataTable from './DataTable'
import Field, { inputClass } from './Field'
import { useLista } from '../hooks/useLista'
import { apiPost, apiDelete } from '../lib/api'
import { formatDate } from '../lib/format'
import type { AcessoUsuario, Sistema, UsuarioHub } from '../types/tecnologia'

const FORM_VAZIO = { system_id: '', user_login: '', user_password: '' }

type AcessosModalProps = {
    usuario: UsuarioHub
    onFechar: () => void
}

export default function AcessosModal({ usuario, onFechar }: AcessosModalProps) {
    const { rows: acessos, loading, erro, recarregar } = useLista<AcessoUsuario>(`/tecnologia/usuarios/${usuario.id}/acessos`)
    const { rows: sistemas } = useLista<Sistema>('/tecnologia/sistemas')

    const [form, setForm] = useState(FORM_VAZIO)
    const [salvando, setSalvando] = useState(false)
    const [erroForm, setErroForm] = useState<string | null>(null)
    const [visiveis, setVisiveis] = useState<Record<number, boolean>>({})
    const [copiado, setCopiado] = useState(false)

    function alternarVisibilidade(systemId: number) {
        setVisiveis((v) => ({ ...v, [systemId]: !v[systemId] }))
    }

    async function salvarAcesso() {
        if (!form.system_id) {
            setErroForm('Selecione um sistema.')
            return
        }

        if (!form.user_login.trim()) {
            setErroForm('Informe o login.')
            return
        }

        setSalvando(true)
        setErroForm(null)

        try {
            await apiPost(`/tecnologia/usuarios/${usuario.id}/acessos`, {
                system_id: Number(form.system_id),
                user_login: form.user_login,
                user_password: form.user_password || null,
            })
            setForm(FORM_VAZIO)
            await recarregar()
        } catch (err) {
            setErroForm(err instanceof Error ? err.message : 'Erro ao salvar acesso.')
        } finally {
            setSalvando(false)
        }
    }

    async function excluirAcesso(systemId: number) {
        if (!window.confirm('Remover este acesso?')) return
        await apiDelete(`/tecnologia/usuarios/${usuario.id}/acessos/${systemId}`)
        await recarregar()
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
                        Logins e senhas por sistema. As senhas ficam ocultas até você clicar em "mostrar".
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
                        {
                            key: 'acoes',
                            label: 'Ações',
                            align: 'right',
                            render: (row) => (
                                <button
                                    type='button'
                                    onClick={() => excluirAcesso(row.system_id)}
                                    className='font-semibold text-red-base hover:text-red-light print:hidden'
                                >
                                    Excluir
                                </button>
                            ),
                        },
                    ]}
                />

                <div className='rounded-xl border border-gray-base/30 bg-white p-4 shadow-sm print:hidden dark:border-dark-border dark:bg-dark-surface'>
                    <h3 className='mb-3 text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                        Adicionar acesso
                    </h3>

                    {erroForm && (
                        <div className='mb-3 rounded-lg bg-red-light/10 px-3 py-2 text-sm font-medium text-red-base'>
                            {erroForm}
                        </div>
                    )}

                    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                        <Field label='Sistema'>
                            <select
                                className={inputClass}
                                value={form.system_id}
                                onChange={(e) => setForm({ ...form, system_id: e.target.value })}
                            >
                                <option value=''>Selecione...</option>
                                {sistemas.map((sistema) => (
                                    <option key={sistema.id} value={sistema.id}>
                                        {sistema.name}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label='Login'>
                            <input
                                type='text'
                                className={inputClass}
                                value={form.user_login}
                                onChange={(e) => setForm({ ...form, user_login: e.target.value })}
                            />
                        </Field>
                        <Field label='Senha'>
                            <input
                                type='text'
                                className={inputClass}
                                value={form.user_password}
                                onChange={(e) => setForm({ ...form, user_password: e.target.value })}
                            />
                        </Field>
                    </div>

                    <div className='mt-4'>
                        <button
                            type='button'
                            disabled={salvando}
                            onClick={salvarAcesso}
                            className='rounded-lg bg-orange-base px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-light disabled:opacity-60'
                        >
                            {salvando ? 'Salvando...' : 'Salvar acesso'}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    )
}
