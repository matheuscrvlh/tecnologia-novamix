import { useEffect, useRef, useState } from 'react'
import { inputClass } from './Field'
import type { Equipamento } from '../types/tecnologia'

type PatrimonioSelectProps = {
    equipamentos: Equipamento[]
    value: string
    onChangeValue: (patrimonio: string) => void
    onSelecionar: (equipamento: Equipamento) => void
}

export default function PatrimonioSelect({ equipamentos, value, onChangeValue, onSelecionar }: PatrimonioSelectProps) {
    const [aberto, setAberto] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function onClickFora(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setAberto(false)
            }
        }
        document.addEventListener('mousedown', onClickFora)
        return () => document.removeEventListener('mousedown', onClickFora)
    }, [])

    const comPatrimonio = equipamentos.filter((eq): eq is Equipamento & { patrimonio: number } => eq.patrimonio !== null)

    const termo = value.trim().toLowerCase()
    const opcoes = termo
        ? comPatrimonio.filter((eq) =>
              [eq.patrimonio, eq.equipamento_nome, eq.marca_nome, eq.modelo_nome, eq.loja_nome]
                  .join(' ')
                  .toLowerCase()
                  .includes(termo)
          )
        : comPatrimonio

    function selecionar(eq: Equipamento) {
        onSelecionar(eq)
        setAberto(false)
    }

    return (
        <div ref={containerRef} className='relative'>
            <input
                type='text'
                inputMode='numeric'
                autoComplete='off'
                className={`${inputClass} w-full`}
                placeholder='Buscar patrimônio...'
                value={value}
                onFocus={() => setAberto(true)}
                onChange={(e) => {
                    onChangeValue(e.target.value)
                    setAberto(true)
                }}
            />
            {aberto && opcoes.length > 0 && (
                <div className='absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-base/30 bg-white shadow-lg dark:border-dark-border dark:bg-dark-surface-2'>
                    {opcoes.slice(0, 30).map((eq) => (
                        <button
                            key={eq.id}
                            type='button'
                            onMouseDown={(e) => {
                                e.preventDefault()
                                selecionar(eq)
                            }}
                            className='block w-full px-3 py-2 text-left text-sm text-gray-text hover:bg-orange-base/10 dark:text-dark-text'
                        >
                            <span className='font-medium'>{eq.patrimonio}</span>
                            <span className='ml-2 text-xs text-gray-dark dark:text-dark-text-muted'>
                                {[eq.equipamento_nome, eq.marca_nome, eq.modelo_nome, eq.loja_nome]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
