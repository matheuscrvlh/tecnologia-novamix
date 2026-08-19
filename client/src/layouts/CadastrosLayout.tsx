import { NavLink, Outlet } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { useMe } from '../hooks/useMe'

const ABAS = [
    { to: 'locais', label: 'Locais' },
    { to: 'tipos-equipamento', label: 'Tipos de equipamento' },
    { to: 'marcas', label: 'Marcas' },
    { to: 'modelos', label: 'Modelos' },
    { to: 'areas', label: 'Áreas' },
    { to: 'fornecedores', label: 'Fornecedores' },
]

export default function CadastrosLayout() {
    const { me, loading: loadingMe, error: meError } = useMe()

    return (
        <PageShell
            loadingMe={loadingMe}
            meError={meError}
            autorizado={me !== null}
            titulo='Cadastros'
            subtitulo='Gerencie os cadastros usados nos formulários de equipamentos e gastos.'
        >
            <nav className='mb-6 flex gap-4 overflow-x-auto border-b border-gray-base/30 sm:gap-6 dark:border-dark-border'>
                {ABAS.map((aba) => (
                    <NavLink
                        key={aba.to}
                        to={aba.to}
                        className={({ isActive }) =>
                            `whitespace-nowrap border-b-2 py-3 text-sm font-medium transition-colors ${
                                isActive
                                    ? 'border-orange-base text-orange-base'
                                    : 'border-transparent text-gray-dark hover:text-orange-base dark:text-dark-text-muted'
                            }`
                        }
                    >
                        {aba.label}
                    </NavLink>
                ))}
            </nav>

            <Outlet />
        </PageShell>
    )
}
