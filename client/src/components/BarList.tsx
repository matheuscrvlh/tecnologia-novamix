import { useState } from 'react'

type BarListItem = {
    label: string
    value: number
    cor?: string
}

type BarListProps = {
    titulo: string
    itens: BarListItem[]
    formatarValor?: (valor: number) => string
    cor?: string
    maxItens?: number
}

export default function BarList({
    titulo,
    itens,
    formatarValor = (v) => String(v),
    cor = 'bg-orange-base',
    maxItens = 6,
}: BarListProps) {
    const [emFoco, setEmFoco] = useState<number | null>(null)

    const total = itens.reduce((soma, item) => soma + item.value, 0)
    const maximo = Math.max(1, ...itens.map((item) => item.value))

    const visiveis = itens.slice(0, maxItens)
    const restantes = itens.slice(maxItens)
    const restanteTotal = restantes.reduce((soma, item) => soma + item.value, 0)

    return (
        <div className='rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
            <div className='flex items-baseline justify-between gap-3'>
                <span className='text-sm font-medium text-gray-text dark:text-dark-text'>{titulo}</span>
                {total > 0 && (
                    <span className='shrink-0 text-xs text-gray-dark dark:text-dark-text-muted'>
                        {formatarValor(total)} no total
                    </span>
                )}
            </div>

            {itens.length === 0 ? (
                <div className='mt-3 text-sm text-gray-dark dark:text-dark-text-muted'>Sem dados ainda.</div>
            ) : (
                <div className='mt-4 flex flex-col gap-0.5'>
                    {visiveis.map((item, indice) => {
                        const percentual = total > 0 ? (item.value / total) * 100 : 0
                        return (
                            <div
                                key={indice}
                                className='relative flex items-center gap-3 rounded-lg px-1 py-1.5 transition-colors hover:bg-gray/60 dark:hover:bg-dark-surface-2/60'
                                onMouseEnter={() => setEmFoco(indice)}
                                onMouseLeave={() => setEmFoco((atual) => (atual === indice ? null : atual))}
                                onFocus={() => setEmFoco(indice)}
                                onBlur={() => setEmFoco((atual) => (atual === indice ? null : atual))}
                                tabIndex={0}
                            >
                                <span className='w-24 shrink-0 truncate text-xs text-gray-dark sm:w-28 dark:text-dark-text-muted'>
                                    {item.label}
                                </span>
                                <div className='h-2.5 flex-1 rounded-sm bg-gray dark:bg-dark-surface-2'>
                                    <div
                                        className={`h-2.5 rounded-r transition-[filter] ${item.cor ?? cor} ${
                                            emFoco === indice ? 'brightness-110' : ''
                                        }`}
                                        style={{ width: `${Math.max(2, (item.value / maximo) * 100)}%` }}
                                    />
                                </div>
                                <span className='w-24 shrink-0 text-right text-xs font-semibold text-gray-text tabular-nums dark:text-dark-text'>
                                    {formatarValor(item.value)}
                                </span>

                                {emFoco === indice && (
                                    <div className='pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 rounded-md bg-gray-text px-2 py-1 text-xs whitespace-nowrap text-white shadow-lg dark:bg-dark-bg'>
                                        <span className='font-semibold'>{formatarValor(item.value)}</span>
                                        <span className='ml-1 text-white/70'>({percentual.toFixed(0)}%)</span>
                                    </div>
                                )}
                            </div>
                        )
                    })}

                    {restantes.length > 0 && (
                        <div className='flex items-center gap-3 rounded-lg px-1 py-1.5 text-gray-dark dark:text-dark-text-muted'>
                            <span className='w-24 shrink-0 truncate text-xs sm:w-28'>+{restantes.length} outros</span>
                            <div className='h-2.5 flex-1 rounded-sm bg-gray dark:bg-dark-surface-2'>
                                <div
                                    className='h-2.5 rounded-r bg-gray-dark/30 dark:bg-dark-text-muted/30'
                                    style={{ width: `${Math.max(2, (restanteTotal / maximo) * 100)}%` }}
                                />
                            </div>
                            <span className='w-24 shrink-0 text-right text-xs font-semibold tabular-nums'>
                                {formatarValor(restanteTotal)}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
