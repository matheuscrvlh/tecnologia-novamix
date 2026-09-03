import { useRef, useState } from 'react'
import { Upload, Eye, Download, RefreshCw, Trash2, FileText } from 'lucide-react'
import Modal from './Modal'
import Spinner from './Spinner'

const ACCEPT_PADRAO = '.pdf,.jpg,.jpeg,.png,.heic,.heif,.doc,.docx'

type AnexoUploadProps = {
    nomeArquivo: string | null
    mimetype: string | null
    urlVisualizar: string
    urlBaixar: string
    onUpload: (file: File) => Promise<void>
    onRemover?: () => Promise<void>
    somenteLeitura?: boolean
    rotulo?: string
    mostrarNome?: boolean
    accept?: string
}

export default function AnexoUpload({
    nomeArquivo,
    mimetype,
    urlVisualizar,
    urlBaixar,
    onUpload,
    onRemover,
    somenteLeitura,
    rotulo = 'documento',
    mostrarNome = true,
    accept = ACCEPT_PADRAO,
}: AnexoUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [enviando, setEnviando] = useState(false)
    const [removendo, setRemovendo] = useState(false)
    const [previewAberto, setPreviewAberto] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    async function handleArquivoSelecionado(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return

        setEnviando(true)
        setErro(null)
        try {
            await onUpload(file)
        } catch (err) {
            setErro(err instanceof Error ? err.message : `Erro ao enviar ${rotulo}.`)
        } finally {
            setEnviando(false)
        }
    }

    async function handleRemover() {
        if (!onRemover) return
        setRemovendo(true)
        setErro(null)
        try {
            await onRemover()
        } catch (err) {
            setErro(err instanceof Error ? err.message : `Erro ao remover ${rotulo}.`)
        } finally {
            setRemovendo(false)
        }
    }

    // HEIC/HEIF não renderiza em <img> na maioria dos navegadores (Chrome, Firefox, Edge) -
    // cai na mensagem de "pré-visualização indisponível" em vez de mostrar imagem quebrada.
    const isImagem = mimetype?.startsWith('image/') && mimetype !== 'image/heic' && mimetype !== 'image/heif'
    const isPdf = mimetype === 'application/pdf'

    if (!nomeArquivo) {
        return (
            <div className='flex flex-col items-end gap-1'>
                {!somenteLeitura && (
                    <button
                        type='button'
                        onClick={() => inputRef.current?.click()}
                        disabled={enviando}
                        title={`Enviar ${rotulo}`}
                        aria-label={`Enviar ${rotulo}`}
                        className='flex h-8 w-8 items-center justify-center rounded-lg bg-orange-base text-white transition-opacity hover:opacity-80 disabled:opacity-60'
                    >
                        {enviando ? <Spinner className='h-4 w-4' /> : <Upload className='h-4 w-4' />}
                    </button>
                )}
                {somenteLeitura && <span className='text-xs text-gray-dark dark:text-dark-text-muted'>-</span>}
                <input ref={inputRef} type='file' accept={accept} className='hidden' onChange={handleArquivoSelecionado} />
                {erro && <span className='max-w-[160px] text-right text-xs text-red-base'>{erro}</span>}
            </div>
        )
    }

    return (
        <div className='flex flex-col items-end gap-1'>
            <div className='flex items-center gap-2'>
                {mostrarNome && (
                    <button
                        type='button'
                        onClick={() => setPreviewAberto(true)}
                        title={nomeArquivo}
                        className='flex max-w-[140px] items-center gap-1 truncate text-xs font-medium text-gray-text hover:underline dark:text-dark-text'
                    >
                        <FileText className='h-3.5 w-3.5 shrink-0' />
                        <span className='truncate'>{nomeArquivo}</span>
                    </button>
                )}

                <button
                    type='button'
                    onClick={() => setPreviewAberto(true)}
                    title={mostrarNome ? 'Visualizar' : nomeArquivo}
                    aria-label='Visualizar'
                    className='flex h-8 w-8 items-center justify-center rounded-lg bg-blue-base text-white transition-opacity hover:opacity-80'
                >
                    <Eye className='h-4 w-4' />
                </button>

                <a
                    href={urlBaixar}
                    title='Baixar'
                    aria-label='Baixar'
                    className='flex h-8 w-8 items-center justify-center rounded-lg bg-green-base text-white transition-opacity hover:opacity-80'
                >
                    <Download className='h-4 w-4' />
                </a>

                {!somenteLeitura && (
                    <>
                        <button
                            type='button'
                            onClick={() => inputRef.current?.click()}
                            disabled={enviando}
                            title={`Substituir ${rotulo}`}
                            aria-label={`Substituir ${rotulo}`}
                            className='flex h-8 w-8 items-center justify-center rounded-lg bg-orange-base text-white transition-opacity hover:opacity-80 disabled:opacity-60'
                        >
                            {enviando ? <Spinner className='h-4 w-4' /> : <RefreshCw className='h-4 w-4' />}
                        </button>
                        {onRemover && (
                            <button
                                type='button'
                                onClick={handleRemover}
                                disabled={removendo}
                                title={`Remover ${rotulo}`}
                                aria-label={`Remover ${rotulo}`}
                                className='flex h-8 w-8 items-center justify-center rounded-lg bg-red-base text-white transition-opacity hover:opacity-80 disabled:opacity-60'
                            >
                                {removendo ? <Spinner className='h-4 w-4' /> : <Trash2 className='h-4 w-4' />}
                            </button>
                        )}
                        <input
                            ref={inputRef}
                            type='file'
                            accept={accept}
                            className='hidden'
                            onChange={handleArquivoSelecionado}
                        />
                    </>
                )}
            </div>
            {erro && <span className='max-w-[220px] text-right text-xs text-red-base'>{erro}</span>}

            {previewAberto && (
                <Modal titulo={nomeArquivo} onFechar={() => setPreviewAberto(false)}>
                    {isImagem && (
                        <img src={urlVisualizar} alt={nomeArquivo} className='max-h-[70vh] w-full object-contain' />
                    )}
                    {isPdf && <iframe src={urlVisualizar} title={nomeArquivo} className='h-[70vh] w-full rounded-lg border border-gray-base/30 dark:border-dark-border' />}
                    {!isImagem && !isPdf && (
                        <p className='text-sm text-gray-text dark:text-dark-text'>
                            Pré-visualização não disponível para este tipo de arquivo. Use o botão baixar para abrir o
                            documento.
                        </p>
                    )}
                    <div className='mt-4 flex justify-end'>
                        <a
                            href={urlBaixar}
                            className='flex items-center gap-2 rounded-lg bg-orange-base px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-light'
                        >
                            <Download className='h-4 w-4' />
                            Baixar
                        </a>
                    </div>
                </Modal>
            )}
        </div>
    )
}
