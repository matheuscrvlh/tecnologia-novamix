import { authenticate } from '../middlewares/auth.middlewares'
import { getMe } from '../controllers/tecnologia.controller'
import { getUsuarios } from '../controllers/usuarios.controller'
import { getLojas } from '../controllers/lojas.controller'
import { getAcessosUsuario } from '../controllers/acessos.controller'
import {
    getFornecedores,
    createFornecedor,
    updateFornecedor,
    deleteFornecedor,
} from '../controllers/fornecedores.controller'
import { criarCrudCadastro } from '../controllers/cadastros.controller'
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
    uploadTermoEquipamentoPessoal,
    getTermoEquipamentoPessoal,
    deleteTermoEquipamentoPessoal,
} from '../controllers/equipamentosPessoais.controller'
import {
    getGastos,
    createGasto,
    updateGasto,
    deleteGasto,
    uploadArquivoGasto,
    getArquivoGasto,
    deleteArquivoGasto,
} from '../controllers/gastos.controller'
import {
    getContratos,
    createContrato,
    updateContrato,
    deleteContrato,
    uploadArquivoContrato,
    getArquivoContrato,
    deleteArquivoContrato,
} from '../controllers/contratos.controller'

const locais = criarCrudCadastro('locais', 'Local')
const tiposEquipamento = criarCrudCadastro('tipos_equipamento', 'Tipo de equipamento')
const marcas = criarCrudCadastro('marcas', 'Marca')
const modelos = criarCrudCadastro('modelos', 'Modelo')
const areas = criarCrudCadastro('areas', 'Área')

