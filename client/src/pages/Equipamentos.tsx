import { useState } from 'react'
import PageShell from '../components/PageShell'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import ConfirmModal from '../components/ConfirmModal'
import ErrorModal from '../components/ErrorModal'
import RowActions from '../components/RowActions'
import Field, { inputClass } from '../components/Field'
import SelectComNovo from '../components/SelectComNovo'
import SelectFilter from '../components/SelectFilter'
import FiltersMenu from '../components/FiltersMenu'
import CellStack from '../components/CellStack'
import { useMe } from '../hooks/useMe'
import { useLista } from '../hooks/useLista'
import { apiPost, apiPut, apiDelete, ApiError } from '../lib/api'
import type { CadastroSimples, Equipamento, Loja } from '../types/tecnologia'

const STATUS_OPCOES = [
    { value: true, label: 'Ativo' },
    { value: false, label: 'Inativo' },
]

const VERIFICAR_OPCOES = [
    { value: true, label: 'Sim' },
    { value: false, label: 'Não' },
]

const FORM_VAZIO = {
    patrimonio: '',
    filial_id: '',
    local_id: '',
    equipamento_id: '',
    marca_id: '',
    modelo_id: '',
    ip: '',
    codigo_aparelho: '',
    observacao: '',
    terceirizado: false,
    status: true,
    verificar: false,
}

