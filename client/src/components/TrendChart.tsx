import { useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

type TrendPoint = {
    label: string
    value: number
}

type TrendChartProps = {
    titulo: string
    pontos: TrendPoint[]
    formatarValor?: (valor: number) => string
    corSerie?: string
    subidaEBoa?: boolean
}

const LARGURA = 640
const ALTURA = 220
const MARGEM = { topo: 16, base: 28, esquerda: 8, direita: 8 }

function passoAgradavel(valorMaximo: number, divisoes = 4) {
    if (valorMaximo <= 0) return 1
    const bruto = valorMaximo / divisoes
    const magnitude = 10 ** Math.floor(Math.log10(bruto))
    const normalizado = bruto / magnitude
    const passo = normalizado >= 5 ? 5 : normalizado >= 2 ? 2 : 1
    return passo * magnitude
}

export default function TrendChart({
    titulo,
    pontos,
    formatarValor = (v) => String(v),
    corSerie = '#EA8006',
    subidaEBoa = false,
}: TrendChartProps) {
    const [indiceFoco, setIndiceFoco] = useState<number | null>(null)

    const semDados = pontos.length === 0 || pontos.every((p) => p.value === 0)

    const passo = passoAgradavel(Math.max(...pontos.map((p) => p.value), 1))
    const maximoEixo = semDados ? passo * 4 : Math.max(passo * 4, Math.ceil(Math.max(...pontos.map((p) => p.value)) / passo) * passo)
    const linhasGrade = Array.from({ length: 5 }, (_, i) => (maximoEixo / 4) * i)

    const larguraUtil = LARGURA - MARGEM.esquerda - MARGEM.direita
    const alturaUtil = ALTURA - MARGEM.topo - MARGEM.base

    function coordX(indice: number) {
        if (pontos.length <= 1) return MARGEM.esquerda + larguraUtil / 2
        return MARGEM.esquerda + (indice / (pontos.length - 1)) * larguraUtil
    }
    function coordY(valor: number) {
        return MARGEM.topo + alturaUtil - (valor / maximoEixo) * alturaUtil
    }

    const linha = pontos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${coordX(i)} ${coordY(p.value)}`).join(' ')
    const area =
        pontos.length > 0
            ? `M ${coordX(0)} ${coordY(0)} ${pontos
                  .map((p, i) => `L ${coordX(i)} ${coordY(p.value)}`)
                  .join(' ')} L ${coordX(pontos.length - 1)} ${coordY(0)} Z`
            : ''

    const ultimo = pontos[pontos.length - 1]
    const penultimo = pontos[pontos.length - 2]
    const temComparativo = ultimo && penultimo && penultimo.value !== 0
    const deltaPct = temComparativo ? ((ultimo.value - penultimo.value) / penultimo.value) * 100 : null
    const subiu = deltaPct !== null && deltaPct > 0.5
    const desceu = deltaPct !== null && deltaPct < -0.5
    const deltaBom = subiu ? subidaEBoa : desceu ? !subidaEBoa : null

    const pontoFoco = indiceFoco !== null ? pontos[indiceFoco] : null
    const tooltipEsquerda = indiceFoco !== null ? (coordX(indiceFoco) / LARGURA) * 100 : 0

    return (
        <div className='rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
            <div className='flex items-baseline justify-between gap-3'>
                <span className='text-sm font-medium text-gray-text dark:text-dark-text'>{titulo}</span>
                {deltaPct !== null && (
                    <span
                        className={`flex shrink-0 items-center gap-1 text-xs font-semibold ${
                            deltaBom === null
                                ? 'text-gray-dark dark:text-dark-text-muted'
                                : deltaBom
                                  ? 'text-green-base'
                                  : 'text-red-base'
                        }`}
                    >
                        {subiu ? (
                            <TrendingUp className='h-3.5 w-3.5' />
                        ) : desceu ? (
                            <TrendingDown className='h-3.5 w-3.5' />
                        ) : (
                            <Minus className='h-3.5 w-3.5' />
                        )}
                        {deltaPct > 0 ? '+' : ''}
                        {deltaPct.toFixed(0)}% vs mês anterior
                    </span>
                )}
            </div>

            {semDados ? (
                <div className='mt-3 text-sm text-gray-dark dark:text-dark-text-muted'>Sem dados ainda.</div>
            ) : (
                <div className='relative mt-4'>
                    {pontoFoco && (
                        <div
                            className='pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-md bg-gray-text px-2 py-1 text-xs whitespace-nowrap text-white shadow-lg dark:bg-dark-bg'
                            style={{ left: `${tooltipEsquerda}%` }}
                        >
                            <span className='text-white/70'>{pontoFoco.label}: </span>
                            <span className='font-semibold'>{formatarValor(pontoFoco.value)}</span>
                        </div>
                    )}

                    <svg
                        viewBox={`0 0 ${LARGURA} ${ALTURA}`}
                        className='mt-6 w-full touch-none'
                        onPointerLeave={() => setIndiceFoco(null)}
                    >
                        {linhasGrade.map((valor) => (
                            <g key={valor}>
                                <line
                                    x1={MARGEM.esquerda}
                                    x2={LARGURA - MARGEM.direita}
                                    y1={coordY(valor)}
                                    y2={coordY(valor)}
                                    className='stroke-gray-base/15 dark:stroke-dark-border'
                                    strokeWidth={1}
                                />
                                <text
                                    x={MARGEM.esquerda}
                                    y={coordY(valor) - 4}
                                    className='fill-gray-dark text-[9px] dark:fill-dark-text-muted'
                                >
                                    {formatarValor(valor)}
                                </text>
                            </g>
                        ))}

                        <path d={area} fill={corSerie} fillOpacity={0.1} stroke='none' />
                        <path d={linha} fill='none' stroke={corSerie} strokeWidth={2} strokeLinecap='round' strokeLinejoin='round' />

                        {indiceFoco !== null && (
                            <line
                                x1={coordX(indiceFoco)}
                                x2={coordX(indiceFoco)}
                                y1={MARGEM.topo}
                                y2={ALTURA - MARGEM.base}
                                className='stroke-gray-base/30 dark:stroke-dark-border'
                                strokeWidth={1}
                            />
                        )}

                        {pontos.map((p, i) => {
                            const emFoco = indiceFoco === i
                            const ultimoPonto = i === pontos.length - 1
                            if (!emFoco && !ultimoPonto) return null
                            return (
                                <g key={p.label}>
                                    <circle
                                        cx={coordX(i)}
                                        cy={coordY(p.value)}
                                        r={emFoco ? 7 : 6}
                                        className='fill-white dark:fill-dark-surface'
                                    />
                                    <circle cx={coordX(i)} cy={coordY(p.value)} r={emFoco ? 5 : 4} fill={corSerie} />
                                </g>
                            )
                        })}

                        {pontos.map((p, i) => (
                            <text
                                key={p.label}
                                x={coordX(i)}
                                y={ALTURA - 6}
                                textAnchor={i === 0 ? 'start' : i === pontos.length - 1 ? 'end' : 'middle'}
                                className='fill-gray-dark text-[9px] dark:fill-dark-text-muted'
                            >
                                {p.label}
                            </text>
                        ))}

                        {pontos.map((p, i) => (
                            <rect
                                key={`hit-${p.label}`}
                                x={coordX(i) - larguraUtil / (pontos.length * 2)}
                                y={0}
                                width={larguraUtil / pontos.length}
                                height={ALTURA}
                                fill='transparent'
                                tabIndex={0}
                                onPointerEnter={() => setIndiceFoco(i)}
                                onFocus={() => setIndiceFoco(i)}
                                onBlur={() => setIndiceFoco((atual) => (atual === i ? null : atual))}
                            />
                        ))}
                    </svg>
                </div>
            )}
        </div>
    )
}
