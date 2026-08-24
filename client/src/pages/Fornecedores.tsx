import { useState } from 'react'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import ConfirmModal from '../components/ConfirmModal'
import RowActions from '../components/RowActions'
import Field, { inputClass } from '../components/Field'
import SelectFilter from '../components/SelectFilter'
import FiltersMenu from '../components/FiltersMenu'
import { useLista } from '../hooks/useLista'
import { apiPost, apiPut, apiDelete, ApiError } from '../lib/api'
import { formatCepInput, formatCnpjInput, onlyDigits } from '../lib/format'
import type { Fornecedor } from '../types/tecnologia'

const STATUS_OPCOES = [
    { value: true, label: 'Ativo' },
    { value: false, label: 'Inativo' },
]

const FORM_VAZIO = {
    empresa: '',
    cnpj: '',
    endereco: '',
    cep: '',
    status: true,
}

export default function Fornecedores() {
    const { rows, loading, erro, recarregar } = useLista<Fornecedor>('/tecnologia/fornecedores')

    const [busca, setBusca] = useState('')
    const [formAberto, setFormAberto] = useState(false)
    const [editandoId, setEditandoId] = useState<number | null>(null)
    const [form, setForm] = useState(FORM_VAZIO)
    const [salvando, setSalvando] = useState(false)
    const [erroForm, setErroForm] = useState<string | null>(null)

    const [paraExcluir, setParaExcluir] = useState<Fornecedor | null>(null)
    const [excluindo, setExcluindo] = useState(false)
    const [erroExclusao, setErroExclusao] = useState<string | null>(null)

    const [statusFiltro, setStatusFiltro] = useState<boolean | 'all'>(true)

    const filtrosAtivos = statusFiltro !== 'all' ? 1 : 0

    const termo = busca.trim().toLowerCase()
    const rowsFiltradas = rows.filter((row) => {
        if (statusFiltro !== 'all' && row.status !== statusFiltro) return false
        if (!termo) return true
        return [row.empresa, row.cnpj, row.endereco].join(' ').toLowerCase().includes(termo)
    })

    function abrirNovo() {
        setEditandoId(null)
        setForm(FORM_VAZIO)
        setErroForm(null)
        setFormAberto(true)
    }

    function abrirEdicao(row: Fornecedor) {
        setEditandoId(row.id)
        setForm({
            empresa: row.empresa,
            cnpj: row.cnpj ? formatCnpjInput(row.cnpj) : '',
            endereco: row.endereco ?? '',
            cep: row.cep ? formatCepInput(row.cep) : '',
            status: row.status,
        })
        setErroForm(null)
        setFormAberto(true)
    }

    function fecharForm() {
        setFormAberto(false)
        setEditandoId(null)
    }

    async function salvar() {
        if (!form.empresa.trim()) {
            setErroForm('Informe o nome da empresa.')
            return
        }

        const cnpjDigitos = onlyDigits(form.cnpj)
        if (cnpjDigitos && cnpjDigitos.length !== 14) {
            setErroForm('CNPJ deve conter 14 dígitos.')
            return
        }

        const cepDigitos = onlyDigits(form.cep)
        if (cepDigitos && cepDigitos.length !== 8) {
            setErroForm('CEP deve conter 8 dígitos.')
            return
        }

        setSalvando(true)
        setErroForm(null)

        const payload = {
            empresa: form.empresa.trim(),
            cnpj: cnpjDigitos || null,
            endereco: form.endereco.trim() || null,
            cep: cepDigitos || null,
            status: form.status,
        }

        try {
            if (editandoId) {
                await apiPut(`/tecnologia/fornecedores/${editandoId}`, payload)
            } else {
                await apiPost('/tecnologia/fornecedores', payload)
            }
            fecharForm()
            await recarregar()
        } catch (err) {
            setErroForm(err instanceof Error ? err.message : 'Erro ao salvar fornecedor.')
        } finally {
            setSalvando(false)
        }
    }

    async function confirmarExclusao() {
        if (!paraExcluir) return

        setExcluindo(true)
        setErroExclusao(null)

        try {
            await apiDelete(`/tecnologia/fornecedores/${paraExcluir.id}`)
            setParaExcluir(null)
            await recarregar()
        } catch (err) {
            setErroExclusao(err instanceof ApiError ? err.message : 'Erro ao excluir fornecedor.')
        } finally {
            setExcluindo(false)
        }
    }

    return (
        <div>
            <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
                <div className='flex flex-wrap items-center gap-3'>
                    <input
                        type='text'
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder='Buscar por empresa, CNPJ, endereço...'
                        className={`${inputClass} w-full max-w-sm`}
                    />
                    <FiltersMenu ativos={filtrosAtivos}>
                        <SelectFilter label='Status' options={STATUS_OPCOES} value={statusFiltro} onChange={setStatusFiltro} />
                    </FiltersMenu>
                </div>
                <button
                    type='button'
                    onClick={abrirNovo}
                    className='rounded-lg bg-orange-base px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-light'
                >
                    Novo fornecedor
                </button>
            </div>

            {erroExclusao && (
                <div className='mb-4 rounded-lg bg-red-light/10 px-4 py-3 text-sm font-medium text-red-base'>
                    {erroExclusao}
                </div>
            )}

            <DataTable
                loading={loading}
                erro={erro}
                rows={rowsFiltradas}
                columns={[
                    { key: 'empresa', label: 'Empresa', render: (row) => row.empresa },
                    { key: 'cnpj', label: 'CNPJ', render: (row) => (row.cnpj ? formatCnpjInput(row.cnpj) : '-') },
                    { key: 'endereco', label: 'Endereço', wrap: true, render: (row) => row.endereco ?? '-' },
                    { key: 'cep', label: 'CEP', render: (row) => (row.cep ? formatCepInput(row.cep) : '-') },
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

            {formAberto && (
                <Modal titulo={editandoId ? 'Editar fornecedor' : 'Novo fornecedor'} onFechar={fecharForm}>
                    {erroForm && (
                        <div className='mb-4 rounded-lg bg-red-light/10 px-4 py-3 text-sm font-medium text-red-base'>
                            {erroForm}
                        </div>
                    )}

                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                        <Field label='Empresa'>
                            <input
                                type='text'
                                className={inputClass}
                                value={form.empresa}
                                onChange={(e) => setForm({ ...form, empresa: e.target.value })}
                            />
                        </Field>
                        <Field label='CNPJ'>
                            <input
                                type='text'
                                inputMode='numeric'
                                placeholder='00.000.000/0000-00'
                                className={inputClass}
                                value={form.cnpj}
                                onChange={(e) => setForm({ ...form, cnpj: formatCnpjInput(e.target.value) })}
                            />
                        </Field>
                        <Field label='Endereço'>
                            <input
                                type='text'
                                className={inputClass}
                                value={form.endereco}
                                onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                            />
                        </Field>
                        <Field label='CEP'>
                            <input
                                type='text'
                                inputMode='numeric'
                                placeholder='00000-000'
                                className={inputClass}
                                value={form.cep}
                                onChange={(e) => setForm({ ...form, cep: formatCepInput(e.target.value) })}
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
                </Modal>
            )}

            {paraExcluir && (
                <ConfirmModal
                    titulo='Excluir fornecedor'
                    mensagem={`Excluir o fornecedor ${paraExcluir.empresa}? Essa ação não pode ser desfeita.`}
                    confirmando={excluindo}
                    onConfirmar={confirmarExclusao}
                    onCancelar={() => setParaExcluir(null)}
                />
            )}
        </div>
    )
}
