import React from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/InicioView.css'
import { FaUsers, FaGift, FaHandshake, FaFileInvoice, FaRobot, FaWhatsapp } from 'react-icons/fa'

interface Opcion {
  nombre: string
  descripcion: string
  icono: React.ReactNode
  onClick: () => void
}

interface InicioViewProps {
  onNavigate: (view: 'usuarios' | 'convenios' | 'requisicion' | 'logistica') => void
}

export const InicioView: React.FC<InicioViewProps> = ({ onNavigate }) => {
  const navigate = useNavigate()
  const opciones: Opcion[] = [
    {
      nombre: 'Usuarios',
      descripcion: 'Gestión de usuarios',
      icono: <FaUsers size={50} />,
      onClick: () => onNavigate('usuarios')
    },
    {
      nombre: 'Convenios',
      descripcion: 'Gestión de convenios',
      icono: <FaHandshake size={50} />,
      onClick: () => onNavigate('convenios')
    },
    {
      nombre: 'Requisición',
      descripcion: 'Solicitudes de compras',
      icono: <FaFileInvoice size={50} />,
      onClick: () => onNavigate('requisicion')
    },
    {
      nombre: 'Logistica',
      descripcion: 'Entrega de requisiciones',
      icono: <FaGift size={50} />,
      onClick: () => onNavigate('logistica')
    },
    {
      nombre: 'SuperAsistente',
      descripcion: 'Métricas y actividad del asistente',
      icono: <FaRobot size={50} />,
      onClick: () => navigate('/chatbot-metrics')
    }
  ]

  return (
    <div className="inicio-container">
      {/* Header con WhatsApp - Ahora es clickeable y lleva al Dashboard */}
      <div className="header">
        <div
          className="chatbot-label"
          onClick={() => navigate('/chatbot-metrics')}
          style={{ cursor: 'pointer' }}
          title="Ver Dashboard de Operaciones del Bot"
        >
          <FaWhatsapp size={28} className="chatbot-icon" />
          <span>Métricas SuperAsistente</span>
        </div>
      </div>

      {/* Contenedor del panal centrado */}
      <div className="honeycomb-container">
        <div className="honeycomb">
          {/* Primera fila: 2 hexágonos (Usuarios y Convenios) */}
          <div className="honeycomb-row">
            {opciones.slice(0, 2).map((op, idx) => (
              <HexagonItem key={idx} opcion={op} />
            ))}
          </div>

          {/* Segunda fila: tres módulos centrados */}
          <div className="honeycomb-row honeycomb-row-offset">
            {opciones.slice(2).map((op, idx) => (
              <HexagonItem key={idx + 2} opcion={op} />
            ))}
          </div>
        </div>
      </div>

      {/* Mensaje inferior */}
      <div className="slogan-box">
        <div className="slogan-content">
          <h2>SuperGIROS</h2>
          <p>Es la mejor opción</p>
          <div className="slogan-decoration"></div>
        </div>
      </div>
    </div>
  )
}

// Componente Hexágono reutilizable
const HexagonItem: React.FC<{ opcion: Opcion }> = ({ opcion }) => {
  return (
    <div
      className="honeycomb-cell"
      onClick={opcion.onClick}
      onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          opcion.onClick()
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Abrir módulo ${opcion.nombre}`}
    >
      <div className="honeycomb-hex">
        <div className="honeycomb-icon">{opcion.icono}</div>
        <div className="honeycomb-hex-content">
          <h3>{opcion.nombre}</h3>
          <p>{opcion.descripcion}</p>
          <span className="honeycomb-action">Ver más</span>
        </div>
      </div>
    </div>
  )
}
