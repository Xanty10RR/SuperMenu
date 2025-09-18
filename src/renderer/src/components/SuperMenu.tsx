import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from './Logout';
import '../styles/SuperMenu.css';
import { FaChevronDown, FaGift, FaChevronRight, FaUser, FaChartBar, FaFileExport, FaCog, FaFileAlt, FaChartLine } from 'react-icons/fa';
import { LogOut } from 'lucide-react';
import { MindMap } from './Soporte';
import { InicioView } from './InicioView';
import { RequisicionesView } from './Requisiciones';
import {ApprovalList} from './Logistica';
import {PokeApiComponent} from './Mejoras';
import ErrorBoundary from './ErrorBoundary';
import {usuarios} from './Usuarios';

interface Props {
  // Eliminamos la prop aprobaciones ya que no es necesaria
}


const SuperMenu: React.FC<Props> = () => {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState<
    'inicio' | 'requisicion' | 'mejoras' | 'convenios' | 'soporte' | 'usuarios' | 'logistica'
  >('inicio');

  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleRequisicionClick = () => {
    setActiveView('requisicion');
  };

  const handleInicioClick = () => {
    setActiveView('inicio');
  };

  const handleMejorassClick = () => {
    setActiveView('mejoras');
  };

  const handleConveniosClick = () => {
    setActiveView('convenios');
  };

  const handleSoporteClick = () => {
    setActiveView('soporte');
  };
  
  const handleUsuariosClick = () => {
    setActiveView('usuarios');
  };
    const handleLogisticaClick = () => {
    setActiveView('logistica');
  };
  
  const handleLogout = async () => {
    await AuthService.logout();
    navigate('/login', { state: { logoutMessage: 'Sesión cerrada correctamente' } });
  };

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
          <li onClick={handleMejorassClick}>
            <FaChartLine className="menu-icon" />
            {!sidebarCollapsed && <span>Mejoras</span>}
          </li>
          <li onClick={handleSoporteClick}>
            <FaChartBar className="menu-icon" />
            {!sidebarCollapsed && <span>Soporte</span>}
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
          <button className="inicio-btn" onClick={handleInicioClick}>Inicio</button>
          <div className="user-section">
            <span className="user-label">Bienvenido, {userData.nombre_completo}</span>
            <button className="logout-btn" onClick={handleLogout} title="Cerrar sesión">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <div className="content-area">
          {activeView === 'inicio' ? (
            <InicioView onNavigate={setActiveView} />
          ) : activeView === 'mejoras' ? (
            <PokeApiComponent />
          ) : activeView === 'usuarios' ? (
            
            <div className="inicio-view">
              {/* Vista inicial con fondo blanco */} 
            </div>
          ) : activeView === 'soporte' ? (
            <ErrorBoundary>
              <div className="mindmap-container" style={{ width: '100%', height: 'calc(100vh - 60px)' }}>
                <MindMap />
              </div>
            </ErrorBoundary>
          ) : activeView === 'convenios' ? (
            <div className="convenios-view">
              <h2>Gestión de Convenios</h2>
              <button className="btn-subir-excel">📁 Subir Archivos Excel</button>
            </div>
          ) : activeView === 'logistica' ? (
            <ApprovalList />
          ) : (
            <RequisicionesView />
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperMenu;