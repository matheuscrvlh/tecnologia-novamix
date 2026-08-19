import { useState } from 'react'
import PageShell from '../components/PageShell'
import DataTable from '../components/DataTable'
import ConfirmModal from '../components/ConfirmModal'
import Field, { inputClass } from '../components/Field'
import SelectComNovo from '../components/SelectComNovo'
import FornecedorSelect from '../components/FornecedorSelect'
import PillFilter from '../components/PillFilter'
import DateRangeFilter from '../components/DateRangeFilter'
import FiltersMenu from '../components/FiltersMenu'
import { useMe } from '../hooks/useMe'
import { useLista } from '../hooks/useLista'
import { apiPost, apiPut, apiDelete, ApiError } from '../lib/api'
import { formatCurrency, formatDate } from '../lib/format'
import type { CadastroSimples, Contrato, Fornecedor, Loja } from '../types/tecnologia'

const TIPO_COBRANCA_OPCOES = ['Mensal', 'Anual', 'Único']

const STATUS_OPCOES = [
    { value: true, label: 'Ativo' },
    { value: false, label: 'Inativo' },
]

const FORM_VAZIO = {
    filial_id: '',
    fornecedor_id: '',
    area_id: '',
    data_contrato: '',
    obs: '',
    tipo_cobranca: '',
    valor: '',
    status: true,
}

