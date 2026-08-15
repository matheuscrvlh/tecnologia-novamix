import type { ReactNode } from 'react'
import { CloseIcon } from './icons'

type ModalProps = {
    titulo: string
    onFechar: () => void
    children: ReactNode
}

export default function Modal({ titulo, onFechar, children }: ModalProps) {
    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <div className='absolute inset-0 bg-black/50' onClick={onFechar} />

            <div className='relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-lg dark:bg-dark-surface'>
                <div className='flex items-center justify-between border-b border-gray-base/30 px-6 py-4 dark:border-dark-border'>
                    <h2 className='text-sm font-semibold text-gray-text dark:text-dark-text'>{titulo}</h2>
                    <button
                        type='button'
                        onClick={onFechar}
                        aria-label='Fechar'
                        className='text-gray-dark transition-colors hover:text-gray-text dark:text-dark-text-muted dark:hover:text-dark-text'
                    >
                        <CloseIcon className='h-5 w-5' />
                    </button>
                </div>

                <div className='overflow-y-auto px-6 py-4'>{children}</div>
            </div>
        </div>
    )
}
