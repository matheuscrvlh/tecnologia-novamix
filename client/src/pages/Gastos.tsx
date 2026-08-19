import { useState } from 'react'
import PageShell from '../components/PageShell'
import DataTable from '../components/DataTable'
import ConfirmModal from '../components/ConfirmModal'
import Field, { inputClass } from '../components/Field'
import SelectComNovo from '../components/SelectComNovo'
import PillFilter from '../components/PillFilter'
import DateRangeFilter from '../components/DateRangeFilter'
import FiltersMenu from '../components/FiltersMenu'
import { useMe } from '../hooks/useMe'
import { useLista } from '../hooks/useLista'
import { apiPost, apiPut, apiDelete, ApiError } from '../lib/api'
import { formatCurrency, formatDate, formatCnpjInput, onlyDigits } from '../lib/format'
import type { CadastroSimples, Equipamento, Fornecedor, Gasto, Loja, UsuarioHub } from '../types/tecnologia'

const TIPO_OPCOES = ['Manutenção', 'Compra']

const FORM_VAZIO = {
    fornecedor_id: '',
    filial_id: '',
    patrimonio: '',
    tipo: '',
    obs: '',
    area_id: '',
    valor: '',
    pagamento: '',
    liberacao: '',
    data_gasto: '',
}

const FORNECEDOR_VAZIO = { empresa: '', cnpj: '', endereco: '', cep: '' }

