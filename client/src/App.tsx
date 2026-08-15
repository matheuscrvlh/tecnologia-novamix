import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Usuarios from './pages/Usuarios'
import Equipamentos from './pages/Equipamentos'
import EquipamentosPessoais from './pages/EquipamentosPessoais'
import Gastos from './pages/Gastos'

export default function App() {
  return (
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/usuarios' element={<Usuarios />} />
      <Route path='/equipamentos' element={<Equipamentos />} />
      <Route path='/equipamentos-pessoais' element={<EquipamentosPessoais />} />
      <Route path='/gastos' element={<Gastos />} />
    </Routes>
  )
}
