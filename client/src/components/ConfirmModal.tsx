import Modal from './Modal'

type ConfirmModalProps = {
    titulo: string
    mensagem: string
    confirmando?: boolean
    onConfirmar: () => void
    onCancelar: () => void
}

export default function ConfirmModal({ titulo, mensagem, confirmando, onConfirmar, onCancelar }: ConfirmModalProps) {
    return (
        <Modal titulo={titulo} onFechar={onCancelar}>
            <p className='text-sm text-gray-text dark:text-dark-text'>{mensagem}</p>

            <div className='mt-6 flex items-center justify-end gap-3'>
                <button
                    type='button'
                    onClick={onCancelar}
                    className='rounded-lg px-4 py-2 text-sm font-semibold text-gray-text transition-colors hover:bg-gray dark:text-dark-text dark:hover:bg-dark-surface-2'
                >
                    Cancelar
                </button>
                <button
                    type='button'
                    disabled={confirmando}
                    onClick={onConfirmar}
                    className='rounded-lg bg-red-base px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-light disabled:opacity-60'
                >
                    {confirmando ? 'Excluindo...' : 'Excluir'}
                </button>
            </div>
        </Modal>
    )
}