export default function Gastos() {
    const { me, loading: loadingMe, error: meError } = useMe()
    const { rows, loading, erro, recarregar } = useLista<Gasto>('/tecnologia/gastos')
    const { rows: fornecedores, recarregar: recarregarFornecedores } = useLista<Fornecedor>('/tecnologia/fornecedores')
    const { rows: lojas } = useLista<Loja>('/tecnologia/lojas')
    const { rows: equipamentos } = useLista<Equipamento>('/tecnologia/equipamentos')
    const { rows: usuarios } = useLista<UsuarioHub>('/tecnologia/usuarios')
    const { rows: areas, recarregar: recarregarAreas } = useLista<CadastroSimples>('/tecnologia/areas')

    const [busca, setBusca] = useState('')
    const [formAberto, setFormAberto] = useState(false)
    const [editandoId, setEditandoId] = useState<number | null>(null)
    const [form, setForm] = useState(FORM_VAZIO)
    const [salvando, setSalvando] = useState(false)
    const [erroForm, setErroForm] = useState<string | null>(null)

    const [fornecedorFormAberto, setFornecedorFormAberto] = useState(false)
    const [novoFornecedor, setNovoFornecedor] = useState(FORNECEDOR_VAZIO)
    const [salvandoFornecedor, setSalvandoFornecedor] = useState(false)
    const [erroFornecedor, setErroFornecedor] = useState<string | null>(null)

    const [paraExcluir, setParaExcluir] = useState<Gasto | null>(null)
    const [excluindo, setExcluindo] = useState(false)
    const [erroExclusao, setErroExclusao] = useState<string | null>(null)

    const [lojasSelecionadas, setLojasSelecionadas] = useState<number[]>([])
    const [dataInicio, setDataInicio] = useState('')
    const [dataFim, setDataFim] = useState('')

    const lojasAtivas = lojasSelecionadas.length > 0 ? lojasSelecionadas : lojas.map((l) => l.id)
    const filtrosAtivos = (lojasSelecionadas.length > 0 ? 1 : 0) + (dataInicio || dataFim ? 1 : 0)

    const termo = busca.trim().toLowerCase()
    const rowsFiltradas = rows.filter((row) => {
        if (!lojasAtivas.includes(row.filial_id)) return false
        const data = row.data_gasto.slice(0, 10)
        if (dataInicio && data < dataInicio) return false
        if (dataFim && data > dataFim) return false
        if (!termo) return true
        return [
            row.fornecedor_nome,
            row.loja_nome,
            row.tipo,
            row.area_nome,
            row.pagamento,
            row.liberacao_nome,
            row.usuario_nome,
        ]
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

    function abrirEdicao(row: Gasto) {
        setEditandoId(row.id)
        setForm({
            fornecedor_id: String(row.fornecedor_id),
            filial_id: String(row.filial_id),
            patrimonio: row.patrimonio ? String(row.patrimonio) : '',
            tipo: row.tipo,
            obs: row.obs ?? '',
            area_id: String(row.area_id),
            valor: row.valor,
            pagamento: row.pagamento,
            liberacao: String(row.liberacao),
            data_gasto: row.data_gasto.slice(0, 10),
        })
        setErroForm(null)
        setFormAberto(true)
    }

    function fecharForm() {
        setFormAberto(false)
        setEditandoId(null)
        setFornecedorFormAberto(false)
    }

    async function salvar() {
        if (!form.fornecedor_id) {
            setErroForm('Selecione um fornecedor.')
            return
        }

        if (!form.filial_id) {
            setErroForm('Selecione uma loja.')
            return
        }

        if (!form.tipo) {
            setErroForm('Selecione o tipo do gasto.')
            return
        }

        if (!form.area_id) {
            setErroForm('Selecione uma área.')
            return
        }

        if (!form.liberacao) {
            setErroForm('Selecione quem liberou o gasto.')
            return
        }

        setSalvando(true)
        setErroForm(null)

        const payload = {
            fornecedor_id: Number(form.fornecedor_id),
            filial_id: Number(form.filial_id),
            patrimonio: form.patrimonio ? Number(form.patrimonio) : null,
            tipo: form.tipo,
            obs: form.obs || null,
            area_id: Number(form.area_id),
            valor: Number(form.valor),
            pagamento: form.pagamento,
            liberacao: Number(form.liberacao),
            data_gasto: form.data_gasto || null,
        }

        try {
            if (editandoId) {
                await apiPut(`/tecnologia/gastos/${editandoId}`, payload)
            } else {
                await apiPost('/tecnologia/gastos', payload)
            }
            fecharForm()
            await recarregar()
        } catch (err) {
            setErroForm(err instanceof Error ? err.message : 'Erro ao salvar gasto.')
        } finally {
            setSalvando(false)
        }
    }

    async function confirmarExclusao() {
        if (!paraExcluir) return

        setExcluindo(true)
        setErroExclusao(null)

        try {
            await apiDelete(`/tecnologia/gastos/${paraExcluir.id}`)
            setParaExcluir(null)
            await recarregar()
        } catch (err) {
            setErroExclusao(err instanceof ApiError ? err.message : 'Erro ao excluir gasto.')
        } finally {
            setExcluindo(false)
        }
    }

    async function salvarFornecedor() {
        if (!novoFornecedor.empresa.trim()) {
            setErroFornecedor('Informe o nome da empresa.')
            return
        }

        const cnpjDigitos = onlyDigits(novoFornecedor.cnpj)
        if (cnpjDigitos && cnpjDigitos.length !== 14) {
            setErroFornecedor('CNPJ deve conter 14 dígitos.')
            return
        }

        setSalvandoFornecedor(true)
        setErroFornecedor(null)

        try {
            const criado = await apiPost<Fornecedor>('/tecnologia/fornecedores', {
                empresa: novoFornecedor.empresa,
                cnpj: cnpjDigitos || null,
                endereco: novoFornecedor.endereco || null,
                cep: novoFornecedor.cep || null,
                status: true,
            })
            await recarregarFornecedores()
            setForm((f) => ({ ...f, fornecedor_id: String(criado.id) }))
            setFornecedorFormAberto(false)
            setNovoFornecedor(FORNECEDOR_VAZIO)
        } catch (err) {
            setErroFornecedor(err instanceof Error ? err.message : 'Erro ao salvar fornecedor.')
        } finally {
            setSalvandoFornecedor(false)
        }
    }

    return (
        <PageShell
            loadingMe={loadingMe}
            meError={meError}
            autorizado={me !== null}
            titulo='Gastos'
            subtitulo='Gastos de TI por fornecedor e loja.'
        >
            <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
                <div className='flex flex-wrap items-center gap-3'>
                    <input
                        type='text'
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder='Buscar por fornecedor, loja, tipo, área...'
                        className={`${inputClass} w-full max-w-sm`}
                    />
                    <FiltersMenu ativos={filtrosAtivos}>
                        <PillFilter
                            label='Loja'
                            options={lojas.map((loja) => ({ value: loja.id, label: loja.name }))}
                            selected={lojasAtivas}
                            onChange={setLojasSelecionadas}
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
                    Novo gasto
                </button>
            </div>

            {formAberto && (
                <div className='mb-6 rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                    <h2 className='mb-4 text-sm font-semibold text-gray-text dark:text-dark-text'>
                        {editandoId ? 'Editar gasto' : 'Novo gasto'}
                    </h2>

                    {erroForm && (
                        <div className='mb-4 rounded-lg bg-red-light/10 px-4 py-3 text-sm font-medium text-red-base'>
                            {erroForm}
                        </div>
                    )}

                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                        <Field label='Fornecedor'>
                            <div className='flex gap-2'>
                                <select
                                    className={`${inputClass} flex-1`}
                                    value={form.fornecedor_id}
                                    onChange={(e) => setForm({ ...form, fornecedor_id: e.target.value })}
                                >
                                    <option value=''>Selecione...</option>
                                    {fornecedores.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.empresa}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type='button'
                                    onClick={() => setFornecedorFormAberto((v) => !v)}
                                    className='rounded-lg border border-orange-base px-3 text-sm font-semibold text-orange-base transition-colors hover:bg-orange-base/10'
                                >
                                    + novo
                                </button>
                            </div>
                        </Field>
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
                        <Field label='Patrimônio (opcional)'>
                            <select
                                className={inputClass}
                                value={form.patrimonio}
                                onChange={(e) => setForm({ ...form, patrimonio: e.target.value })}
                            >
                                <option value=''>Nenhum</option>
                                {equipamentos.map((eq) => (
                                    <option key={eq.id} value={eq.patrimonio}>
                                        {eq.patrimonio} - {eq.equipamento_nome} ({eq.loja_nome ?? '-'})
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label='Tipo'>
                            <select
                                className={inputClass}
                                value={form.tipo}
                                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                            >
                                <option value=''>Selecione...</option>
                                {TIPO_OPCOES.map((opcao) => (
                                    <option key={opcao} value={opcao}>
                                        {opcao}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <SelectComNovo
                            label='Área'
                            endpoint='/tecnologia/areas'
                            itens={areas}
                            recarregar={recarregarAreas}
                            value={form.area_id}
                            onChange={(id) => setForm({ ...form, area_id: id })}
                        />
                        <Field label='Valor'>
                            <input
                                type='number'
                                step='0.01'
                                className={inputClass}
                                value={form.valor}
                                onChange={(e) => setForm({ ...form, valor: e.target.value })}
                            />
                        </Field>
                        <Field label='Pagamento'>
                            <input
                                type='text'
                                className={inputClass}
                                value={form.pagamento}
                                onChange={(e) => setForm({ ...form, pagamento: e.target.value })}
                            />
                        </Field>
                        <Field label='Liberação'>
                            <select
                                className={inputClass}
                                value={form.liberacao}
                                onChange={(e) => setForm({ ...form, liberacao: e.target.value })}
                            >
                                <option value=''>Selecione...</option>
                                {usuarios.map((usuario) => (
                                    <option key={usuario.id} value={usuario.id}>
                                        {usuario.name}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label='Data do gasto'>
                            <input
                                type='date'
                                className={inputClass}
                                value={form.data_gasto}
                                onChange={(e) => setForm({ ...form, data_gasto: e.target.value })}
                            />
                        </Field>
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

                    {fornecedorFormAberto && (
                        <div className='mt-4 rounded-lg border border-orange-base/30 bg-orange-base/5 p-4'>
                            <h3 className='mb-3 text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                Novo fornecedor
                            </h3>

                            {erroFornecedor && (
                                <div className='mb-3 rounded-lg bg-red-light/10 px-3 py-2 text-sm font-medium text-red-base'>
                                    {erroFornecedor}
                                </div>
                            )}

                            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                                <Field label='Empresa'>
                                    <input
                                        type='text'
                                        className={inputClass}
                                        value={novoFornecedor.empresa}
                                        onChange={(e) => setNovoFornecedor({ ...novoFornecedor, empresa: e.target.value })}
                                    />
                                </Field>
                                <Field label='CNPJ'>
                                    <input
                                        type='text'
                                        inputMode='numeric'
                                        placeholder='00.000.000/0000-00'
                                        className={inputClass}
                                        value={novoFornecedor.cnpj}
                                        onChange={(e) =>
                                            setNovoFornecedor({ ...novoFornecedor, cnpj: formatCnpjInput(e.target.value) })
                                        }
                                    />
                                </Field>
                                <Field label='Endereço'>
                                    <input
                                        type='text'
                                        className={inputClass}
                                        value={novoFornecedor.endereco}
                                        onChange={(e) => setNovoFornecedor({ ...novoFornecedor, endereco: e.target.value })}
                                    />
                                </Field>
                                <Field label='CEP'>
                                    <input
                                        type='text'
                                        className={inputClass}
                                        value={novoFornecedor.cep}
                                        onChange={(e) => setNovoFornecedor({ ...novoFornecedor, cep: e.target.value })}
                                    />
                                </Field>
                            </div>

                            <div className='mt-3 flex gap-3'>
                                <button
                                    type='button'
                                    disabled={salvandoFornecedor}
                                    onClick={salvarFornecedor}
                                    className='rounded-lg bg-orange-base px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-orange-light disabled:opacity-60'
                                >
                                    {salvandoFornecedor ? 'Salvando...' : 'Salvar fornecedor'}
                                </button>
                                <button
                                    type='button'
                                    onClick={() => setFornecedorFormAberto(false)}
                                    className='rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-text transition-colors hover:bg-gray dark:text-dark-text dark:hover:bg-dark-surface-2'
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}

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
                    { key: 'fornecedor', label: 'Fornecedor', render: (row) => row.fornecedor_nome ?? '-' },
                    { key: 'loja', label: 'Loja', render: (row) => row.loja_nome ?? '-' },
                    { key: 'tipo', label: 'Tipo', render: (row) => row.tipo },
                    { key: 'area', label: 'Área', render: (row) => row.area_nome ?? '-' },
                    { key: 'valor', label: 'Valor', align: 'right', render: (row) => formatCurrency(row.valor) },
                    { key: 'pagamento', label: 'Pagamento', render: (row) => row.pagamento },
                    { key: 'liberacao', label: 'Liberação', render: (row) => row.liberacao_nome ?? '-' },
                    { key: 'data_gasto', label: 'Data', render: (row) => formatDate(row.data_gasto) },
                    { key: 'patrimonio', label: 'Patrimônio', render: (row) => row.patrimonio ?? '-' },
                    { key: 'usuario', label: 'Registrado por', render: (row) => row.usuario_nome ?? '-' },
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
                    titulo='Excluir gasto'
                    mensagem={`Excluir o gasto com ${paraExcluir.fornecedor_nome ?? 'fornecedor'} de ${formatCurrency(paraExcluir.valor)}? Essa ação não pode ser desfeita.`}
                    confirmando={excluindo}
                    onConfirmar={confirmarExclusao}
                    onCancelar={() => setParaExcluir(null)}
                />
            )}
        </PageShell>
    )
}
