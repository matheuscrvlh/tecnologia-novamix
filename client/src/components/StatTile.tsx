type Tone = 'neutral' | 'good' | 'warning' | 'critical'

type StatTileProps = {
    label: string
    value: string
    hint?: string
    tone?: Tone
}

const TONE_DOT: Record<Tone, string> = {
    neutral: 'bg-orange-base',
    good: 'bg-green-base',
    warning: 'bg-orange-light',
    critical: 'bg-red-base',
}

export default function StatTile({ label, value, hint, tone = 'neutral' }: StatTileProps) {
    return (
        <div className='rounded-xl border border-gray-base/30 bg-white p-5 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
            <div className='flex items-center gap-2'>
                <span className={`h-2 w-2 rounded-full ${TONE_DOT[tone]}`} />
                <span className='text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                    {label}
                </span>
            </div>
            <p className='mt-2 text-2xl font-semibold text-gray-text dark:text-dark-text'>{value}</p>
            {hint && <p className='mt-1 text-xs text-gray-dark dark:text-dark-text-muted'>{hint}</p>}
        </div>
    )
}
