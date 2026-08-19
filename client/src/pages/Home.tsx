import PageShell from '../components/PageShell'
import StatTile from '../components/StatTile'
import BarList from '../components/BarList'
import { useMe } from '../hooks/useMe'
import { useLista } from '../hooks/useLista'
import { formatCurrency } from '../lib/format'
import type { Contrato, Equipamento, EquipamentoPessoal, Fornecedor, Gasto, UsuarioHub } from '../types/tecnologia'

const NOMES_MES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function contarPor<T>(itens: T[], chave: (item: T) => string) {
    const contagem = new Map<string, number>()
    for (const item of itens) {
        const k = chave(item)
        contagem.set(k, (contagem.get(k) ?? 0) + 1)
    }
    return [...contagem.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
}

function somarPor<T>(itens: T[], chave: (item: T) => string, valor: (item: T) => number) {
    const soma = new Map<string, number>()
    for (const item of itens) {
        const k = chave(item)
        soma.set(k, (soma.get(k) ?? 0) + valor(item))
    }
    return [...soma.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
}

function noMesAtual(data: string) {
    const agora = new Date()
    const [ano, mes] = data.slice(0, 10).split('-').map(Number)
    return ano === agora.getFullYear() && mes === agora.getMonth() + 1
}

function gastosPorMes(gastos: Gasto[], quantidadeMeses: number) {
    const agora = new Date()

    return Array.from({ length: quantidadeMeses }, (_, i) => {
        const referencia = new Date(agora.getFullYear(), agora.getMonth() - (quantidadeMeses - 1 - i), 1)
        const ano = referencia.getFullYear()
        const mes = referencia.getMonth() + 1

        const total = gastos
            .filter((g) => {
                const [gAno, gMes] = g.data_gasto.slice(0, 10).split('-').map(Number)
                return gAno === ano && gMes === mes
            })
            .reduce((soma, g) => soma + Number(g.valor), 0)

        return { label: `${NOMES_MES[mes - 1]}/${String(ano).slice(2)}`, value: total }
    })
}

function custoMensal(contrato: Contrato) {
    if (contrato.tipo_cobranca === 'Mensal') return Number(contrato.valor)
    if (contrato.tipo_cobranca === 'Anual') return Number(contrato.valor) / 12
    return 0
}

export default function Home() {
    const { me, loading: loadingMe, error: meError } = useMe()

    const { rows: equipamentos, loading: loadingEquipamentos } = useLista<Equipamento>('/tecnologia/equipamentos')
    const { rows: equipamentosPessoais, loading: loadingPessoais } =
        useLista<EquipamentoPessoal>('/tecnologia/equipamentos-pessoais')
    const { rows: gastos, loading: loadingGastos } = useLista<Gasto>('/tecnologia/gastos')
    const { rows: contratos, loading: loadingContratos } = useLista<Contrato>('/tecnologia/contratos')
    const { rows: fornecedores, loading: loadingFornecedores } = useLista<Fornecedor>('/tecnologia/fornecedores')
    const { rows: usuarios, loading: loadingUsuarios } = useLista<UsuarioHub>('/tecnologia/usuarios')

    const carregando =
        loadingEquipamentos || loadingPessoais || loadingGastos || loadingContratos || loadingFornecedores || loadingUsuarios

    const equipamentosAtivos = equipamentos.filter((e) => e.status).length
    const precisamVerificar = equipamentos.filter((e) => e.verificar).length

    const pessoaisEntregues = equipamentosPessoais.filter((e) => e.status)
    const avariasPendentes = pessoaisEntregues.filter((e) => e.avarias).length
    const termosPendentes = pessoaisEntregues.filter((e) => !e.termo).length

    const fornecedoresAtivos = fornecedores.filter((f) => f.status).length

    const contratosAtivos = contratos.filter((c) => c.status)
    const custoMensalRecorrente = contratosAtivos.reduce((soma, c) => soma + custoMensal(c), 0)

    const gastoTotal = gastos.reduce((soma, g) => soma + Number(g.valor), 0)
    const gastoMesAtual = gastos.filter((g) => noMesAtual(g.data_gasto)).reduce((soma, g) => soma + Number(g.valor), 0)

    const equipamentosPorLoja = contarPor(equipamentos, (e) => e.loja_nome ?? 'Sem loja')
    const equipamentosPorTipo = contarPor(equipamentos, (e) => e.equipamento_nome ?? 'Sem tipo')
    const equipamentosPorMarca = contarPor(equipamentos, (e) => e.marca_nome ?? 'Sem marca')

    const usuariosPorSetor = contarPor(usuarios, (u) => u.sector_name ?? 'Sem setor')
    const termosStatus = [
        { label: 'Assinado', value: pessoaisEntregues.filter((e) => e.termo).length },
        { label: 'Pendente', value: termosPendentes },
    ]

    const gastosPorLoja = somarPor(gastos, (g) => g.loja_nome ?? 'Sem loja', (g) => Number(g.valor))
    const gastosPorTipo = somarPor(gastos, (g) => g.tipo, (g) => Number(g.valor))
    const gastosPorArea = somarPor(gastos, (g) => g.area_nome ?? 'Sem área', (g) => Number(g.valor))
    const gastosUltimosMeses = gastosPorMes(gastos, 6)
    const custoRecorrentePorFornecedor = somarPor(
        contratosAtivos.filter((c) => c.tipo_cobranca !== 'Único'),
        (c) => c.fornecedor_nome ?? 'Sem fornecedor',
        custoMensal
    )

    return (
        <PageShell
            loadingMe={loadingMe}
            meError={meError}
            autorizado={me !== null}
            titulo='Dashboard'
            subtitulo='Panorama do parque de TI, equipamentos pessoais, contratos e gastos.'
        >
            {carregando ? (
                <p className='text-sm text-gray-dark dark:text-dark-text-muted'>Carregando...</p>
            ) : (
                <div className='flex flex-col gap-8'>
                    <div>
                        <h2 className='mb-3 text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                            Parque de equipamentos
                        </h2>
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
                                label='Avarias pendentes'
                                value={String(avariasPendentes)}
                                hint='equipamentos pessoais com avaria em uso'
                                tone={avariasPendentes > 0 ? 'critical' : 'good'}
                            />
                            <StatTile
                                label='Equipamentos pessoais entregues'
                                value={String(pessoaisEntregues.length)}
                                hint={`de ${equipamentosPessoais.length} cadastrados`}
                            />
                            <StatTile
                                label='Termos pendentes'
                                value={String(termosPendentes)}
                                hint='entregues sem termo assinado'
                                tone={termosPendentes > 0 ? 'warning' : 'good'}
                            />
                            <StatTile label='Fornecedores ativos' value={String(fornecedoresAtivos)} />
                        </div>
                    </div>

                    <div>
                        <h2 className='mb-3 text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                            Financeiro
                        </h2>
                        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                            <StatTile label='Gasto total' value={formatCurrency(gastoTotal)} hint='acumulado' />
                            <StatTile label='Gasto no mês' value={formatCurrency(gastoMesAtual)} hint='mês atual' />
                            <StatTile
                                label='Custo mensal recorrente'
                                value={formatCurrency(custoMensalRecorrente)}
                                hint={`${contratosAtivos.length} contratos ativos`}
                            />
                        </div>
                    </div>

                    <div>
                        <h2 className='mb-3 text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                            Parque de TI
                        </h2>
                        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
                            <BarList titulo='Equipamentos por loja' itens={equipamentosPorLoja} />
                            <BarList titulo='Equipamentos por tipo' itens={equipamentosPorTipo} />
                            <BarList titulo='Equipamentos por marca' itens={equipamentosPorMarca} />
                        </div>
                    </div>

                    <div>
                        <h2 className='mb-3 text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                            Pessoas
                        </h2>
                        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                            <BarList titulo='Usuários por setor' itens={usuariosPorSetor} />
                            <BarList titulo='Termo de equipamentos pessoais' itens={termosStatus} />
                        </div>
                    </div>

                    <div>
                        <h2 className='mb-3 text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                            Gastos e contratos
                        </h2>
                        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                            <BarList titulo='Gastos nos últimos 6 meses' itens={gastosUltimosMeses} formatarValor={formatCurrency} />
                            <BarList
                                titulo='Maior custo recorrente por fornecedor'
                                itens={custoRecorrentePorFornecedor}
                                formatarValor={formatCurrency}
                            />
                            <BarList titulo='Gastos por loja' itens={gastosPorLoja} formatarValor={formatCurrency} />
                            <BarList titulo='Gastos por tipo' itens={gastosPorTipo} formatarValor={formatCurrency} />
                            <BarList titulo='Gastos por área' itens={gastosPorArea} formatarValor={formatCurrency} />
                        </div>
                    </div>
                </div>
            )}
        </PageShell>
    )
}
