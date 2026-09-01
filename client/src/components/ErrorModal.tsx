import Modal from './Modal'

type ErrorModalProps = {
    titulo?: string
    mensagem: string
    onFechar: () => void
}

export default function ErrorModal({ titulo = 'Erro', mensagem, onFechar }: ErrorModalProps) {
    return (
        <Modal titulo={titulo} onFechar={onFechar}>
            <p className='text-sm text-gray-text dark:text-dark-text'>{mensagem}</p>

            <div className='mt-6 flex items-center justify-end'>
                <button
                    type='button'
                    onClick={onFechar}
                    className='rounded-lg bg-orange-base px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-light'
                >
                    Entendi
                </button>
            </div>
        </Modal>
    )
}
