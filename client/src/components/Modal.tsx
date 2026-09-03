import { useEffect, type ReactNode } from 'react'
import { CloseIcon } from './icons'

type ModalProps = {
    titulo: string
    onFechar: () => void
    children: ReactNode
    largura?: 'md' | 'lg'
}

const LARGURAS = {
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
}

export default function Modal({ titulo, onFechar, children, largura = 'md' }: ModalProps) {
    useEffect(() => {
        const originalHtml = document.documentElement.style.overflow
        const originalBody = document.body.style.overflow
        document.documentElement.style.overflow = 'hidden'
        document.body.style.overflow = 'hidden'
        return () => {
            document.documentElement.style.overflow = originalHtml
            document.body.style.overflow = originalBody
        }
    }, [])

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4'>
            <div className='absolute inset-0 bg-black/50' onClick={onFechar} />

            <div
                className={`relative flex h-dvh w-full sm:h-auto sm:max-h-[85vh] ${LARGURAS[largura]} flex-col bg-white shadow-lg sm:rounded-xl dark:bg-dark-surface`}
            >
                <div className='flex shrink-0 items-center justify-between border-b border-gray-base/30 px-6 py-4 dark:border-dark-border'>
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
