import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
    Monitor,
    ClipboardCheck,
    AlertTriangle,
    Laptop,
    FileClock,
    Truck,
    Wallet,
    CalendarRange,
    RefreshCw,
    Boxes,
    Users,
    Receipt,
    TrendingUp,
    TrendingDown,
    Minus,
} from 'lucide-react'
import PageShell from '../components/PageShell'
import StatTile from '../components/StatTile'
import BarList from '../components/BarList'
import TrendChart from '../components/TrendChart'
import SelectFilter from '../components/SelectFilter'
import FilterDrawer from '../components/FilterDrawer'
import { useMe } from '../hooks/useMe'
import { useLista } from '../hooks/useLista'
import { formatCurrency } from '../lib/format'
import type {
    CadastroSimples,
    Contrato,
    Equipamento,
    EquipamentoPessoal,
    Fornecedor,
    Gasto,
    Loja,
    UsuarioHub,
} from '../types/tecnologia'

function SectionHeader({ icon: Icon, titulo }: { icon: LucideIcon; titulo: string }) {
    return (
        <div className='mb-3 flex items-center gap-2'>
            <Icon className='h-4 w-4 text-gray-dark dark:text-dark-text-muted' />
            <h2 className='text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                {titulo}
            </h2>
        </div>
    )
}

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

function noMesAnterior(data: string) {
    const agora = new Date()
    const referencia = new Date(agora.getFullYear(), agora.getMonth() - 1, 1)
    const [ano, mes] = data.slice(0, 10).split('-').map(Number)
    return ano === referencia.getFullYear() && mes === referencia.getMonth() + 1
}

