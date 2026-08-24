import { Pencil, Trash2 } from 'lucide-react'

type RowActionsProps = {
    onEditar: () => void
    onExcluir: () => void
}

export default function RowActions({ onEditar, onExcluir }: RowActionsProps) {
    return (
        <div className='flex justify-end gap-2'>
            <button
                type='button'
                onClick={onEditar}
                title='Editar'
                aria-label='Editar'
                className='flex h-8 w-8 items-center justify-center rounded-lg bg-blue-base text-white transition-opacity hover:opacity-80'
            >
                <Pencil className='h-4 w-4' />
            </button>
            <button
                type='button'
                onClick={onExcluir}
                title='Excluir'
                aria-label='Excluir'
                className='flex h-8 w-8 items-center justify-center rounded-lg bg-red-base text-white transition-opacity hover:opacity-80'
            >
                <Trash2 className='h-4 w-4' />
            </button>
        </div>
    )
}
