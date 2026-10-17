import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthService } from './Logout'
import '../styles/SuperMenu.css'
import {
  FaChevronDown,
  FaChevronRight,
  FaUsers,
  FaFileAlt,
  FaRobot,
  FaHandshake,
  FaTruck,
  FaHome
} from 'react-icons/fa'
import { LogOut } from 'lucide-react'
import { InicioView } from './InicioView'
import { RequisicionesView } from './Requisiciones'
import { ApprovalList } from './Logistica'
import { Convenios } from './Convenios'
import Usuarios from './Usuarios'
import ChatBotDashboard from './ChatBotDashboard'

type ActiveView =
  | 'inicio'
  | 'requisicion'
  | 'convenios'
  | 'usuarios'
  | 'logistica'
  | 'superasistente'

interface Props {
  // Eliminamos la prop aprobaciones ya que no es necesaria
}

const SuperMenu: React.FC<Props> = () => {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeView, setActiveView] = useState<ActiveView>('inicio')

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
          <li
            className={activeView === 'inicio' ? 'active' : ''}
            onClick={handleInicioClick}
            aria-current={activeView === 'inicio' ? 'page' : undefined}
          >
            <FaHome className="menu-icon" />
            {!sidebarCollapsed && <span>Inicio</span>}
          </li>
          <li
            className={activeView === 'usuarios' ? 'active' : ''}
            onClick={handleUsuariosClick}
            aria-current={activeView === 'usuarios' ? 'page' : undefined}
          >
            <FaUsers className="menu-icon" />
            {!sidebarCollapsed && <span>Usuarios</span>}
          </li>
          <li
            className={activeView === 'convenios' ? 'active' : ''}
            onClick={handleConveniosClick}
            aria-current={activeView === 'convenios' ? 'page' : undefined}
          >
            <FaHandshake className="menu-icon" />
            {!sidebarCollapsed && <span>Convenios</span>}
          </li>
          <li
            className={activeView === 'requisicion' ? 'active' : ''}
            onClick={handleRequisicionClick}
            aria-current={activeView === 'requisicion' ? 'page' : undefined}
          >
            <FaFileAlt className="menu-icon" />
            {!sidebarCollapsed && <span>Requisición</span>}
          </li>
          <li
            className={activeView === 'logistica' ? 'active' : ''}
            onClick={handleLogisticaClick}
            aria-current={activeView === 'logistica' ? 'page' : undefined}
          >
            <FaTruck className="menu-icon" />
            {!sidebarCollapsed && <span>Logistica</span>}
          </li>
          <li
            className={activeView === 'superasistente' ? 'active' : ''}
            onClick={() => setActiveView('superasistente')}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                setActiveView('superasistente')
              }
            }}
            role="button"
            tabIndex={0}
            aria-current={activeView === 'superasistente' ? 'page' : undefined}
            aria-label="Abrir módulo SuperAsistente"
            title="SuperAsistente"
          >
            <FaRobot className="menu-icon" />
            {!sidebarCollapsed && <span>SuperAsistente</span>}
          </li>
        </ul>
      </aside>

      <div className="main-content">
        <header className="top-header">
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
            <Usuarios onBack={handleInicioClick} />
          ) : activeView === 'convenios' ? (
            <Convenios onBack={handleInicioClick} />
          ) : activeView === 'logistica' ? (
            <ApprovalList onBack={handleInicioClick} />
          ) : activeView === 'superasistente' ? (
            <ChatBotDashboard onBack={() => setActiveView('inicio')} />
          ) : (
            <RequisicionesView onBack={handleInicioClick} />
          )}
        </div>
      </div>
    </div>
  )
}

export default SuperMenu
