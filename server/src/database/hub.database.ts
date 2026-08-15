import { Pool, type PoolClient } from 'pg'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
})

export async function connHub(): Promise<PoolClient> {
    try {
        const conn = await pool.connect()
        await conn.query(`SET search_path TO "${process.env.DB_SCHEMA}", public`)
        return conn
    } catch (error) {
        console.log(error)
        throw new Error('Erro ao conectar no banco do hub')
    }
}
