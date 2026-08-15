import 'dotenv/config';
import fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { tecnologiaRoutes } from './routes/tecnologia.routes';
import { connHub } from './database/hub.database.ts';

const app = fastify();

await app.register(cors, {
    origin: ['https://hub.lojanovamix.com.br'],
    credentials: true
});

if(!process.env.SERVER_PORT) {
    throw new Error('Erro ao encontrar SERVER_PORT no .env.')
} else if (!process.env.JWT_SECRET) {
    throw new Error('Erro ao encontrar JWT_SECRET no .env.')
} else if (!process.env.DATABASE_URL) {
    throw new Error('Erro ao encontrar DATABASE_URL no .env.')
};

app.register(cookie);
app.register(tecnologiaRoutes);

async function start() {
    await app.listen({ host: '0.0.0.0', port: process.env.SERVER_PORT})
    console.log(`Servidor rodando em ${process.env.SERVER_PORT}`);

    const conn = await connHub()
    await conn.query('SELECT NOW()')
    console.log(`Banco do hub conectado.`);
    conn.release()
}

start()
