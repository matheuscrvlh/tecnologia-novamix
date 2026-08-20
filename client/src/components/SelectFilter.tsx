import { inputClass } from './Field'

type SelectFilterOption<T> = {
    value: T
    label: string
}

type SelectFilterProps<T> = {
    label: string
    options: SelectFilterOption<T>[]
    value: T | 'all'
    onChange: (value: T | 'all') => void
}

export default function SelectFilter<T extends string | number | boolean>({
    label,
    options,
    value,
    onChange,
}: SelectFilterProps<T>) {
    function handleChange(raw: string) {
        if (raw === 'all') {
            onChange('all')
            return
        }
        const opcao = options.find((opt) => String(opt.value) === raw)
        if (opcao) onChange(opcao.value)
    }

    return (
        <label className='flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
            {label}
            <select
                value={value === 'all' ? 'all' : String(value)}
                onChange={(e) => handleChange(e.target.value)}
                className={`${inputClass} min-w-35 text-sm font-normal normal-case`}
            >
                <option value='all'>Todos</option>
                {options.map((opt) => (
                    <option key={String(opt.value)} value={String(opt.value)}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </label>
    )
}
