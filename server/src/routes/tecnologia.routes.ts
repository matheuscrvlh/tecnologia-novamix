import { authenticate } from '../middlewares/auth.middlewares'
import { getMe } from '../controllers/tecnologia.controller'
import { getUsuarios } from '../controllers/usuarios.controller'
import { getLojas } from '../controllers/lojas.controller'
import { getFornecedores, createFornecedor } from '../controllers/fornecedores.controller'
import {
    getEquipamentos,
    createEquipamento,
    updateEquipamento,
    deleteEquipamento,
} from '../controllers/equipamentos.controller'
import {
    getEquipamentosPessoais,
    createEquipamentoPessoal,
    updateEquipamentoPessoal,
    deleteEquipamentoPessoal,
} from '../controllers/equipamentosPessoais.controller'
import { getGastos, createGasto, updateGasto, deleteGasto } from '../controllers/gastos.controller'

export function tecnologiaRoutes(fastify) {
    fastify.get('/tecnologia/me', { preHandler: [authenticate] }, getMe)

    fastify.get('/tecnologia/usuarios', { preHandler: [authenticate] }, getUsuarios)
    fastify.get('/tecnologia/lojas', { preHandler: [authenticate] }, getLojas)

    fastify.get('/tecnologia/fornecedores', { preHandler: [authenticate] }, getFornecedores)
    fastify.post('/tecnologia/fornecedores', { preHandler: [authenticate] }, createFornecedor)

    fastify.get('/tecnologia/equipamentos', { preHandler: [authenticate] }, getEquipamentos)
    fastify.post('/tecnologia/equipamentos', { preHandler: [authenticate] }, createEquipamento)
    fastify.put('/tecnologia/equipamentos/:id', { preHandler: [authenticate] }, updateEquipamento)
    fastify.delete('/tecnologia/equipamentos/:id', { preHandler: [authenticate] }, deleteEquipamento)

    fastify.get('/tecnologia/equipamentos-pessoais', { preHandler: [authenticate] }, getEquipamentosPessoais)
    fastify.post('/tecnologia/equipamentos-pessoais', { preHandler: [authenticate] }, createEquipamentoPessoal)
    fastify.put('/tecnologia/equipamentos-pessoais/:id', { preHandler: [authenticate] }, updateEquipamentoPessoal)
    fastify.delete('/tecnologia/equipamentos-pessoais/:id', { preHandler: [authenticate] }, deleteEquipamentoPessoal)

    fastify.get('/tecnologia/gastos', { preHandler: [authenticate] }, getGastos)
    fastify.post('/tecnologia/gastos', { preHandler: [authenticate] }, createGasto)
    fastify.put('/tecnologia/gastos/:id', { preHandler: [authenticate] }, updateGasto)
    fastify.delete('/tecnologia/gastos/:id', { preHandler: [authenticate] }, deleteGasto)
}
