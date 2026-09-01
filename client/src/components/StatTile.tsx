import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

type Tone = 'neutral' | 'good' | 'warning' | 'critical'

type StatTileProps = {
    label: string
    value: string
    hint?: string
    tone?: Tone
    icon: LucideIcon
    extra?: ReactNode
}

const TONE_BG: Record<Tone, string> = {
    neutral: 'bg-blue-base',
    good: 'bg-green-base',
    warning: 'bg-orange-base',
    critical: 'bg-red-base',
}

export default function StatTile({ label, value, hint, tone = 'neutral', icon: Icon, extra }: StatTileProps) {
    return (
        <div className='flex items-start gap-4 rounded-xl border border-gray-base/30 bg-white p-5 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white ${TONE_BG[tone]}`}>
                <Icon className='h-5 w-5' />
            </span>
            <div className='min-w-0 flex-1'>
                <div className='flex items-baseline justify-between gap-2'>
                    <span className='text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                        {label}
                    </span>
                    {extra}
                </div>
                <p className='mt-1 text-2xl font-semibold text-gray-text dark:text-dark-text'>{value}</p>
                {hint && <p className='mt-1 truncate text-xs text-gray-dark dark:text-dark-text-muted'>{hint}</p>}
            </div>
        </div>
    )
}