export default function Equipamentos() {
    const { me, loading: loadingMe, error: meError } = useMe()
    const { rows, loading, erro, recarregar } = useLista<Equipamento>('/tecnologia/equipamentos')
    const { rows: lojas } = useLista<Loja>('/tecnologia/lojas')
    const { rows: locais, recarregar: recarregarLocais } = useLista<CadastroSimples>('/tecnologia/locais')
    const { rows: tiposEquipamento, recarregar: recarregarTiposEquipamento } = useLista<CadastroSimples>(
        '/tecnologia/tipos-equipamento'
    )
    const { rows: marcas, recarregar: recarregarMarcas } = useLista<CadastroSimples>('/tecnologia/marcas')
    const { rows: modelos, recarregar: recarregarModelos } = useLista<CadastroSimples>('/tecnologia/modelos')

    const [busca, setBusca] = useState('')
    const [formAberto, setFormAberto] = useState(false)
    const [editandoId, setEditandoId] = useState<number | null>(null)
    const [form, setForm] = useState(FORM_VAZIO)
    const [salvando, setSalvando] = useState(false)
    const [erroForm, setErroForm] = useState<string | null>(null)

    const [paraExcluir, setParaExcluir] = useState<Equipamento | null>(null)
    const [excluindo, setExcluindo] = useState(false)
    const [erroExclusao, setErroExclusao] = useState<string | null>(null)

    const [lojaFiltro, setLojaFiltro] = useState<number | 'all'>('all')
    const [statusFiltro, setStatusFiltro] = useState<boolean | 'all'>(true)
    const [verificarFiltro, setVerificarFiltro] = useState<boolean | 'all'>('all')
    const [tipoFiltro, setTipoFiltro] = useState<number | 'all'>('all')
    const [marcaFiltro, setMarcaFiltro] = useState<number | 'all'>('all')
    const [modeloFiltro, setModeloFiltro] = useState<number | 'all'>('all')

    const filtrosAtivos =
        (lojaFiltro !== 'all' ? 1 : 0) +
        (statusFiltro !== 'all' ? 1 : 0) +
        (verificarFiltro !== 'all' ? 1 : 0) +
        (tipoFiltro !== 'all' ? 1 : 0) +
        (marcaFiltro !== 'all' ? 1 : 0) +
        (modeloFiltro !== 'all' ? 1 : 0)

    const termo = busca.trim().toLowerCase()
    const rowsFiltradas = rows.filter((row) => {
        if (lojaFiltro !== 'all' && row.filial_id !== lojaFiltro) return false
        if (statusFiltro !== 'all' && row.status !== statusFiltro) return false
        if (verificarFiltro !== 'all' && row.verificar !== verificarFiltro) return false
        if (tipoFiltro !== 'all' && row.equipamento_id !== tipoFiltro) return false
        if (marcaFiltro !== 'all' && row.marca_id !== marcaFiltro) return false
        if (modeloFiltro !== 'all' && row.modelo_id !== modeloFiltro) return false
        if (!termo) return true
        return [row.patrimonio, row.loja_nome, row.local_nome, row.equipamento_nome, row.marca_nome, row.modelo_nome]
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

    function abrirEdicao(row: Equipamento) {
        setEditandoId(row.id)
        setForm({
            patrimonio: row.patrimonio !== null ? String(row.patrimonio) : '',
            filial_id: String(row.filial_id),
            local_id: String(row.local_id),
            equipamento_id: String(row.equipamento_id),
            marca_id: String(row.marca_id),
            modelo_id: String(row.modelo_id),
            ip: row.ip ?? '',
            codigo_aparelho: row.codigo_aparelho ?? '',
            observacao: row.observacao ?? '',
            terceirizado: row.terceirizado,
            status: row.status,
            verificar: row.verificar,
        })
        setErroForm(null)
        setFormAberto(true)
    }

    function fecharForm() {
        setFormAberto(false)
        setEditandoId(null)
    }

    function alternarTerceirizado(terceirizado: boolean) {
        setForm({
            ...form,
            terceirizado,
            patrimonio: terceirizado ? '' : form.patrimonio,
            codigo_aparelho: terceirizado ? '' : form.codigo_aparelho,
        })
    }

    async function salvar() {
        if (!form.terceirizado && !form.patrimonio.trim()) {
            setErroForm('Informe o patrimônio ou marque o equipamento como terceirizado.')
            return
        }

        if (!form.filial_id) {
            setErroForm('Selecione uma loja.')
            return
        }

        if (!form.local_id) {
            setErroForm('Selecione um local.')
            return
        }

        if (!form.equipamento_id) {
            setErroForm('Selecione um tipo de equipamento.')
            return
        }

        if (!form.marca_id) {
            setErroForm('Selecione uma marca.')
            return
        }

        if (!form.modelo_id) {
            setErroForm('Selecione um modelo.')
            return
        }

        setSalvando(true)
        setErroForm(null)

        const payload = {
            patrimonio: form.terceirizado ? null : Number(form.patrimonio),
            filial_id: Number(form.filial_id),
            local_id: Number(form.local_id),
            equipamento_id: Number(form.equipamento_id),
            marca_id: Number(form.marca_id),
            modelo_id: Number(form.modelo_id),
            ip: form.ip || null,
            codigo_aparelho: form.terceirizado ? null : form.codigo_aparelho || null,
            observacao: form.observacao || null,
            terceirizado: form.terceirizado,
            status: form.status,
            verificar: form.verificar,
        }

        try {
            if (editandoId) {
                await apiPut(`/tecnologia/equipamentos/${editandoId}`, payload)
            } else {
                await apiPost('/tecnologia/equipamentos', payload)
            }
            fecharForm()
            await recarregar()
        } catch (err) {
            setErroForm(err instanceof Error ? err.message : 'Erro ao salvar equipamento.')
        } finally {
            setSalvando(false)
        }
    }

    async function confirmarExclusao() {
        if (!paraExcluir) return

        setExcluindo(true)
        setErroExclusao(null)

        try {
            await apiDelete(`/tecnologia/equipamentos/${paraExcluir.id}`)
            setParaExcluir(null)
            await recarregar()
        } catch (err) {
            setErroExclusao(err instanceof ApiError ? err.message : 'Erro ao excluir equipamento.')
        } finally {
            setExcluindo(false)
        }
    }

    return (
        <PageShell
            loadingMe={loadingMe}
            meError={meError}
            autorizado={me !== null}
            titulo='Equipamentos'
            subtitulo='Equipamentos de TI cadastrados por loja.'
            acoes={
                <button
                    type='button'
                    onClick={abrirNovo}
                    className='rounded-lg bg-orange-base px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-light'
                >
                    Novo equipamento
                </button>
            }
        >
            <div className='mb-6 flex flex-wrap items-center gap-3'>
                <input
                    type='text'
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder='Buscar por patrimônio, loja, local, marca...'
                    className={`${inputClass} w-full max-w-sm`}
                />
                <FiltersMenu ativos={filtrosAtivos}>
                    <SelectFilter
                        label='Loja'
                        options={lojas.map((loja) => ({ value: loja.id, label: loja.name }))}
                        value={lojaFiltro}
                        onChange={setLojaFiltro}
                    />
                    <SelectFilter
                        label='Tipo'
                        options={tiposEquipamento.map((tipo) => ({ value: tipo.id, label: tipo.nome }))}
                        value={tipoFiltro}
                        onChange={setTipoFiltro}
                    />
                    <SelectFilter
                        label='Marca'
                        options={marcas.map((marca) => ({ value: marca.id, label: marca.nome }))}
                        value={marcaFiltro}
                        onChange={setMarcaFiltro}
                    />
                    <SelectFilter
                        label='Modelo'
                        options={modelos.map((modelo) => ({ value: modelo.id, label: modelo.nome }))}
                        value={modeloFiltro}
                        onChange={setModeloFiltro}
                    />
                    <SelectFilter label='Status' options={STATUS_OPCOES} value={statusFiltro} onChange={setStatusFiltro} />
                    <SelectFilter
                        label='Verificar'
                        options={VERIFICAR_OPCOES}
                        value={verificarFiltro}
                        onChange={setVerificarFiltro}
                    />
                </FiltersMenu>
            </div>

            {formAberto && (
                <Modal titulo={editandoId ? 'Editar equipamento' : 'Novo equipamento'} onFechar={fecharForm} largura='lg'>
                    {erroForm && <ErrorModal mensagem={erroForm} onFechar={() => setErroForm(null)} />}

                    <label className='mb-4 flex items-center gap-2 text-sm text-gray-text dark:text-dark-text'>
                        <input
                            type='checkbox'
                            checked={form.terceirizado}
                            onChange={(e) => alternarTerceirizado(e.target.checked)}
                        />
                        Aparelho terceirizado (sem patrimônio/código do aparelho)
                    </label>

                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                        <Field label='Patrimônio'>
                            <input
                                disabled={form.terceirizado}
                                type='number'
                                placeholder={form.terceirizado ? 'Terceirizado' : undefined}
                                className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
                                value={form.patrimonio}
                                onChange={(e) => setForm({ ...form, patrimonio: e.target.value })}
                            />
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
                        <SelectComNovo
                            label='Local'
                            endpoint='/tecnologia/locais'
                            itens={locais}
                            recarregar={recarregarLocais}
                            value={form.local_id}
                            onChange={(id) => setForm({ ...form, local_id: id })}
                        />
                        <SelectComNovo
                            label='Equipamento'
                            endpoint='/tecnologia/tipos-equipamento'
                            itens={tiposEquipamento}
                            recarregar={recarregarTiposEquipamento}
                            value={form.equipamento_id}
                            onChange={(id) => setForm({ ...form, equipamento_id: id })}
                        />
                        <SelectComNovo
                            label='Marca'
                            endpoint='/tecnologia/marcas'
                            itens={marcas}
                            recarregar={recarregarMarcas}
                            value={form.marca_id}
                            onChange={(id) => setForm({ ...form, marca_id: id })}
                        />
                        <SelectComNovo
                            label='Modelo'
                            endpoint='/tecnologia/modelos'
                            itens={modelos}
                            recarregar={recarregarModelos}
                            value={form.modelo_id}
                            onChange={(id) => setForm({ ...form, modelo_id: id })}
                        />
                        <Field label='IP'>
                            <input
                                type='text'
                                className={inputClass}
                                value={form.ip}
                                onChange={(e) => setForm({ ...form, ip: e.target.value })}
                            />
                        </Field>
                        <Field label='Código do aparelho (IMEI/Nº de série)'>
                            <input
                                disabled={form.terceirizado}
                                type='text'
                                placeholder={form.terceirizado ? 'Terceirizado' : undefined}
                                className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
                                value={form.codigo_aparelho}
                                onChange={(e) => setForm({ ...form, codigo_aparelho: e.target.value })}
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
                                checked={form.verificar}
                                onChange={(e) => setForm({ ...form, verificar: e.target.checked })}
                            />
                            Necessita verificação
                        </label>
                        <div className='sm:col-span-2 lg:col-span-3'>
                            <Field label='Observação (opcional)'>
                                <input
                                    type='text'
                                    className={inputClass}
                                    value={form.observacao}
                                    onChange={(e) => setForm({ ...form, observacao: e.target.value })}
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
                </Modal>
            )}

            {erroExclusao && <ErrorModal mensagem={erroExclusao} onFechar={() => setErroExclusao(null)} />}

            <DataTable
                loading={loading}
                erro={erro}
                rows={rowsFiltradas}
                columns={[
                    {
                        key: 'patrimonio',
                        label: 'Patrimônio',
                        wrap: true,
                        render: (row) => (
                            <CellStack
                                primary={row.patrimonio ?? (row.terceirizado ? 'Terceirizado' : '-')}
                                secondary={row.loja_nome}
                            />
                        ),
                    },
                    {
                        key: 'equipamento',
                        label: 'Equipamento',
                        wrap: true,
                        render: (row) => <CellStack primary={row.equipamento_nome ?? '-'} secondary={row.local_nome} />,
                    },
                    {
                        key: 'marca_modelo',
                        label: 'Marca/Modelo',
                        wrap: true,
                        render: (row) => <CellStack primary={row.marca_nome ?? '-'} secondary={row.modelo_nome} />,
                    },
                    {
                        key: 'ip_codigo',
                        label: 'IP/Código',
                        wrap: true,
                        render: (row) => <CellStack primary={row.ip ?? '-'} secondary={row.codigo_aparelho} />,
                    },
                    { key: 'observacao', label: 'Observação', wrap: true, render: (row) => row.observacao ?? '-' },
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
                                secondary={row.verificar ? 'Necessita verificação' : undefined}
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
                    titulo='Excluir equipamento'
                    mensagem={`Excluir o equipamento ${
                        paraExcluir.patrimonio !== null ? `de patrimônio ${paraExcluir.patrimonio}` : 'terceirizado'
                    }? Essa ação não pode ser desfeita.`}
                    confirmando={excluindo}
                    onConfirmar={confirmarExclusao}
                    onCancelar={() => setParaExcluir(null)}
                />
            )}
        </PageShell>
    )
}
