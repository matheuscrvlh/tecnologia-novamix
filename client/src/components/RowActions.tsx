type RowActionsProps = {
    onEditar: () => void
    onExcluir: () => void
}

export default function RowActions({ onEditar, onExcluir }: RowActionsProps) {
    return (
        <div className='flex justify-end gap-3'>
            <button
                type='button'
                onClick={onEditar}
                title='Editar'
                aria-label='Editar'
                className='text-base leading-none transition-transform hover:scale-110'
            >
                ✏️
            </button>
            <button
                type='button'
                onClick={onExcluir}
                title='Excluir'
                aria-label='Excluir'
                className='text-base leading-none transition-transform hover:scale-110'
            >
                🗑️
            </button>
        </div>
    )
}
