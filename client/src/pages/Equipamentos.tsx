import { useState } from 'react'
import PageShell from '../components/PageShell'
import DataTable from '../components/DataTable'
import ConfirmModal from '../components/ConfirmModal'
import RowActions from '../components/RowActions'
import Field, { inputClass } from '../components/Field'
import SelectComNovo from '../components/SelectComNovo'
import PillFilter from '../components/PillFilter'
import FiltersMenu from '../components/FiltersMenu'
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

    const [lojasSelecionadas, setLojasSelecionadas] = useState<number[]>([])
    const [statusSelecionado, setStatusSelecionado] = useState<boolean[]>([])
    const [verificarSelecionado, setVerificarSelecionado] = useState<boolean[]>([])

    const lojasAtivas = lojasSelecionadas.length > 0 ? lojasSelecionadas : lojas.map((l) => l.id)
    const statusAtivo = statusSelecionado.length > 0 ? statusSelecionado : [true, false]
    const verificarAtivo = verificarSelecionado.length > 0 ? verificarSelecionado : [true, false]
    const filtrosAtivos =
        (lojasSelecionadas.length > 0 ? 1 : 0) +
        (statusSelecionado.length > 0 ? 1 : 0) +
        (verificarSelecionado.length > 0 ? 1 : 0)

    const termo = busca.trim().toLowerCase()
    const rowsFiltradas = rows.filter((row) => {
        if (!lojasAtivas.includes(row.filial_id)) return false
        if (!statusAtivo.includes(row.status)) return false
        if (!verificarAtivo.includes(row.verificar)) return false
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
            patrimonio: String(row.patrimonio),
            filial_id: String(row.filial_id),
            local_id: String(row.local_id),
            equipamento_id: String(row.equipamento_id),
            marca_id: String(row.marca_id),
            modelo_id: String(row.modelo_id),
            ip: row.ip ?? '',
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

    async function salvar() {
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
            patrimonio: Number(form.patrimonio),
            filial_id: Number(form.filial_id),
            local_id: Number(form.local_id),
            equipamento_id: Number(form.equipamento_id),
            marca_id: Number(form.marca_id),
            modelo_id: Number(form.modelo_id),
            ip: form.ip || null,
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
        >
            <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
                <div className='flex flex-wrap items-center gap-3'>
                    <input
                        type='text'
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder='Buscar por patrimônio, loja, local, marca...'
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
                        <PillFilter
                            label='Verificar'
                            options={VERIFICAR_OPCOES}
                            selected={verificarAtivo}
                            onChange={setVerificarSelecionado}
                        />
                    </FiltersMenu>
                </div>
                <button
                    type='button'
                    onClick={abrirNovo}
                    className='rounded-lg bg-orange-base px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-light'
                >
                    Novo equipamento
                </button>
            </div>

            {formAberto && (
                <div className='mb-6 rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                    <h2 className='mb-4 text-sm font-semibold text-gray-text dark:text-dark-text'>
                        {editandoId ? 'Editar equipamento' : 'Novo equipamento'}
                    </h2>

                    {erroForm && (
                        <div className='mb-4 rounded-lg bg-red-light/10 px-4 py-3 text-sm font-medium text-red-base'>
                            {erroForm}
                        </div>
                    )}

                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                        <Field label='Patrimônio'>
                            <input
                                type='number'
                                className={inputClass}
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
                    { key: 'patrimonio', label: 'Patrimônio', render: (row) => row.patrimonio },
                    { key: 'loja', label: 'Loja', render: (row) => row.loja_nome ?? '-' },
                    { key: 'local', label: 'Local', render: (row) => row.local_nome ?? '-' },
                    { key: 'equipamento', label: 'Equipamento', render: (row) => row.equipamento_nome ?? '-' },
                    { key: 'marca', label: 'Marca', render: (row) => row.marca_nome ?? '-' },
                    { key: 'modelo', label: 'Modelo', render: (row) => row.modelo_nome ?? '-' },
                    { key: 'ip', label: 'IP', render: (row) => row.ip ?? '-' },
                    {
                        key: 'status',
                        label: 'Status',
                        render: (row) => (
                            <span className={row.status ? 'text-green-base' : 'text-red-base'}>
                                {row.status ? 'Ativo' : 'Inativo'}
                            </span>
                        ),
                    },
                    { key: 'verificar', label: 'Verificar', render: (row) => (row.verificar ? 'Sim' : 'Não') },
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
                    mensagem={`Excluir o equipamento de patrimônio ${paraExcluir.patrimonio}? Essa ação não pode ser desfeita.`}
                    confirmando={excluindo}
                    onConfirmar={confirmarExclusao}
                    onCancelar={() => setParaExcluir(null)}
                />
            )}
        </PageShell>
    )
}
