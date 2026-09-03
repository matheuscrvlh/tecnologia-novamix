import { useState } from 'react'
import Field, { inputClass } from './Field'
import { apiPost } from '../lib/api'
import type { CadastroSimples } from '../types/tecnologia'

type SelectComNovoProps = {
    label: string
    endpoint: string
    itens: CadastroSimples[]
    recarregar: () => Promise<void>
    value: string
    onChange: (id: string) => void
}

export default function SelectComNovo({ label, endpoint, itens, recarregar, value, onChange }: SelectComNovoProps) {
    const [novoAberto, setNovoAberto] = useState(false)
    const [novoNome, setNovoNome] = useState('')
    const [salvando, setSalvando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    const ativos = itens.filter((item) => item.status)
    const selecionadoInativo = value && !ativos.some((item) => String(item.id) === value)
        ? itens.find((item) => String(item.id) === value)
        : undefined
    const opcoes = selecionadoInativo ? [...ativos, selecionadoInativo] : ativos

    async function salvarNovo() {
        if (!novoNome.trim()) {
            setErro('Informe o nome.')
            return
        }

        setSalvando(true)
        setErro(null)

        try {
            const criado = await apiPost<CadastroSimples>(endpoint, { nome: novoNome.trim(), status: true })
            await recarregar()
            onChange(String(criado.id))
            setNovoAberto(false)
            setNovoNome('')
        } catch (err) {
            setErro(err instanceof Error ? err.message : 'Erro ao salvar.')
        } finally {
            setSalvando(false)
        }
    }

    return (
        <div>
            <Field label={label}>
                <div className='flex flex-col gap-2 sm:flex-row'>
                    <select className={`${inputClass} sm:flex-1`} value={value} onChange={(e) => onChange(e.target.value)}>
                        <option value=''>Selecione...</option>
                        {opcoes.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.nome}
                            </option>
                        ))}
                    </select>
                    <button
                        type='button'
                        onClick={() => setNovoAberto((v) => !v)}
                        className='rounded-lg border border-orange-base px-3 py-2 text-sm font-semibold text-orange-base transition-colors hover:bg-orange-base/10'
                    >
                        + novo
                    </button>
                </div>
            </Field>

            {novoAberto && (
                <div className='mt-2 flex flex-col gap-2'>
                    <div>
                        <input
                            type='text'
                            className={`${inputClass} w-full`}
                            placeholder={`Nome (${label.toLowerCase()})`}
                            value={novoNome}
                            onChange={(e) => setNovoNome(e.target.value)}
                        />
                        {erro && <p className='mt-1 text-xs font-medium text-red-base'>{erro}</p>}
                    </div>
                    <div className='flex items-center gap-2'>
                        <button
                            type='button'
                            disabled={salvando}
                            onClick={salvarNovo}
                            className='rounded-lg bg-orange-base px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-light disabled:opacity-60'
                        >
                            {salvando ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button
                            type='button'
                            onClick={() => {
                                setNovoAberto(false)
                                setErro(null)
                                setNovoNome('')
                            }}
                            className='rounded-lg px-3 py-2 text-sm font-semibold text-gray-text transition-colors hover:bg-gray dark:text-dark-text dark:hover:bg-dark-surface-2'
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
