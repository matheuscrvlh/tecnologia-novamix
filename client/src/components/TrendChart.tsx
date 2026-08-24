type TrendPoint = {
    label: string
    value: number
}

type TrendChartProps = {
    titulo: string
    pontos: TrendPoint[]
    formatarValor?: (valor: number) => string
}

export default function TrendChart({ titulo, pontos, formatarValor = (v) => String(v) }: TrendChartProps) {
    const maximo = Math.max(1, ...pontos.map((p) => p.value))
    const semDados = pontos.every((p) => p.value === 0)

    return (
        <div className='rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
            <span className='text-sm font-medium text-gray-text dark:text-dark-text'>{titulo}</span>

            {semDados ? (
                <div className='mt-3 text-sm text-gray-dark dark:text-dark-text-muted'>Sem dados ainda.</div>
            ) : (
                <div className='mt-6 flex items-end gap-3'>
                    {pontos.map((ponto) => (
                        <div key={ponto.label} className='group flex flex-1 flex-col items-center gap-2'>
                            <span className='text-[11px] font-semibold text-gray-text dark:text-dark-text'>
                                {formatarValor(ponto.value)}
                            </span>
                            <div
                                className='flex h-32 w-full items-end border-b border-gray-base/30 dark:border-dark-border'
                                title={`${ponto.label}: ${formatarValor(ponto.value)}`}
                            >
                                <div
                                    className='w-full rounded-t bg-orange-base transition-opacity group-hover:opacity-70'
                                    style={{ height: `${Math.max(4, (ponto.value / maximo) * 100)}%` }}
                                />
                            </div>
                            <span className='text-[11px] text-gray-dark dark:text-dark-text-muted'>{ponto.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
