import { useState } from 'react'
import PageShell from '../components/PageShell'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import ConfirmModal from '../components/ConfirmModal'
import ErrorModal from '../components/ErrorModal'
import RowActions from '../components/RowActions'
import Field, { inputClass } from '../components/Field'
import SelectComNovo from '../components/SelectComNovo'
import FornecedorSelect from '../components/FornecedorSelect'
import SelectFilter from '../components/SelectFilter'
import DateRangeFilter from '../components/DateRangeFilter'
import FiltersMenu from '../components/FiltersMenu'
import AnexoUpload from '../components/AnexoUpload'
import FileField from '../components/FileField'
import CellStack from '../components/CellStack'
import { useMe } from '../hooks/useMe'
import { useLista } from '../hooks/useLista'
import { apiPost, apiPut, apiDelete, apiUpload, apiFileUrl, ApiError } from '../lib/api'
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
    const [arquivo, setArquivo] = useState<File | null>(null)
    const [arquivoAtual, setArquivoAtual] = useState<string | null>(null)
    const [salvando, setSalvando] = useState(false)
    const [erroForm, setErroForm] = useState<string | null>(null)

    const [paraExcluir, setParaExcluir] = useState<Contrato | null>(null)
    const [excluindo, setExcluindo] = useState(false)
    const [erroExclusao, setErroExclusao] = useState<string | null>(null)

    const [lojaFiltro, setLojaFiltro] = useState<number | 'all'>('all')
    const [statusFiltro, setStatusFiltro] = useState<boolean | 'all'>(true)
    const [dataInicio, setDataInicio] = useState('')
    const [dataFim, setDataFim] = useState('')

    const filtrosAtivos =
        (lojaFiltro !== 'all' ? 1 : 0) + (statusFiltro !== 'all' ? 1 : 0) + (dataInicio || dataFim ? 1 : 0)

    const termo = busca.trim().toLowerCase()
    const rowsFiltradas = rows.filter((row) => {
        if (lojaFiltro !== 'all' && row.filial_id !== lojaFiltro) return false
        if (statusFiltro !== 'all' && row.status !== statusFiltro) return false
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
        setArquivo(null)
        setArquivoAtual(null)
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
        setArquivo(null)
        setArquivoAtual(row.arquivo_nome)
        setErroForm(null)
        setFormAberto(true)
    }

    function fecharForm() {
        setFormAberto(false)
        setEditandoId(null)
        setArquivo(null)
        setArquivoAtual(null)
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
            let id = editandoId
            if (editandoId) {
                await apiPut(`/tecnologia/contratos/${editandoId}`, payload)
            } else {
                const criado = await apiPost<Contrato>('/tecnologia/contratos', payload)
                id = criado.id
            }

            if (arquivo && id) {
                await apiUpload(`/tecnologia/contratos/${id}/arquivo`, arquivo)
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

    async function enviarArquivoContrato(id: number, file: File) {
        await apiUpload(`/tecnologia/contratos/${id}/arquivo`, file)
        await recarregar()
    }

    async function removerArquivoContrato(id: number) {
        await apiDelete(`/tecnologia/contratos/${id}/arquivo`)
        await recarregar()
    }

    return (
        <PageShell
            loadingMe={loadingMe}
            meError={meError}
            autorizado={me !== null}
            titulo='Contratos'
            subtitulo='Contratos de TI por fornecedor e loja.'
            acoes={
                <button
                    type='button'
                    onClick={abrirNovo}
                    className='rounded-lg bg-orange-base px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-light'
                >
                    Novo contrato
                </button>
            }
        >
            <div className='mb-6 flex flex-wrap items-center gap-3'>
                <input
                    type='text'
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder='Buscar por fornecedor, loja, área...'
                    className={`${inputClass} w-full max-w-sm`}
                />
                <FiltersMenu ativos={filtrosAtivos}>
                    <SelectFilter
                        label='Loja'
                        options={lojas.map((loja) => ({ value: loja.id, label: loja.name }))}
                        value={lojaFiltro}
                        onChange={setLojaFiltro}
                    />
                    <SelectFilter label='Status' options={STATUS_OPCOES} value={statusFiltro} onChange={setStatusFiltro} />
                    <DateRangeFilter
                        label='Período'
                        inicio={dataInicio}
                        fim={dataFim}
                        onChangeInicio={setDataInicio}
                        onChangeFim={setDataFim}
                    />
                </FiltersMenu>
            </div>

            {formAberto && (
                <Modal titulo={editandoId ? 'Editar contrato' : 'Novo contrato'} onFechar={fecharForm} largura='lg'>
                    {erroForm && <ErrorModal mensagem={erroForm} onFechar={() => setErroForm(null)} />}

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
                        <div className='sm:col-span-2 lg:col-span-3'>
                            <FileField
                                label='Arquivo do contrato (opcional)'
                                arquivo={arquivo}
                                onChange={setArquivo}
                                nomeAtual={arquivoAtual}
                            />
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
                </Modal>
            )}

            {erroExclusao && <ErrorModal mensagem={erroExclusao} onFechar={() => setErroExclusao(null)} />}

            <DataTable
                loading={loading}
                erro={erro}
                rows={rowsFiltradas}
                columns={[
                    {
                        key: 'fornecedor',
                        label: 'Empresa',
                        wrap: true,
                        render: (row) => <CellStack primary={row.fornecedor_nome ?? '-'} secondary={row.loja_nome} />,
                    },
                    {
                        key: 'area',
                        label: 'Área',
                        wrap: true,
                        render: (row) => <CellStack primary={row.area_nome ?? '-'} secondary={row.tipo_cobranca} />,
                    },
                    {
                        key: 'valor',
                        label: 'Valor',
                        align: 'right',
                        render: (row) => (
                            <CellStack
                                primary={formatCurrency(row.valor)}
                                secondary={formatDate(row.data_contrato)}
                                align='right'
                            />
                        ),
                    },
                    { key: 'obs', label: 'Observação', wrap: true, render: (row) => row.obs ?? '-' },
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
                        key: 'arquivo',
                        label: 'Contrato (arquivo)',
                        align: 'right',
                        render: (row) => (
                            <AnexoUpload
                                nomeArquivo={row.arquivo_nome}
                                mimetype={row.arquivo_mimetype}
                                urlVisualizar={apiFileUrl(`/tecnologia/contratos/${row.id}/arquivo`)}
                                urlBaixar={apiFileUrl(`/tecnologia/contratos/${row.id}/arquivo`, true)}
                                onUpload={(file) => enviarArquivoContrato(row.id, file)}
                                onRemover={() => removerArquivoContrato(row.id)}
                                rotulo='contrato'
                                mostrarNome={false}
                            />
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
