import { useState } from 'react'
import DataTable from '../components/DataTable'
import ConfirmModal from '../components/ConfirmModal'
import ErrorModal from '../components/ErrorModal'
import RowActions from '../components/RowActions'
import Field, { inputClass } from '../components/Field'
import SelectFilter from '../components/SelectFilter'
import FiltersMenu from '../components/FiltersMenu'
import { useLista } from '../hooks/useLista'
import { apiPost, apiPut, apiDelete, ApiError } from '../lib/api'
import type { CadastroSimples } from '../types/tecnologia'

const STATUS_OPCOES = [
    { value: true, label: 'Ativo' },
    { value: false, label: 'Inativo' },
]

const FORM_VAZIO = { nome: '', status: true }

type CadastroSimplesPageProps = {
    titulo: string
    subtitulo: string
    endpoint: string
    labelSingular: string
}

export default function CadastroSimplesPage({ titulo, subtitulo, endpoint, labelSingular }: CadastroSimplesPageProps) {
    const { rows, loading, erro, recarregar } = useLista<CadastroSimples>(endpoint)

    const [busca, setBusca] = useState('')
    const [formAberto, setFormAberto] = useState(false)
    const [editandoId, setEditandoId] = useState<number | null>(null)
    const [form, setForm] = useState(FORM_VAZIO)
    const [salvando, setSalvando] = useState(false)
    const [erroForm, setErroForm] = useState<string | null>(null)

    const [statusFiltro, setStatusFiltro] = useState<boolean | 'all'>(true)
    const [paraExcluir, setParaExcluir] = useState<CadastroSimples | null>(null)
    const [excluindo, setExcluindo] = useState(false)
    const [erroExclusao, setErroExclusao] = useState<string | null>(null)

    const filtrosAtivos = statusFiltro !== 'all' ? 1 : 0

    const termo = busca.trim().toLowerCase()
    const rowsFiltradas = rows.filter((row) => {
        if (statusFiltro !== 'all' && row.status !== statusFiltro) return false
        if (!termo) return true
        return row.nome.toLowerCase().includes(termo)
    })

    function abrirNovo() {
        setEditandoId(null)
        setForm(FORM_VAZIO)
        setErroForm(null)
        setFormAberto(true)
    }

    function abrirEdicao(row: CadastroSimples) {
        setEditandoId(row.id)
        setForm({ nome: row.nome, status: row.status })
        setErroForm(null)
        setFormAberto(true)
    }

    function fecharForm() {
        setFormAberto(false)
        setEditandoId(null)
    }

    async function salvar() {
        if (!form.nome.trim()) {
            setErroForm('Informe o nome.')
            return
        }

        setSalvando(true)
        setErroForm(null)

        const payload = { nome: form.nome.trim(), status: form.status }

        try {
            if (editandoId) {
                await apiPut(`${endpoint}/${editandoId}`, payload)
            } else {
                await apiPost(endpoint, payload)
            }
            fecharForm()
            await recarregar()
        } catch (err) {
            setErroForm(err instanceof Error ? err.message : `Erro ao salvar ${labelSingular}.`)
        } finally {
            setSalvando(false)
        }
    }

    async function confirmarExclusao() {
        if (!paraExcluir) return

        setExcluindo(true)
        setErroExclusao(null)

        try {
            await apiDelete(`${endpoint}/${paraExcluir.id}`)
            setParaExcluir(null)
            await recarregar()
        } catch (err) {
            setErroExclusao(err instanceof ApiError ? err.message : `Erro ao excluir ${labelSingular}.`)
        } finally {
            setExcluindo(false)
        }
    }

    return (
        <div>
            <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
                <div>
                    <h2 className='mb-1 text-lg font-semibold text-gray-text dark:text-dark-text'>{titulo}</h2>
                    <p className='text-sm text-gray-dark dark:text-dark-text-muted'>{subtitulo}</p>
                </div>
                <button
                    type='button'
                    onClick={abrirNovo}
                    className='rounded-lg bg-orange-base px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-light'
                >
                    Novo {labelSingular}
                </button>
            </div>

            <div className='mb-6 flex flex-wrap items-center gap-3'>
                <input
                    type='text'
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder='Buscar por nome...'
                    className={`${inputClass} w-full max-w-sm`}
                />
                <FiltersMenu ativos={filtrosAtivos}>
                    <SelectFilter label='Status' options={STATUS_OPCOES} value={statusFiltro} onChange={setStatusFiltro} />
                </FiltersMenu>
            </div>

            {formAberto && (
                <div className='mb-6 rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                    <h3 className='mb-4 text-sm font-semibold text-gray-text dark:text-dark-text'>
                        {editandoId ? `Editar ${labelSingular}` : `Novo ${labelSingular}`}
                    </h3>

                    {erroForm && <ErrorModal mensagem={erroForm} onFechar={() => setErroForm(null)} />}

                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                        <Field label='Nome'>
                            <input
                                type='text'
                                className={inputClass}
                                value={form.nome}
                                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                            />
                        </Field>
                        <label className='flex items-center gap-2 text-sm text-gray-text dark:text-dark-text'>
                            <input
                                type='checkbox'
                                checked={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.checked })}
                            />
                            Ativo
                        </label>
                    </div>

                    <div className='mt-6 flex items-center gap-3'>
                        <button
                            type='button'
                            disabled={salvando}
                            onClick={salvar}
                            className='rounded-lg bg-orange-base px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-light disabled:opacity-60'
                        >
                            {salvando ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button
                            type='button'
                            onClick={fecharForm}
                            className='rounded-lg px-4 py-2 text-sm font-semibold text-gray-text transition-colors hover:bg-gray dark:text-dark-text dark:hover:bg-dark-surface-2'
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {erroExclusao && <ErrorModal mensagem={erroExclusao} onFechar={() => setErroExclusao(null)} />}

            <DataTable
                loading={loading}
                erro={erro}
                rows={rowsFiltradas}
                columns={[
                    { key: 'nome', label: 'Nome', render: (row) => row.nome },
                    {
                        key: 'status',
                        label: 'Status',
                        render: (row) => (
                            <span className={row.status ? 'text-green-base' : 'text-red-base'}>
                                {row.status ? 'Ativo' : 'Inativo'}
                            </span>
                        ),
                    },
                    {
                        key: 'acoes',
                        label: 'Ações',
                        align: 'right',
                        render: (row) => (
                            <RowActions
                                onEditar={() => abrirEdicao(row)}
                                onExcluir={() => {
                                    setErroExclusao(null)
                                    setParaExcluir(row)
                                }}
                            />
                        ),
                    },
                ]}
            />

            {paraExcluir && (
                <ConfirmModal
                    titulo={`Excluir ${labelSingular}`}
                    mensagem={`Tem certeza que deseja excluir "${paraExcluir.nome}"? Essa ação não pode ser desfeita.`}
                    confirmando={excluindo}
                    onConfirmar={confirmarExclusao}
                    onCancelar={() => setParaExcluir(null)}
                />
            )}
        </div>
    )
}
