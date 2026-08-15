import PageShell from '../components/PageShell'
import { useMe } from '../hooks/useMe'

export default function Home() {
    const { me, loading: loadingMe, error: meError } = useMe()

    return (
        <PageShell
            loadingMe={loadingMe}
            meError={meError}
            autorizado={me !== null}
            titulo='Tecnologia Novamix'
            subtitulo='Módulo de TI.'
        >
            <p className='text-sm text-gray-dark dark:text-dark-text-muted'>Selecione uma página no menu ao lado.</p>
        </PageShell>
    )
}
