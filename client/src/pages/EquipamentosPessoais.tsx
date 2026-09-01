import { useState } from 'react'
import PageShell from '../components/PageShell'
import DataTable from '../components/DataTable'
import ConfirmModal from '../components/ConfirmModal'
import RowActions from '../components/RowActions'
import Field, { inputClass } from '../components/Field'
import SelectFilter from '../components/SelectFilter'
import FiltersMenu from '../components/FiltersMenu'
import AnexoUpload from '../components/AnexoUpload'
import FileField from '../components/FileField'
import CellStack from '../components/CellStack'
import PatrimonioSelect from '../components/PatrimonioSelect'
import { useMe } from '../hooks/useMe'
import { useLista } from '../hooks/useLista'
import { apiPost, apiPut, apiDelete, apiUpload, apiFileUrl, ApiError } from '../lib/api'
import { formatDate, formatPhoneInput } from '../lib/format'
import type { Equipamento, EquipamentoPessoal, Loja, UsuarioHub } from '../types/tecnologia'

const STATUS_OPCOES = [
    { value: true, label: 'Ativo' },
    { value: false, label: 'Inativo' },
]

const AVARIAS_OPCOES = [
    { value: true, label: 'Sim' },
    { value: false, label: 'Não' },
]

const FORM_VAZIO = {
    patrimonio: '',
    filial_id: '',
    tipo: '',
    marca: '',
    modelo: '',
    user_hub_id: '',
    telefone: '',
    avarias: false,
    avarias_obs: '',
    status: true,
    termo: false,
    data_recebimento: '',
    data_devolucao: '',
}

