export function formatDate(value: string) {
    const [ano, mes, dia] = value.slice(0, 10).split('-')
    return `${dia}/${mes}/${ano}`
}

export function formatCurrency(value: number | string) {
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
