import { useCallback, useEffect, useState } from 'react'
import { apiGet } from '../lib/api'

export function useLista<T>(endpoint: string) {
    const [rows, setRows] = useState<T[]>([])
    const [loading, setLoading] = useState(true)
    const [erro, setErro] = useState<string | null>(null)

    const recarregar = useCallback(() => {
        setLoading(true)
        setErro(null)
        return apiGet<T[]>(endpoint)
            .then(setRows)
            .catch((err) => setErro(err.message))
            .finally(() => setLoading(false))
    }, [endpoint])

    useEffect(() => {
        recarregar()
    }, [recarregar])

    return { rows, loading, erro, recarregar }
}
