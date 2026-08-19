export function formatDate(value: string) {
    const [ano, mes, dia] = value.slice(0, 10).split('-')
    return `${dia}/${mes}/${ano}`
}

export function formatCurrency(value: number | string) {
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function onlyDigits(value: string) {
    return value.replace(/\D/g, '')
}

export function formatCnpjInput(value: string) {
    return onlyDigits(value)
        .slice(0, 14)
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

export function formatCepInput(value: string) {
    return onlyDigits(value)
        .slice(0, 8)
        .replace(/(\d{5})(\d)/, '$1-$2')
}

export function formatPhoneInput(value: string) {
    const digits = onlyDigits(value).slice(0, 11)

    if (digits.length <= 10) {
        return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
    }

    return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}
