type BarListItem = {
    label: string
    value: number
}

type BarListProps = {
    titulo: string
    itens: BarListItem[]
    formatarValor?: (valor: number) => string
}

export default function BarList({ titulo, itens, formatarValor = (v) => String(v) }: BarListProps) {
    const maximo = Math.max(1, ...itens.map((item) => item.value))

    return (
        <div className='rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
            <span className='text-sm font-medium text-gray-text dark:text-dark-text'>{titulo}</span>

            {itens.length === 0 ? (
                <div className='mt-3 text-sm text-gray-dark dark:text-dark-text-muted'>Sem dados ainda.</div>
            ) : (
                <div className='mt-4 flex flex-col gap-3'>
                    {itens.map((item) => (
                        <div key={item.label} className='flex items-center gap-3' title={`${item.label}: ${formatarValor(item.value)}`}>
                            <span className='w-28 shrink-0 truncate text-xs text-gray-dark dark:text-dark-text-muted'>
                                {item.label}
                            </span>
                            <div className='h-3 flex-1 bg-gray dark:bg-dark-surface-2'>
                                <div
                                    className='h-3 bg-orange-base'
                                    style={{ width: `${(item.value / maximo) * 100}%`, borderRadius: '0 4px 4px 0' }}
                                />
                            </div>
                            <span className='w-20 shrink-0 text-right text-xs font-semibold text-gray-text dark:text-dark-text'>
                                {formatarValor(item.value)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
