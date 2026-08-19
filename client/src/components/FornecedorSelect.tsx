import { useState } from 'react'
import Field, { inputClass } from './Field'
import { apiPost } from '../lib/api'
import { formatCnpjInput, onlyDigits } from '../lib/format'
import type { Fornecedor } from '../types/tecnologia'

const FORNECEDOR_VAZIO = { empresa: '', cnpj: '', endereco: '', cep: '' }

type FornecedorSelectProps = {
    fornecedores: Fornecedor[]
    recarregar: () => Promise<void>
    value: string
    onChange: (id: string) => void
}

export default function FornecedorSelect({ fornecedores, recarregar, value, onChange }: FornecedorSelectProps) {
    const [novoAberto, setNovoAberto] = useState(false)
    const [novoFornecedor, setNovoFornecedor] = useState(FORNECEDOR_VAZIO)
    const [salvando, setSalvando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    async function salvarFornecedor() {
        if (!novoFornecedor.empresa.trim()) {
            setErro('Informe o nome da empresa.')
            return
        }

        const cnpjDigitos = onlyDigits(novoFornecedor.cnpj)
        if (cnpjDigitos && cnpjDigitos.length !== 14) {
            setErro('CNPJ deve conter 14 dígitos.')
            return
        }

        setSalvando(true)
        setErro(null)

        try {
            const criado = await apiPost<Fornecedor>('/tecnologia/fornecedores', {
                empresa: novoFornecedor.empresa,
                cnpj: cnpjDigitos || null,
                endereco: novoFornecedor.endereco || null,
                cep: novoFornecedor.cep || null,
                status: true,
            })
            await recarregar()
            onChange(String(criado.id))
            setNovoAberto(false)
            setNovoFornecedor(FORNECEDOR_VAZIO)
        } catch (err) {
            setErro(err instanceof Error ? err.message : 'Erro ao salvar fornecedor.')
        } finally {
            setSalvando(false)
        }
    }

    return (
        <div>
            <Field label='Fornecedor'>
                <div className='flex gap-2'>
                    <select
                        className={`${inputClass} flex-1`}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
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
                        onClick={() => setNovoAberto((v) => !v)}
                        className='rounded-lg border border-orange-base px-3 text-sm font-semibold text-orange-base transition-colors hover:bg-orange-base/10'
                    >
                        + novo
                    </button>
                </div>
            </Field>

            {novoAberto && (
                <div className='mt-4 rounded-lg border border-orange-base/30 bg-orange-base/5 p-4'>
                    <h3 className='mb-3 text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                        Novo fornecedor
                    </h3>

                    {erro && (
                        <div className='mb-3 rounded-lg bg-red-light/10 px-3 py-2 text-sm font-medium text-red-base'>
                            {erro}
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
                                onChange={(e) => setNovoFornecedor({ ...novoFornecedor, cnpj: formatCnpjInput(e.target.value) })}
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
                            disabled={salvando}
                            onClick={salvarFornecedor}
                            className='rounded-lg bg-orange-base px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-orange-light disabled:opacity-60'
                        >
                            {salvando ? 'Salvando...' : 'Salvar fornecedor'}
                        </button>
                        <button
                            type='button'
                            onClick={() => {
                                setNovoAberto(false)
                                setErro(null)
                            }}
                            className='rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-text transition-colors hover:bg-gray dark:text-dark-text dark:hover:bg-dark-surface-2'
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
