import React from 'react'
import '../styles/InicioView.css'
import { FaUsers, FaTruck, FaHandshake, FaFileInvoice, FaRobot } from 'react-icons/fa'

interface Opcion {
  nombre: string
  descripcion: string
  icono: React.ReactNode
  onClick: () => void
}

interface InicioViewProps {
  onNavigate: (
    view: 'usuarios' | 'convenios' | 'requisicion' | 'logistica' | 'superasistente'
  ) => void
}

export const InicioView: React.FC<InicioViewProps> = ({ onNavigate }) => {
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
      descripcion: 'Aprobación y entrega de requisiciones',
      icono: <FaTruck size={50} />,
      onClick: () => onNavigate('logistica')
    },
    {
      nombre: 'SuperAsistente',
      descripcion: 'Métricas, actividad y estado del bot',
      icono: <FaRobot size={50} />,
      onClick: () => onNavigate('superasistente')
    }
  ]

  return (
    <div className="inicio-container">
      <div className="honeycomb-container">
        <div className="honeycomb">
          {/* Primera fila 2 hexágonos centrados */}
          <div className="honeycomb-row">
            {opciones.slice(0, 2).map((op, idx) => (
              <HexagonItem key={idx} opcion={op} />
            ))}
          </div>

          {/* Segunda fila 3 hexágonos centrados */}
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