export default function Contratos() {
    const { me, loading: loadingMe, error: meError } = useMe()
    const { rows, loading, erro, recarregar } = useLista<Contrato>('/tecnologia/contratos')
    const { rows: lojas } = useLista<Loja>('/tecnologia/lojas')
    const { rows: fornecedores, recarregar: recarregarFornecedores } = useLista<Fornecedor>('/tecnologia/fornecedores')
    const { rows: areas, recarregar: recarregarAreas } = useLista<CadastroSimples>('/tecnologia/areas')

    const [busca, setBusca] = useState('')
    const [formAberto, setFormAberto] = useState(false)
    const [editandoId, setEditandoId] = useState<number | null>(null)
    const [form, setForm] = useState(FORM_VAZIO)
    const [salvando, setSalvando] = useState(false)
    const [erroForm, setErroForm] = useState<string | null>(null)

    const [paraExcluir, setParaExcluir] = useState<Contrato | null>(null)
    const [excluindo, setExcluindo] = useState(false)
    const [erroExclusao, setErroExclusao] = useState<string | null>(null)

    const [lojasSelecionadas, setLojasSelecionadas] = useState<number[]>([])
    const [statusSelecionado, setStatusSelecionado] = useState<boolean[]>([])
    const [dataInicio, setDataInicio] = useState('')
    const [dataFim, setDataFim] = useState('')

    const lojasAtivas = lojasSelecionadas.length > 0 ? lojasSelecionadas : lojas.map((l) => l.id)
    const statusAtivo = statusSelecionado.length > 0 ? statusSelecionado : [true, false]
    const filtrosAtivos =
        (lojasSelecionadas.length > 0 ? 1 : 0) +
        (statusSelecionado.length > 0 ? 1 : 0) +
        (dataInicio || dataFim ? 1 : 0)

    const termo = busca.trim().toLowerCase()
    const rowsFiltradas = rows.filter((row) => {
        if (!lojasAtivas.includes(row.filial_id)) return false
        if (!statusAtivo.includes(row.status)) return false
        const data = row.data_contrato.slice(0, 10)
        if (dataInicio && data < dataInicio) return false
        if (dataFim && data > dataFim) return false
        if (!termo) return true
        return [row.fornecedor_nome, row.loja_nome, row.area_nome, row.tipo_cobranca, row.obs]
            .join(' ')
            .toLowerCase()
            .includes(termo)
    })

    function abrirNovo() {
        setEditandoId(null)
        setForm(FORM_VAZIO)
        setErroForm(null)
        setFormAberto(true)
    }

    function abrirEdicao(row: Contrato) {
        setEditandoId(row.id)
        setForm({
            filial_id: String(row.filial_id),
            fornecedor_id: String(row.fornecedor_id),
            area_id: String(row.area_id),
            data_contrato: row.data_contrato.slice(0, 10),
            obs: row.obs ?? '',
            tipo_cobranca: row.tipo_cobranca,
            valor: row.valor,
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
        if (!form.filial_id) {
            setErroForm('Selecione uma loja.')
            return
        }

        if (!form.fornecedor_id) {
            setErroForm('Selecione um fornecedor.')
            return
        }

        if (!form.area_id) {
            setErroForm('Selecione uma área.')
            return
        }

        if (!form.tipo_cobranca) {
            setErroForm('Selecione o tipo de cobrança.')
            return
        }

        setSalvando(true)
        setErroForm(null)

        const payload = {
            filial_id: Number(form.filial_id),
            fornecedor_id: Number(form.fornecedor_id),
            area_id: Number(form.area_id),
            data_contrato: form.data_contrato || null,
            obs: form.obs || null,
            tipo_cobranca: form.tipo_cobranca,
            valor: Number(form.valor),
            status: form.status,
        }

        try {
            if (editandoId) {
                await apiPut(`/tecnologia/contratos/${editandoId}`, payload)
            } else {
                await apiPost('/tecnologia/contratos', payload)
            }
            fecharForm()
            await recarregar()
        } catch (err) {
            setErroForm(err instanceof Error ? err.message : 'Erro ao salvar contrato.')
        } finally {
            setSalvando(false)
        }
    }

    async function confirmarExclusao() {
        if (!paraExcluir) return

        setExcluindo(true)
        setErroExclusao(null)

        try {
            await apiDelete(`/tecnologia/contratos/${paraExcluir.id}`)
            setParaExcluir(null)
            await recarregar()
        } catch (err) {
            setErroExclusao(err instanceof ApiError ? err.message : 'Erro ao excluir contrato.')
        } finally {
            setExcluindo(false)
        }
    }

    return (
        <PageShell
            loadingMe={loadingMe}
            meError={meError}
            autorizado={me !== null}
            titulo='Contratos'
            subtitulo='Contratos de TI por fornecedor e loja.'
        >
            <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
                <div className='flex flex-wrap items-center gap-3'>
                    <input
                        type='text'
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder='Buscar por fornecedor, loja, área...'
                        className={`${inputClass} w-full max-w-sm`}
                    />
                    <FiltersMenu ativos={filtrosAtivos}>
                        <PillFilter
                            label='Loja'
                            options={lojas.map((loja) => ({ value: loja.id, label: loja.name }))}
                            selected={lojasAtivas}
                            onChange={setLojasSelecionadas}
                        />
                        <PillFilter
                            label='Status'
                            options={STATUS_OPCOES}
                            selected={statusAtivo}
                            onChange={setStatusSelecionado}
                        />
                        <DateRangeFilter
                            label='Período'
                            inicio={dataInicio}
                            fim={dataFim}
                            onChangeInicio={setDataInicio}
                            onChangeFim={setDataFim}
                        />
                    </FiltersMenu>
                </div>
                <button
                    type='button'
                    onClick={abrirNovo}
                    className='rounded-lg bg-orange-base px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-light'
                >
                    Novo contrato
                </button>
            </div>

            {formAberto && (
                <div className='mb-6 rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                    <h2 className='mb-4 text-sm font-semibold text-gray-text dark:text-dark-text'>
                        {editandoId ? 'Editar contrato' : 'Novo contrato'}
                    </h2>

                    {erroForm && (
                        <div className='mb-4 rounded-lg bg-red-light/10 px-4 py-3 text-sm font-medium text-red-base'>
                            {erroForm}
                        </div>
                    )}

                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                        <FornecedorSelect
                            fornecedores={fornecedores}
                            recarregar={recarregarFornecedores}
                            value={form.fornecedor_id}
                            onChange={(id) => setForm({ ...form, fornecedor_id: id })}
                        />
                        <Field label='Loja'>
                            <select
                                className={inputClass}
                                value={form.filial_id}
                                onChange={(e) => setForm({ ...form, filial_id: e.target.value })}
                            >
                                <option value=''>Selecione...</option>
                                {lojas.map((loja) => (
                                    <option key={loja.id} value={loja.id}>
                                        {loja.name}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label='Data'>
                            <input
                                type='date'
                                className={inputClass}
                                value={form.data_contrato}
                                onChange={(e) => setForm({ ...form, data_contrato: e.target.value })}
                            />
                        </Field>
                        <SelectComNovo
                            label='Área'
                            endpoint='/tecnologia/areas'
                            itens={areas}
                            recarregar={recarregarAreas}
                            value={form.area_id}
                            onChange={(id) => setForm({ ...form, area_id: id })}
                        />
                        <Field label='Tipo de cobrança'>
                            <select
                                className={inputClass}
                                value={form.tipo_cobranca}
                                onChange={(e) => setForm({ ...form, tipo_cobranca: e.target.value })}
                            >
                                <option value=''>Selecione...</option>
                                {TIPO_COBRANCA_OPCOES.map((opcao) => (
                                    <option key={opcao} value={opcao}>
                                        {opcao}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label='Valor'>
                            <input
                                type='number'
                                step='0.01'
                                className={inputClass}
                                value={form.valor}
                                onChange={(e) => setForm({ ...form, valor: e.target.value })}
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
                        <div className='sm:col-span-2 lg:col-span-3'>
                            <Field label='Observações'>
                                <input
                                    type='text'
                                    className={inputClass}
                                    value={form.obs}
                                    onChange={(e) => setForm({ ...form, obs: e.target.value })}
                                />
                            </Field>
                        </div>
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
                    { key: 'fornecedor', label: 'Empresa', render: (row) => row.fornecedor_nome ?? '-' },
                    { key: 'loja', label: 'Loja', render: (row) => row.loja_nome ?? '-' },
                    { key: 'data_contrato', label: 'Data', render: (row) => formatDate(row.data_contrato) },
                    { key: 'area', label: 'Área', render: (row) => row.area_nome ?? '-' },
                    { key: 'tipo_cobranca', label: 'Tipo de cobrança', render: (row) => row.tipo_cobranca },
                    { key: 'valor', label: 'Valor', align: 'right', render: (row) => formatCurrency(row.valor) },
                    { key: 'obs', label: 'Observação', render: (row) => row.obs ?? '-' },
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
                            <div className='flex justify-end gap-3'>
                                <button
                                    type='button'
                                    onClick={() => abrirEdicao(row)}
                                    className='font-semibold text-orange-base hover:text-orange-light'
                                >
                                    Editar
                                </button>
                                <button
                                    type='button'
                                    onClick={() => {
                                        setErroExclusao(null)
                                        setParaExcluir(row)
                                    }}
                                    className='font-semibold text-red-base hover:text-red-light'
                                >
                                    Excluir
                                </button>
                            </div>
                        ),
                    },
                ]}
            />

            {paraExcluir && (
                <ConfirmModal
                    titulo='Excluir contrato'
                    mensagem={`Excluir o contrato com ${paraExcluir.fornecedor_nome ?? 'fornecedor'} de ${formatCurrency(paraExcluir.valor)}? Essa ação não pode ser desfeita.`}
                    confirmando={excluindo}
                    onConfirmar={confirmarExclusao}
                    onCancelar={() => setParaExcluir(null)}
                />
            )}
        </PageShell>
    )
}
