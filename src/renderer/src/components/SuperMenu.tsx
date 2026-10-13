import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthService } from './Logout'
import '../styles/SuperMenu.css'
import {
  FaChevronDown,
  FaGift,
  FaChevronRight,
  FaUser,
  FaFileExport,
  FaCog,
  FaFileAlt
} from 'react-icons/fa'
import { LogOut } from 'lucide-react'
import { InicioView } from './InicioView'
import { RequisicionesView } from './Requisiciones'
import { ApprovalList } from './Logistica'
import { Convenios } from './Convenios'
import Usuarios from './Usuarios'

interface Props {
  // Eliminamos la prop aprobaciones ya que no es necesaria
}

const SuperMenu: React.FC<Props> = () => {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeView, setActiveView] = useState<
    'inicio' | 'requisicion' | 'convenios' | 'usuarios' | 'logistica'
  >('inicio')

  const navigate = useNavigate()

  const toggleSidebar = (): void => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const handleRequisicionClick = (): void => {
    setActiveView('requisicion')
  }

  const handleInicioClick = (): void => {
    setActiveView('inicio')
  }

  const handleConveniosClick = (): void => {
    setActiveView('convenios')
  }

  const handleUsuariosClick = (): void => {
    setActiveView('usuarios')
  }

  const handleLogisticaClick = (): void => {
    setActiveView('logistica')
  }

  const handleLogout = async (): Promise<void> => {
    await AuthService.logout()
    navigate('/login', { state: { logoutMessage: 'Sesión cerrada correctamente' } })
  }

  return (
    <div className={`admin-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>SuperMenu</h2>
          <button className="toggle-sidebar" onClick={toggleSidebar}>
            {sidebarCollapsed ? <FaChevronRight /> : <FaChevronDown />}
          </button>
        </div>

        <ul className="sidebar-menu">
          <li onClick={handleInicioClick}>
            <FaCog className="menu-icon" />
            {!sidebarCollapsed && <span>Inicio</span>}
          </li>
          <li onClick={handleUsuariosClick}>
            <FaUser className="menu-icon" />
            {!sidebarCollapsed && <span>Usuarios</span>}
          </li>
          <li onClick={handleConveniosClick}>
            <FaFileExport className="menu-icon" />
            {!sidebarCollapsed && <span>Convenios</span>}
          </li>
          <li onClick={handleRequisicionClick}>
            <FaFileAlt className="menu-icon" />
            {!sidebarCollapsed && <span>Requisición</span>}
          </li>
          <li onClick={handleLogisticaClick}>
            <FaGift className="menu-icon" />
            {!sidebarCollapsed && <span>Logistica</span>}
          </li>
        </ul>
      </aside>

      <div className="main-content">
        <header className="top-header">
          <button className="inicio-btn" onClick={handleInicioClick}>
            Inicio
          </button>
          <div className="user-section">
            <span className="user-label">
              Bienvenido, {userData.username || userData.usuario || 'Invitado'}
            </span>
            <button className="logout-btn" onClick={handleLogout} title="Cerrar sesión">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <div className="content-area">
          {activeView === 'inicio' ? (
            <InicioView onNavigate={setActiveView} />
          ) : activeView === 'usuarios' ? (
            <Usuarios />
          ) : activeView === 'convenios' ? (
            <Convenios />
          ) : activeView === 'logistica' ? (
            <ApprovalList />
          ) : (
            <RequisicionesView />
          )}
        </div>
      </div>
    </div>
  )
}

export default SuperMenu
