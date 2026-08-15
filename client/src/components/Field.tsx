import type { ReactNode } from 'react'

export const inputClass =
    'rounded-lg border border-gray-base/30 bg-white px-3 py-2 text-sm text-gray-text outline-none transition focus:border-orange-base dark:border-dark-border dark:bg-dark-surface-2 dark:text-dark-text'

type FieldProps = {
    label: string
    children: ReactNode
}

export default function Field({ label, children }: FieldProps) {
    return (
        <label className='flex flex-col gap-1 text-sm'>
            <span className='text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                {label}
            </span>
            {children}
        </label>
    )
}
