import { inputClass } from './Field'

type DateRangeFilterProps = {
    label: string
    inicio: string
    fim: string
    onChangeInicio: (value: string) => void
    onChangeFim: (value: string) => void
}

export default function DateRangeFilter({ label, inicio, fim, onChangeInicio, onChangeFim }: DateRangeFilterProps) {
    return (
        <div className='flex flex-wrap items-center gap-2'>
            <span className='text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                {label}
            </span>
            <input type='date' value={inicio} onChange={(e) => onChangeInicio(e.target.value)} className={inputClass} />
            <span className='text-sm text-gray-dark dark:text-dark-text-muted'>até</span>
            <input type='date' value={fim} onChange={(e) => onChangeFim(e.target.value)} className={inputClass} />
            {(inicio || fim) && (
                <button
                    type='button'
                    onClick={() => {
                        onChangeInicio('')
                        onChangeFim('')
                    }}
                    className='text-xs font-semibold text-gray-dark hover:text-red-base dark:text-dark-text-muted'
                >
                    Limpar
                </button>
            )}
        </div>
    )
}
