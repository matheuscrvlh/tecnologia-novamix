import { useState } from 'react'
import PageShell from '../components/PageShell'
import DataTable from '../components/DataTable'
import Field, { inputClass } from '../components/Field'
import { useMe } from '../hooks/useMe'
import { useLista } from '../hooks/useLista'
import { apiPost, apiPut, apiDelete } from '../lib/api'
import type { Equipamento, Loja } from '../types/tecnologia'

const FORM_VAZIO = {
    patrimonio: '',
    filial_id: '',
    local: '',
    equipamento: '',
    marca: '',
    modelo: '',
    ip: '',
    status: true,
    verificar: false,
}

export default function Equipamentos() {
    const { me, loading: loadingMe, error: meError } = useMe()
    const { rows, loading, erro, recarregar } = useLista<Equipamento>('/tecnologia/equipamentos')
    const { rows: lojas } = useLista<Loja>('/tecnologia/lojas')

    const [busca, setBusca] = useState('')
    const [formAberto, setFormAberto] = useState(false)
    const [editandoId, setEditandoId] = useState<number | null>(null)
    const [form, setForm] = useState(FORM_VAZIO)
    const [salvando, setSalvando] = useState(false)
    const [erroForm, setErroForm] = useState<string | null>(null)

    const termo = busca.trim().toLowerCase()
    const rowsFiltradas = termo
        ? rows.filter((row) =>
              [row.patrimonio, row.loja_nome, row.local, row.equipamento, row.marca, row.modelo]
                  .join(' ')
                  .toLowerCase()
                  .includes(termo)
          )
        : rows

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
            local: row.local,
            equipamento: row.equipamento,
            marca: row.marca,
            modelo: row.modelo,
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

        setSalvando(true)
        setErroForm(null)

        const payload = {
            patrimonio: Number(form.patrimonio),
            filial_id: Number(form.filial_id),
            local: form.local,
            equipamento: form.equipamento,
            marca: form.marca,
            modelo: form.modelo,
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

    async function excluir(row: Equipamento) {
        if (!window.confirm(`Excluir o equipamento de patrimônio ${row.patrimonio}?`)) return
        await apiDelete(`/tecnologia/equipamentos/${row.id}`)
        await recarregar()
    }

    return (
        <PageShell
            loadingMe={loadingMe}
            meError={meError}
            autorizado={me !== null}
            titulo='Equipamentos'
            subtitulo='Equipamentos de TI cadastrados por loja.'
        >
            <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
                <input
                    type='text'
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder='Buscar por patrimônio, loja, local, marca...'
                    className={`${inputClass} w-full max-w-sm`}
                />
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
                        <Field label='Local'>
                            <input
                                type='text'
                                className={inputClass}
                                value={form.local}
                                onChange={(e) => setForm({ ...form, local: e.target.value })}
                            />
                        </Field>
                        <Field label='Equipamento'>
                            <input
                                type='text'
                                className={inputClass}
                                value={form.equipamento}
                                onChange={(e) => setForm({ ...form, equipamento: e.target.value })}
                            />
                        </Field>
                        <Field label='Marca'>
                            <input
                                type='text'
                                className={inputClass}
                                value={form.marca}
                                onChange={(e) => setForm({ ...form, marca: e.target.value })}
                            />
                        </Field>
                        <Field label='Modelo'>
                            <input
                                type='text'
                                className={inputClass}
                                value={form.modelo}
                                onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                            />
                        </Field>
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

            <DataTable
                loading={loading}
                erro={erro}
                rows={rowsFiltradas}
                columns={[
                    { key: 'patrimonio', label: 'Patrimônio', render: (row) => row.patrimonio },
                    { key: 'loja', label: 'Loja', render: (row) => row.loja_nome ?? '-' },
                    { key: 'local', label: 'Local', render: (row) => row.local },
                    { key: 'equipamento', label: 'Equipamento', render: (row) => row.equipamento },
                    { key: 'marca', label: 'Marca', render: (row) => row.marca },
                    { key: 'modelo', label: 'Modelo', render: (row) => row.modelo },
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
                                    onClick={() => excluir(row)}
                                    className='font-semibold text-red-base hover:text-red-light'
                                >
                                    Excluir
                                </button>
                            </div>
                        ),
                    },
                ]}
            />
        </PageShell>
    )
}
