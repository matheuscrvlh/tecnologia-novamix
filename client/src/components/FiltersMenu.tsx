import { useEffect, useState, type ReactNode } from 'react'
import Modal from './Modal'
import { FilterIcon } from './icons'

type FiltersMenuProps = {
    children: ReactNode
    ativos?: number
}

export default function FiltersMenu({ children, ativos = 0 }: FiltersMenuProps) {
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        if (!isOpen) return
        const originalHtml = document.documentElement.style.overflow
        const originalBody = document.body.style.overflow
        document.documentElement.style.overflow = 'hidden'
        document.body.style.overflow = 'hidden'
        return () => {
            document.documentElement.style.overflow = originalHtml
            document.body.style.overflow = originalBody
        }
    }, [isOpen])

    function fechar() {
        setIsOpen(false)
    }

    return (
        <>
            <div className='hidden flex-wrap items-center gap-4 lg:flex'>{children}</div>

            <div className='lg:hidden'>
                <button
                    type='button'
                    onClick={() => setIsOpen(true)}
                    className='flex items-center gap-2 rounded-lg border border-gray-base/30 bg-white px-4 py-2 text-sm font-medium text-gray-text shadow-sm transition hover:border-orange-base dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                >
                    <FilterIcon className='h-4 w-4' />
                    Filtros
                    {ativos > 0 && (
                        <span className='flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-base px-1 text-xs font-semibold text-white'>
                            {ativos}
                        </span>
                    )}
                </button>

                {isOpen && (
                    <Modal titulo='Filtros' onFechar={fechar}>
                        <div className='flex flex-col gap-4'>{children}</div>
                    </Modal>
                )}
            </div>
        </>
    )
}