export default function EquipamentosPessoais() {
    const { me, loading: loadingMe, error: meError } = useMe()
    const { rows, loading, erro, recarregar } = useLista<EquipamentoPessoal>('/tecnologia/equipamentos-pessoais')
    const { rows: usuarios } = useLista<UsuarioHub>('/tecnologia/usuarios')
    const { rows: lojas } = useLista<Loja>('/tecnologia/lojas')
    const { rows: equipamentos } = useLista<Equipamento>('/tecnologia/equipamentos')

    const [busca, setBusca] = useState('')
    const [formAberto, setFormAberto] = useState(false)
    const [editandoId, setEditandoId] = useState<number | null>(null)
    const [form, setForm] = useState(FORM_VAZIO)
    const [arquivoRecebimento, setArquivoRecebimento] = useState<File | null>(null)
    const [arquivoDevolucao, setArquivoDevolucao] = useState<File | null>(null)
    const [arquivoRecebimentoAtual, setArquivoRecebimentoAtual] = useState<string | null>(null)
    const [arquivoDevolucaoAtual, setArquivoDevolucaoAtual] = useState<string | null>(null)
    const [salvando, setSalvando] = useState(false)
    const [erroForm, setErroForm] = useState<string | null>(null)

    const [paraExcluir, setParaExcluir] = useState<EquipamentoPessoal | null>(null)
    const [excluindo, setExcluindo] = useState(false)
    const [erroExclusao, setErroExclusao] = useState<string | null>(null)

    const [lojaFiltro, setLojaFiltro] = useState<number | 'all'>('all')
    const [statusFiltro, setStatusFiltro] = useState<boolean | 'all'>(true)
    const [avariasFiltro, setAvariasFiltro] = useState<boolean | 'all'>('all')

    const filtrosAtivos =
        (lojaFiltro !== 'all' ? 1 : 0) + (statusFiltro !== 'all' ? 1 : 0) + (avariasFiltro !== 'all' ? 1 : 0)

    const termo = busca.trim().toLowerCase()
    const rowsFiltradas = rows.filter((row) => {
        if (lojaFiltro !== 'all' && row.filial_id !== lojaFiltro) return false
        if (statusFiltro !== 'all' && row.status !== statusFiltro) return false
        if (avariasFiltro !== 'all' && row.avarias !== avariasFiltro) return false
        if (!termo) return true
        return [row.patrimonio, row.loja_nome, row.tipo, row.marca, row.modelo, row.usuario_nome]
            .join(' ')
            .toLowerCase()
            .includes(termo)
    })

    function abrirNovo() {
        setEditandoId(null)
        setForm(FORM_VAZIO)
        setArquivoRecebimento(null)
        setArquivoDevolucao(null)
        setArquivoRecebimentoAtual(null)
        setArquivoDevolucaoAtual(null)
        setErroForm(null)
        setFormAberto(true)
    }

    function abrirEdicao(row: EquipamentoPessoal) {
        setEditandoId(row.id)
        setForm({
            patrimonio: String(row.patrimonio),
            filial_id: String(row.filial_id),
            tipo: row.tipo,
            marca: row.marca,
            modelo: row.modelo,
            user_hub_id: String(row.user_hub_id),
            telefone: row.telefone ?? '',
            avarias: row.avarias,
            avarias_obs: row.avarias_obs ?? '',
            status: row.status,
            termo: row.termo,
            data_recebimento: row.data_recebimento?.slice(0, 10) ?? '',
            data_devolucao: row.data_devolucao?.slice(0, 10) ?? '',
        })
        setArquivoRecebimento(null)
        setArquivoDevolucao(null)
        setArquivoRecebimentoAtual(row.termo_recebimento_nome)
        setArquivoDevolucaoAtual(row.termo_devolucao_nome)
        setErroForm(null)
        setFormAberto(true)
    }

    function fecharForm() {
        setFormAberto(false)
        setEditandoId(null)
        setArquivoRecebimento(null)
        setArquivoDevolucao(null)
        setArquivoRecebimentoAtual(null)
        setArquivoDevolucaoAtual(null)
    }

    async function salvar() {
        if (!form.patrimonio.trim()) {
            setErroForm('Informe o patrimônio.')
            return
        }

        if (!form.filial_id) {
            setErroForm('Selecione uma loja.')
            return
        }

        if (!form.tipo.trim()) {
            setErroForm('Informe o tipo.')
            return
        }

        if (!form.marca.trim()) {
            setErroForm('Informe a marca.')
            return
        }

        if (!form.modelo.trim()) {
            setErroForm('Informe o modelo.')
            return
        }

        if (!form.user_hub_id) {
            setErroForm('Selecione um colaborador.')
            return
        }

        if (form.avarias && !form.avarias_obs.trim()) {
            setErroForm('Descreva a avaria.')
            return
        }

        if (form.data_recebimento && form.data_devolucao && form.data_devolucao < form.data_recebimento) {
            setErroForm('A data de devolução não pode ser anterior à data de recebimento.')
            return
        }

        setSalvando(true)
        setErroForm(null)

        const payload = {
            patrimonio: Number(form.patrimonio),
            filial_id: Number(form.filial_id),
            tipo: form.tipo,
            marca: form.marca,
            modelo: form.modelo,
            user_hub_id: Number(form.user_hub_id),
            telefone: form.telefone || null,
            avarias: form.avarias,
            avarias_obs: form.avarias_obs || null,
            status: form.status,
            termo: form.termo,
            data_recebimento: form.data_recebimento || null,
            data_devolucao: form.data_devolucao || null,
        }

        try {
            let id = editandoId
            if (editandoId) {
                await apiPut(`/tecnologia/equipamentos-pessoais/${editandoId}`, payload)
            } else {
                const criado = await apiPost<EquipamentoPessoal>('/tecnologia/equipamentos-pessoais', payload)
                id = criado.id
            }

            if (id) {
                if (arquivoRecebimento) {
                    await apiUpload(`/tecnologia/equipamentos-pessoais/${id}/termo/recebimento`, arquivoRecebimento)
                }
                if (arquivoDevolucao) {
                    await apiUpload(`/tecnologia/equipamentos-pessoais/${id}/termo/devolucao`, arquivoDevolucao)
                }
            }

            fecharForm()
            await recarregar()
        } catch (err) {
            setErroForm(err instanceof Error ? err.message : 'Erro ao salvar equipamento pessoal.')
        } finally {
            setSalvando(false)
        }
    }

    async function confirmarExclusao() {
        if (!paraExcluir) return

        setExcluindo(true)
        setErroExclusao(null)

        try {
            await apiDelete(`/tecnologia/equipamentos-pessoais/${paraExcluir.id}`)
            setParaExcluir(null)
            await recarregar()
        } catch (err) {
            setErroExclusao(err instanceof ApiError ? err.message : 'Erro ao excluir equipamento pessoal.')
        } finally {
            setExcluindo(false)
        }
    }

    async function enviarTermo(id: number, momento: 'recebimento' | 'devolucao', file: File) {
        await apiUpload(`/tecnologia/equipamentos-pessoais/${id}/termo/${momento}`, file)
        await recarregar()
    }

    async function removerTermo(id: number, momento: 'recebimento' | 'devolucao') {
        await apiDelete(`/tecnologia/equipamentos-pessoais/${id}/termo/${momento}`)
        await recarregar()
    }

    return (
        <PageShell
            loadingMe={loadingMe}
            meError={meError}
            autorizado={me !== null}
            titulo='Equipamentos pessoais'
            subtitulo='Equipamentos entregues a colaboradores.'
            acoes={
                <button
                    type='button'
                    onClick={abrirNovo}
                    className='rounded-lg bg-orange-base px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-light'
                >
                    Novo equipamento pessoal
                </button>
            }
        >
            <div className='mb-6 flex flex-wrap items-center gap-3'>
                <input
                    type='text'
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder='Buscar por patrimônio, loja, tipo, colaborador...'
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
                    <SelectFilter label='Avarias' options={AVARIAS_OPCOES} value={avariasFiltro} onChange={setAvariasFiltro} />
                </FiltersMenu>
            </div>

            {formAberto && (
                <div className='mb-6 rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                    <h2 className='mb-4 text-sm font-semibold text-gray-text dark:text-dark-text'>
                        {editandoId ? 'Editar equipamento pessoal' : 'Novo equipamento pessoal'}
                    </h2>

                    {erroForm && (
                        <div className='mb-4 rounded-lg bg-red-light/10 px-4 py-3 text-sm font-medium text-red-base'>
                            {erroForm}
                        </div>
                    )}

                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                        <Field label='Patrimônio'>
                            <PatrimonioSelect
                                equipamentos={equipamentos}
                                value={form.patrimonio}
                                onChangeValue={(patrimonio) => setForm({ ...form, patrimonio })}
                                onSelecionar={(eq) =>
                                    setForm({
                                        ...form,
                                        patrimonio: String(eq.patrimonio),
                                        filial_id: String(eq.filial_id),
                                        tipo: eq.equipamento_nome ?? '',
                                        marca: eq.marca_nome ?? '',
                                        modelo: eq.modelo_nome ?? '',
                                    })
                                }
                            />
                        </Field>
                        <Field label='Loja'>
                            <select
                                disabled
                                className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
                                value={form.filial_id}
                            >
                                <option value=''>Selecione o patrimônio...</option>
                                {lojas.map((loja) => (
                                    <option key={loja.id} value={loja.id}>
                                        {loja.name}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label='Tipo'>
                            <input
                                disabled
                                type='text'
                                placeholder='Selecione o patrimônio...'
                                className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
                                value={form.tipo}
                            />
                        </Field>
                        <Field label='Marca'>
                            <input
                                disabled
                                type='text'
                                placeholder='Selecione o patrimônio...'
                                className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
                                value={form.marca}
                            />
                        </Field>
                        <Field label='Modelo'>
                            <input
                                disabled
                                type='text'
                                placeholder='Selecione o patrimônio...'
                                className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
                                value={form.modelo}
                            />
                        </Field>
                        <Field label='Colaborador'>
                            <select
                                className={inputClass}
                                value={form.user_hub_id}
                                onChange={(e) => setForm({ ...form, user_hub_id: e.target.value })}
                            >
                                <option value=''>Selecione...</option>
                                {usuarios.map((usuario) => (
                                    <option key={usuario.id} value={usuario.id}>
                                        {usuario.name}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label='Telefone'>
                            <input
                                type='text'
                                inputMode='numeric'
                                placeholder='(00) 00000-0000'
                                className={inputClass}
                                value={form.telefone}
                                onChange={(e) => setForm({ ...form, telefone: formatPhoneInput(e.target.value) })}
                            />
                        </Field>
                        <Field label='Data de recebimento'>
                            <input
                                type='date'
                                className={inputClass}
                                value={form.data_recebimento}
                                onChange={(e) => setForm({ ...form, data_recebimento: e.target.value })}
                            />
                        </Field>
                        <Field label='Data de devolução'>
                            <input
                                type='date'
                                className={inputClass}
                                value={form.data_devolucao}
                                onChange={(e) => setForm({ ...form, data_devolucao: e.target.value })}
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
                        <label className='flex items-center gap-2 text-sm text-gray-text dark:text-dark-text'>
                            <input
                                type='checkbox'
                                checked={form.termo}
                                onChange={(e) => setForm({ ...form, termo: e.target.checked })}
                            />
                            Termo assinado
                        </label>
                        <label className='flex items-center gap-2 text-sm text-gray-text dark:text-dark-text'>
                            <input
                                type='checkbox'
                                checked={form.avarias}
                                onChange={(e) => setForm({ ...form, avarias: e.target.checked })}
                            />
                            Possui avarias
                        </label>
                        {form.avarias && (
                            <div className='sm:col-span-2 lg:col-span-3'>
                                <Field label='Observações das avarias'>
                                    <input
                                        type='text'
                                        className={inputClass}
                                        value={form.avarias_obs}
                                        onChange={(e) => setForm({ ...form, avarias_obs: e.target.value })}
                                    />
                                </Field>
                            </div>
                        )}
                        <FileField
                            label='Termo de recebimento (opcional)'
                            arquivo={arquivoRecebimento}
                            onChange={setArquivoRecebimento}
                            nomeAtual={arquivoRecebimentoAtual}
                        />
                        <FileField
                            label='Termo de devolução (opcional)'
                            arquivo={arquivoDevolucao}
                            onChange={setArquivoDevolucao}
                            nomeAtual={arquivoDevolucaoAtual}
                        />
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
                    {
                        key: 'patrimonio',
                        label: 'Patrimônio',
                        wrap: true,
                        render: (row) => <CellStack primary={row.patrimonio} secondary={row.loja_nome} />,
                    },
                    {
                        key: 'equipamento',
                        label: 'Equipamento',
                        wrap: true,
                        render: (row) => <CellStack primary={row.tipo} secondary={`${row.marca} ${row.modelo}`} />,
                    },
                    {
                        key: 'usuario',
                        label: 'Colaborador',
                        wrap: true,
                        render: (row) => <CellStack primary={row.usuario_nome ?? '-'} secondary={row.telefone} />,
                    },
                    {
                        key: 'avarias',
                        label: 'Avarias',
                        wrap: true,
                        render: (row) => (row.avarias ? row.avarias_obs || 'Sim' : 'Não'),
                    },
                    {
                        key: 'status',
                        label: 'Status',
                        wrap: true,
                        render: (row) => (
                            <CellStack
                                primary={
                                    <span className={row.status ? 'text-green-base' : 'text-red-base'}>
                                        {row.status ? 'Ativo' : 'Inativo'}
                                    </span>
                                }
                                secondary={
                                    [
                                        row.data_recebimento && `Receb. ${formatDate(row.data_recebimento)}`,
                                        row.data_devolucao && `Dev. ${formatDate(row.data_devolucao)}`,
                                    ]
                                        .filter(Boolean)
                                        .join(' · ') || undefined
                                }
                            />
                        ),
                    },
                    {
                        key: 'termo_recebimento',
                        label: 'Recebimento',
                        align: 'right',
                        render: (row) => (
                            <AnexoUpload
                                nomeArquivo={row.termo_recebimento_nome}
                                mimetype={row.termo_recebimento_mimetype}
                                urlVisualizar={apiFileUrl(`/tecnologia/equipamentos-pessoais/${row.id}/termo/recebimento`)}
                                urlBaixar={apiFileUrl(`/tecnologia/equipamentos-pessoais/${row.id}/termo/recebimento`, true)}
                                onUpload={(file) => enviarTermo(row.id, 'recebimento', file)}
                                onRemover={() => removerTermo(row.id, 'recebimento')}
                                rotulo='termo de recebimento'
                                mostrarNome={false}
                            />
                        ),
                    },
                    {
                        key: 'termo_devolucao',
                        label: 'Devolução',
                        align: 'right',
                        render: (row) => (
                            <AnexoUpload
                                nomeArquivo={row.termo_devolucao_nome}
                                mimetype={row.termo_devolucao_mimetype}
                                urlVisualizar={apiFileUrl(`/tecnologia/equipamentos-pessoais/${row.id}/termo/devolucao`)}
                                urlBaixar={apiFileUrl(`/tecnologia/equipamentos-pessoais/${row.id}/termo/devolucao`, true)}
                                onUpload={(file) => enviarTermo(row.id, 'devolucao', file)}
                                onRemover={() => removerTermo(row.id, 'devolucao')}
                                mostrarNome={false}
                                rotulo='termo de devolução'
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
                    titulo='Excluir equipamento pessoal'
                    mensagem={`Excluir o equipamento pessoal de patrimônio ${paraExcluir.patrimonio}? Essa ação não pode ser desfeita.`}
                    confirmando={excluindo}
                    onConfirmar={confirmarExclusao}
                    onCancelar={() => setParaExcluir(null)}
                />
            )}
        </PageShell>
    )
}