export function tecnologiaRoutes(fastify) {
    fastify.get('/tecnologia/me', { preHandler: [authenticate] }, getMe)

    fastify.get('/tecnologia/usuarios', { preHandler: [authenticate] }, getUsuarios)
    fastify.get('/tecnologia/usuarios/:id/acessos', { preHandler: [authenticate] }, getAcessosUsuario)

    fastify.get('/tecnologia/lojas', { preHandler: [authenticate] }, getLojas)

    fastify.get('/tecnologia/fornecedores', { preHandler: [authenticate] }, getFornecedores)
    fastify.post('/tecnologia/fornecedores', { preHandler: [authenticate] }, createFornecedor)
    fastify.put('/tecnologia/fornecedores/:id', { preHandler: [authenticate] }, updateFornecedor)
    fastify.delete('/tecnologia/fornecedores/:id', { preHandler: [authenticate] }, deleteFornecedor)

    fastify.get('/tecnologia/locais', { preHandler: [authenticate] }, locais.listar)
    fastify.post('/tecnologia/locais', { preHandler: [authenticate] }, locais.criar)
    fastify.put('/tecnologia/locais/:id', { preHandler: [authenticate] }, locais.atualizar)
    fastify.delete('/tecnologia/locais/:id', { preHandler: [authenticate] }, locais.excluir)

    fastify.get('/tecnologia/tipos-equipamento', { preHandler: [authenticate] }, tiposEquipamento.listar)
    fastify.post('/tecnologia/tipos-equipamento', { preHandler: [authenticate] }, tiposEquipamento.criar)
    fastify.put('/tecnologia/tipos-equipamento/:id', { preHandler: [authenticate] }, tiposEquipamento.atualizar)
    fastify.delete('/tecnologia/tipos-equipamento/:id', { preHandler: [authenticate] }, tiposEquipamento.excluir)

    fastify.get('/tecnologia/marcas', { preHandler: [authenticate] }, marcas.listar)
    fastify.post('/tecnologia/marcas', { preHandler: [authenticate] }, marcas.criar)
    fastify.put('/tecnologia/marcas/:id', { preHandler: [authenticate] }, marcas.atualizar)
    fastify.delete('/tecnologia/marcas/:id', { preHandler: [authenticate] }, marcas.excluir)

    fastify.get('/tecnologia/modelos', { preHandler: [authenticate] }, modelos.listar)
    fastify.post('/tecnologia/modelos', { preHandler: [authenticate] }, modelos.criar)
    fastify.put('/tecnologia/modelos/:id', { preHandler: [authenticate] }, modelos.atualizar)
    fastify.delete('/tecnologia/modelos/:id', { preHandler: [authenticate] }, modelos.excluir)

    fastify.get('/tecnologia/areas', { preHandler: [authenticate] }, areas.listar)
    fastify.post('/tecnologia/areas', { preHandler: [authenticate] }, areas.criar)
    fastify.put('/tecnologia/areas/:id', { preHandler: [authenticate] }, areas.atualizar)
    fastify.delete('/tecnologia/areas/:id', { preHandler: [authenticate] }, areas.excluir)

    fastify.get('/tecnologia/equipamentos', { preHandler: [authenticate] }, getEquipamentos)
    fastify.post('/tecnologia/equipamentos', { preHandler: [authenticate] }, createEquipamento)
    fastify.put('/tecnologia/equipamentos/:id', { preHandler: [authenticate] }, updateEquipamento)
    fastify.delete('/tecnologia/equipamentos/:id', { preHandler: [authenticate] }, deleteEquipamento)

    fastify.get('/tecnologia/equipamentos-pessoais', { preHandler: [authenticate] }, getEquipamentosPessoais)
    fastify.post('/tecnologia/equipamentos-pessoais', { preHandler: [authenticate] }, createEquipamentoPessoal)
    fastify.put('/tecnologia/equipamentos-pessoais/:id', { preHandler: [authenticate] }, updateEquipamentoPessoal)
    fastify.delete('/tecnologia/equipamentos-pessoais/:id', { preHandler: [authenticate] }, deleteEquipamentoPessoal)
    fastify.post(
        '/tecnologia/equipamentos-pessoais/:id/termo/:momento',
        { preHandler: [authenticate] },
        uploadTermoEquipamentoPessoal
    )
    fastify.get(
        '/tecnologia/equipamentos-pessoais/:id/termo/:momento',
        { preHandler: [authenticate] },
        getTermoEquipamentoPessoal
    )
    fastify.delete(
        '/tecnologia/equipamentos-pessoais/:id/termo/:momento',
        { preHandler: [authenticate] },
        deleteTermoEquipamentoPessoal
    )

    fastify.get('/tecnologia/contratos', { preHandler: [authenticate] }, getContratos)
    fastify.post('/tecnologia/contratos', { preHandler: [authenticate] }, createContrato)
    fastify.put('/tecnologia/contratos/:id', { preHandler: [authenticate] }, updateContrato)
    fastify.delete('/tecnologia/contratos/:id', { preHandler: [authenticate] }, deleteContrato)
    fastify.post('/tecnologia/contratos/:id/arquivo', { preHandler: [authenticate] }, uploadArquivoContrato)
    fastify.get('/tecnologia/contratos/:id/arquivo', { preHandler: [authenticate] }, getArquivoContrato)
    fastify.delete('/tecnologia/contratos/:id/arquivo', { preHandler: [authenticate] }, deleteArquivoContrato)

    fastify.get('/tecnologia/gastos', { preHandler: [authenticate] }, getGastos)
    fastify.post('/tecnologia/gastos', { preHandler: [authenticate] }, createGasto)
    fastify.put('/tecnologia/gastos/:id', { preHandler: [authenticate] }, updateGasto)
    fastify.delete('/tecnologia/gastos/:id', { preHandler: [authenticate] }, deleteGasto)
    fastify.post('/tecnologia/gastos/:id/arquivo', { preHandler: [authenticate] }, uploadArquivoGasto)
    fastify.get('/tecnologia/gastos/:id/arquivo', { preHandler: [authenticate] }, getArquivoGasto)
    fastify.delete('/tecnologia/gastos/:id/arquivo', { preHandler: [authenticate] }, deleteArquivoGasto)
}