function DeltaBadge({ pct, subidaEBoa }: { pct: number | null; subidaEBoa: boolean }) {
    if (pct === null) return null

    const subiu = pct > 0.5
    const desceu = pct < -0.5
    const bom = subiu ? subidaEBoa : desceu ? !subidaEBoa : null

    return (
        <span
            className={`flex shrink-0 items-center gap-1 text-xs font-semibold ${
                bom === null ? 'text-gray-dark dark:text-dark-text-muted' : bom ? 'text-green-base' : 'text-red-base'
            }`}
        >
            {subiu ? (
                <TrendingUp className='h-3.5 w-3.5' />
            ) : desceu ? (
                <TrendingDown className='h-3.5 w-3.5' />
            ) : (
                <Minus className='h-3.5 w-3.5' />
            )}
            {pct > 0 ? '+' : ''}
            {pct.toFixed(0)}%
        </span>
    )
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

    const { rows: equipamentosTodos, loading: loadingEquipamentos } = useLista<Equipamento>('/tecnologia/equipamentos')
    const { rows: equipamentosPessoaisTodos, loading: loadingPessoais } =
        useLista<EquipamentoPessoal>('/tecnologia/equipamentos-pessoais')
    const { rows: gastosTodos, loading: loadingGastos } = useLista<Gasto>('/tecnologia/gastos')
    const { rows: contratosTodos, loading: loadingContratos } = useLista<Contrato>('/tecnologia/contratos')
    const { rows: fornecedores, loading: loadingFornecedores } = useLista<Fornecedor>('/tecnologia/fornecedores')
    const { rows: usuariosTodos, loading: loadingUsuarios } = useLista<UsuarioHub>('/tecnologia/usuarios')
    const { rows: lojas } = useLista<Loja>('/tecnologia/lojas')
    const { rows: areas } = useLista<CadastroSimples>('/tecnologia/areas')
    const { rows: tiposEquipamento } = useLista<CadastroSimples>('/tecnologia/tipos-equipamento')
    const { rows: marcas } = useLista<CadastroSimples>('/tecnologia/marcas')

    const [lojaFiltro, setLojaFiltro] = useState<number | 'all'>('all')
    const [areaFiltro, setAreaFiltro] = useState<number | 'all'>('all')
    const [tipoEquipamentoFiltro, setTipoEquipamentoFiltro] = useState<number | 'all'>('all')
    const [marcaFiltro, setMarcaFiltro] = useState<number | 'all'>('all')
    const [fornecedorFiltro, setFornecedorFiltro] = useState<number | 'all'>('all')
    const [setorFiltro, setSetorFiltro] = useState<string | 'all'>('all')

    const filtrosAtivos =
        (lojaFiltro !== 'all' ? 1 : 0) +
        (areaFiltro !== 'all' ? 1 : 0) +
        (tipoEquipamentoFiltro !== 'all' ? 1 : 0) +
        (marcaFiltro !== 'all' ? 1 : 0) +
        (fornecedorFiltro !== 'all' ? 1 : 0) +
        (setorFiltro !== 'all' ? 1 : 0)

    const setoresDisponiveis = [...new Set(usuariosTodos.map((u) => u.sector_name ?? 'Sem setor'))].sort()

    const carregando =
        loadingEquipamentos || loadingPessoais || loadingGastos || loadingContratos || loadingFornecedores || loadingUsuarios

    const equipamentos = equipamentosTodos.filter(
        (e) =>
            (lojaFiltro === 'all' || e.filial_id === lojaFiltro) &&
            (tipoEquipamentoFiltro === 'all' || e.equipamento_id === tipoEquipamentoFiltro) &&
            (marcaFiltro === 'all' || e.marca_id === marcaFiltro)
    )
    const equipamentosPessoais = equipamentosPessoaisTodos.filter(
        (e) => lojaFiltro === 'all' || e.filial_id === lojaFiltro
    )
    const gastos = gastosTodos.filter(
        (g) =>
            (lojaFiltro === 'all' || g.filial_id === lojaFiltro) &&
            (areaFiltro === 'all' || g.area_id === areaFiltro) &&
            (fornecedorFiltro === 'all' || g.fornecedor_id === fornecedorFiltro)
    )
    const contratos = contratosTodos.filter(
        (c) =>
            (lojaFiltro === 'all' || c.filial_id === lojaFiltro) &&
            (areaFiltro === 'all' || c.area_id === areaFiltro) &&
            (fornecedorFiltro === 'all' || c.fornecedor_id === fornecedorFiltro)
    )
    const usuarios = usuariosTodos.filter((u) => setorFiltro === 'all' || (u.sector_name ?? 'Sem setor') === setorFiltro)

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
    const gastoMesAnterior = gastos
        .filter((g) => noMesAnterior(g.data_gasto))
        .reduce((soma, g) => soma + Number(g.valor), 0)
    const deltaGastoMesPct = gastoMesAnterior > 0 ? ((gastoMesAtual - gastoMesAnterior) / gastoMesAnterior) * 100 : null

    const maioresGastosDoMes = gastos
        .filter((g) => noMesAtual(g.data_gasto))
        .sort((a, b) => Number(b.valor) - Number(a.valor))
        .slice(0, 5)
        .map((g) => ({ label: g.fornecedor_nome ?? g.tipo, value: Number(g.valor) }))

    const equipamentosPorLoja = contarPor(equipamentos, (e) => e.loja_nome ?? 'Sem loja')
    const equipamentosPorTipo = contarPor(equipamentos, (e) => e.equipamento_nome ?? 'Sem tipo')
    const equipamentosPorMarca = contarPor(equipamentos, (e) => e.marca_nome ?? 'Sem marca')

    const usuariosPorSetor = contarPor(usuarios, (u) => u.sector_name ?? 'Sem setor')
    const termosStatus = [
        { label: 'Assinado', value: pessoaisEntregues.filter((e) => e.termo).length, cor: 'bg-green-base' },
        { label: 'Pendente', value: termosPendentes, cor: 'bg-orange-base' },
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
            acoes={
                <FilterDrawer ativos={filtrosAtivos}>
                    <SelectFilter
                        label='Loja'
                        options={lojas.map((loja) => ({ value: loja.id, label: loja.name }))}
                        value={lojaFiltro}
                        onChange={setLojaFiltro}
                    />
                    <SelectFilter
                        label='Área'
                        options={areas.map((area) => ({ value: area.id, label: area.nome }))}
                        value={areaFiltro}
                        onChange={setAreaFiltro}
                    />
                    <SelectFilter
                        label='Tipo de equipamento'
                        options={tiposEquipamento.map((tipo) => ({ value: tipo.id, label: tipo.nome }))}
                        value={tipoEquipamentoFiltro}
                        onChange={setTipoEquipamentoFiltro}
                    />
                    <SelectFilter
                        label='Marca'
                        options={marcas.map((marca) => ({ value: marca.id, label: marca.nome }))}
                        value={marcaFiltro}
                        onChange={setMarcaFiltro}
                    />
                    <SelectFilter
                        label='Fornecedor'
                        options={fornecedores.map((fornecedor) => ({ value: fornecedor.id, label: fornecedor.empresa }))}
                        value={fornecedorFiltro}
                        onChange={setFornecedorFiltro}
                    />
                    <SelectFilter
                        label='Setor'
                        options={setoresDisponiveis.map((setor) => ({ value: setor, label: setor }))}
                        value={setorFiltro}
                        onChange={setSetorFiltro}
                    />
                </FilterDrawer>
            }
        >
            {carregando ? (
                <p className='text-sm text-gray-dark dark:text-dark-text-muted'>Carregando...</p>
            ) : (
                <div className='flex flex-col gap-8'>
                    <div>
                        <SectionHeader icon={Monitor} titulo='Parque de equipamentos' />
                        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                            <StatTile
                                label='Equipamentos ativos'
                                value={String(equipamentosAtivos)}
                                hint={`de ${equipamentos.length} cadastrados`}
                                icon={Monitor}
                            />
                            <StatTile
                                label='Verificações pendentes'
                                value={String(precisamVerificar)}
                                hint='equipamentos marcados para verificar'
                                tone={precisamVerificar > 0 ? 'warning' : 'good'}
                                icon={ClipboardCheck}
                            />
                            <StatTile
                                label='Avarias pendentes'
                                value={String(avariasPendentes)}
                                hint='equipamentos pessoais com avaria em uso'
                                tone={avariasPendentes > 0 ? 'critical' : 'good'}
                                icon={AlertTriangle}
                            />
                            <StatTile
                                label='Equipamentos pessoais entregues'
                                value={String(pessoaisEntregues.length)}
                                hint={`de ${equipamentosPessoais.length} cadastrados`}
                                icon={Laptop}
                            />
                            <StatTile
                                label='Termos pendentes'
                                value={String(termosPendentes)}
                                hint='entregues sem termo assinado'
                                tone={termosPendentes > 0 ? 'warning' : 'good'}
                                icon={FileClock}
                            />
                            <StatTile label='Fornecedores ativos' value={String(fornecedoresAtivos)} icon={Truck} />
                        </div>
                    </div>

                    <div>
                        <SectionHeader icon={Wallet} titulo='Financeiro' />
                        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                            <StatTile
                                label='Gasto total'
                                value={formatCurrency(gastoTotal)}
                                hint='acumulado'
                                icon={Wallet}
                            />
                            <StatTile
                                label='Gasto no mês'
                                value={formatCurrency(gastoMesAtual)}
                                hint='mês atual'
                                icon={CalendarRange}
                                extra={<DeltaBadge pct={deltaGastoMesPct} subidaEBoa={false} />}
                            />
                            <StatTile
                                label='Custo mensal recorrente'
                                value={formatCurrency(custoMensalRecorrente)}
                                hint={`${contratosAtivos.length} contratos ativos`}
                                icon={RefreshCw}
                            />
                        </div>
                        <div className='mt-6'>
                            <TrendChart
                                titulo='Gastos nos últimos 6 meses'
                                pontos={gastosUltimosMeses}
                                formatarValor={formatCurrency}
                            />
                        </div>
                    </div>

                    <div>
                        <SectionHeader icon={Boxes} titulo='Parque de TI' />
                        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
                            <BarList titulo='Equipamentos por loja' itens={equipamentosPorLoja} cor='bg-blue-base' />
                            <BarList titulo='Equipamentos por tipo' itens={equipamentosPorTipo} cor='bg-blue-base' />
                            <BarList titulo='Equipamentos por marca' itens={equipamentosPorMarca} cor='bg-blue-base' />
                        </div>
                    </div>

                    <div>
                        <SectionHeader icon={Users} titulo='Pessoas' />
                        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                            <BarList titulo='Usuários por setor' itens={usuariosPorSetor} cor='bg-gray-base' />
                            <BarList titulo='Termo de equipamentos pessoais' itens={termosStatus} />
                        </div>
                    </div>

                    <div>
                        <SectionHeader icon={Receipt} titulo='Gastos e contratos' />
                        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                            <BarList
                                titulo='Maiores gastos do mês'
                                itens={maioresGastosDoMes}
                                formatarValor={formatCurrency}
                            />
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
