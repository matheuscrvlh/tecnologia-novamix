import { useEffect, useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import Field, { inputClass } from './Field'

const ACCEPT_PADRAO = '.pdf,.jpg,.jpeg,.png,.heic,.heif,.doc,.docx'

type FileFieldProps = {
    label: string
    arquivo: File | null
    onChange: (file: File | null) => void
    nomeAtual?: string | null
    accept?: string
}

export default function FileField({ label, arquivo, onChange, nomeAtual, accept = ACCEPT_PADRAO }: FileFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    useEffect(() => {
        if (!arquivo || !arquivo.type.startsWith('image/')) {
            setPreviewUrl(null)
            return
        }

        const url = URL.createObjectURL(arquivo)
        setPreviewUrl(url)
        return () => URL.revokeObjectURL(url)
    }, [arquivo])

    return (
        <Field label={label}>
            <div className='flex items-center gap-2'>
                {previewUrl && <img src={previewUrl} alt='' className='h-10 w-10 shrink-0 rounded-lg object-cover' />}
                <button
                    type='button'
                    onClick={() => inputRef.current?.click()}
                    className={`${inputClass} flex flex-1 items-center gap-2 text-left`}
                >
                    <Upload className='h-4 w-4 shrink-0 text-orange-base' />
                    <span className='truncate'>
                        {arquivo ? arquivo.name : nomeAtual ? `Substituir "${nomeAtual}"` : 'Selecionar arquivo...'}
                    </span>
                </button>
                {arquivo && (
                    <button
                        type='button'
                        onClick={() => onChange(null)}
                        title='Remover seleção'
                        aria-label='Remover seleção'
                        className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-base text-white transition-opacity hover:opacity-80'
                    >
                        <X className='h-4 w-4' />
                    </button>
                )}
                <input
                    ref={inputRef}
                    type='file'
                    accept={accept}
                    className='hidden'
                    onChange={(e) => onChange(e.target.files?.[0] ?? null)}
                />
            </div>
        </Field>
    )
}
