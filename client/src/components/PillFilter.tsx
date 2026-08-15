type PillFilterOption<T> = {
    value: T
    label: string
}

type PillFilterProps<T> = {
    label: string
    options: PillFilterOption<T>[]
    selected: T[]
    onChange: (value: T[]) => void
}

export default function PillFilter<T>({ label, options, selected, onChange }: PillFilterProps<T>) {
    const baseClass = 'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors'
    const activeClass = 'border-orange-base bg-orange-base text-white'
    const inactiveClass =
        'border-gray-base/30 bg-white text-gray-text hover:border-orange-base dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'

    const todasSelecionadas = options.every((opt) => selected.includes(opt.value))

    function alternar(value: T) {
        if (selected.includes(value)) {
            const restante = selected.filter((v) => v !== value)
            onChange(restante.length > 0 ? restante : options.map((o) => o.value))
            return
        }
        onChange([...selected, value])
    }

    if (options.length === 0) return null

    return (
        <div className='flex flex-wrap items-center gap-2'>
            <span className='text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                {label}
            </span>
            {options.length > 1 && (
                <button
                    type='button'
                    className={`${baseClass} ${todasSelecionadas ? activeClass : inactiveClass}`}
                    onClick={() => onChange(options.map((o) => o.value))}
                >
                    Todos
                </button>
            )}
            {options.map((opt) => (
                <button
                    key={String(opt.value)}
                    type='button'
                    className={`${baseClass} ${selected.includes(opt.value) ? activeClass : inactiveClass}`}
                    onClick={() => alternar(opt.value)}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    )
}
