import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Usuarios from './pages/Usuarios'
import Equipamentos from './pages/Equipamentos'
import EquipamentosPessoais from './pages/EquipamentosPessoais'
import Gastos from './pages/Gastos'
import CadastroSimples from './pages/CadastroSimples'
import CadastrosLayout from './layouts/CadastrosLayout'

export default function App() {
  return (
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/usuarios' element={<Usuarios />} />
      <Route path='/equipamentos' element={<Equipamentos />} />
      <Route path='/equipamentos-pessoais' element={<EquipamentosPessoais />} />
      <Route path='/gastos' element={<Gastos />} />

      <Route path='/cadastros' element={<CadastrosLayout />}>
        <Route index element={<Navigate to='locais' replace />} />
        <Route
          path='locais'
          element={
            <CadastroSimples
              titulo='Locais'
              subtitulo='Locais físicos onde os equipamentos ficam instalados.'
              endpoint='/tecnologia/locais'
              labelSingular='local'
            />
          }
        />
        <Route
          path='tipos-equipamento'
          element={
            <CadastroSimples
              titulo='Tipos de equipamento'
              subtitulo='Categorias de equipamento (notebook, PC, monitor...).'
              endpoint='/tecnologia/tipos-equipamento'
              labelSingular='tipo de equipamento'
            />
          }
        />
        <Route
          path='marcas'
          element={
            <CadastroSimples
              titulo='Marcas'
              subtitulo='Marcas de equipamentos cadastradas.'
              endpoint='/tecnologia/marcas'
              labelSingular='marca'
            />
          }
        />
        <Route
          path='modelos'
          element={
            <CadastroSimples
              titulo='Modelos'
              subtitulo='Modelos de equipamentos cadastrados.'
              endpoint='/tecnologia/modelos'
              labelSingular='modelo'
            />
          }
        />
        <Route
          path='areas'
          element={
            <CadastroSimples
              titulo='Áreas'
              subtitulo='Áreas usadas para classificar os gastos.'
              endpoint='/tecnologia/areas'
              labelSingular='área'
            />
          }
        />
      </Route>
    </Routes>
  )
}
