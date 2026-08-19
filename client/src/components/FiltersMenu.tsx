import { useState, type ReactNode } from 'react'
import { ChevronDownIcon, FilterIcon } from './icons'

type FiltersMenuProps = {
    children: ReactNode
    ativos?: number
}

export default function FiltersMenu({ children, ativos = 0 }: FiltersMenuProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <button
                type='button'
                onClick={() => setIsOpen((open) => !open)}
                className='flex items-center gap-2 rounded-lg border border-gray-base/30 bg-white px-4 py-2 text-sm font-medium text-gray-text shadow-sm transition hover:border-orange-base dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
            >
                <FilterIcon className='h-4 w-4' />
                Filtros
                {ativos > 0 && (
                    <span className='flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-base px-1 text-xs font-semibold text-white'>
                        {ativos}
                    </span>
                )}
                <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className='basis-full rounded-xl border border-gray-base/30 bg-white p-4 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                    <div className='flex flex-wrap items-center gap-4'>{children}</div>
                </div>
            )}
        </>
    )
}
