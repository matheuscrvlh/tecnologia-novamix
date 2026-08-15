import PageShell from '../components/PageShell'
import StatTile from '../components/StatTile'
import BarList from '../components/BarList'
import { useMe } from '../hooks/useMe'
import { useLista } from '../hooks/useLista'
import { formatCurrency } from '../lib/format'
import type { Equipamento, EquipamentoPessoal, Fornecedor, Gasto } from '../types/tecnologia'

function agruparPorLoja(itens: { loja_nome: string | null }[]) {
    const contagem = new Map<string, number>()
    for (const item of itens) {
        const loja = item.loja_nome ?? 'Sem loja'
        contagem.set(loja, (contagem.get(loja) ?? 0) + 1)
    }
    return [...contagem.entries()]
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
}

function somarGastosPorLoja(gastos: Gasto[]) {
    const soma = new Map<string, number>()
    for (const gasto of gastos) {
        const loja = gasto.loja_nome ?? 'Sem loja'
        soma.set(loja, (soma.get(loja) ?? 0) + Number(gasto.valor))
    }
    return [...soma.entries()]
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
}

function noMesAtual(dataGasto: string) {
    const agora = new Date()
    const [ano, mes] = dataGasto.slice(0, 10).split('-').map(Number)
    return ano === agora.getFullYear() && mes === agora.getMonth() + 1
}

export default function Home() {
    const { me, loading: loadingMe, error: meError } = useMe()

    const { rows: equipamentos, loading: loadingEquipamentos } = useLista<Equipamento>('/tecnologia/equipamentos')
    const { rows: equipamentosPessoais, loading: loadingPessoais } =
        useLista<EquipamentoPessoal>('/tecnologia/equipamentos-pessoais')
    const { rows: gastos, loading: loadingGastos } = useLista<Gasto>('/tecnologia/gastos')
    const { rows: fornecedores, loading: loadingFornecedores } = useLista<Fornecedor>('/tecnologia/fornecedores')

    const carregando = loadingEquipamentos || loadingPessoais || loadingGastos || loadingFornecedores

    const equipamentosAtivos = equipamentos.filter((e) => e.status).length
    const precisamVerificar = equipamentos.filter((e) => e.verificar).length
    const pessoaisEntregues = equipamentosPessoais.filter((e) => e.status).length
    const fornecedoresAtivos = fornecedores.filter((f) => f.status).length

    const gastoTotal = gastos.reduce((soma, g) => soma + Number(g.valor), 0)
    const gastoMesAtual = gastos.filter((g) => noMesAtual(g.data_gasto)).reduce((soma, g) => soma + Number(g.valor), 0)

    const gastosPorLoja = somarGastosPorLoja(gastos)
    const equipamentosPorLoja = agruparPorLoja(equipamentos)

    return (
        <PageShell
            loadingMe={loadingMe}
            meError={meError}
            autorizado={me !== null}
            titulo='Dashboard'
            subtitulo='Panorama do parque de TI, equipamentos pessoais e gastos.'
        >
            {carregando ? (
                <p className='text-sm text-gray-dark dark:text-dark-text-muted'>Carregando...</p>
            ) : (
                <div className='flex flex-col gap-6'>
                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                        <StatTile
                            label='Equipamentos ativos'
                            value={String(equipamentosAtivos)}
                            hint={`de ${equipamentos.length} cadastrados`}
                        />
                        <StatTile
                            label='Verificações pendentes'
                            value={String(precisamVerificar)}
                            hint='equipamentos marcados para verificar'
                            tone={precisamVerificar > 0 ? 'warning' : 'good'}
                        />
                        <StatTile
                            label='Equipamentos pessoais entregues'
                            value={String(pessoaisEntregues)}
                            hint={`de ${equipamentosPessoais.length} cadastrados`}
                        />
                        <StatTile label='Fornecedores ativos' value={String(fornecedoresAtivos)} />
                        <StatTile label='Gasto total' value={formatCurrency(gastoTotal)} hint='acumulado' />
                        <StatTile label='Gasto no mês' value={formatCurrency(gastoMesAtual)} hint='mês atual' />
                    </div>

                    <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                        <BarList titulo='Gastos por loja' itens={gastosPorLoja} formatarValor={formatCurrency} />
                        <BarList titulo='Equipamentos por loja' itens={equipamentosPorLoja} />
                    </div>
                </div>
            )}
        </PageShell>
    )
}
