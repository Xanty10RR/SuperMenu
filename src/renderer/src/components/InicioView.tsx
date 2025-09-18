import React from 'react';
import '../styles/InicioView.css';
import { FaUsers, FaGift, FaLightbulb, FaHeadset, FaHandshake, FaFileInvoice, FaWhatsapp } from 'react-icons/fa';

interface Opcion {
  nombre: string;
  descripcion: string;
  icono: React.ReactNode;
  view: 'usuarios' | 'mejoras' | 'soporte' | 'convenios' | 'requisicion' | 'logistica';
}

interface InicioViewProps {
  onNavigate: (view: 'usuarios' | 'mejoras' | 'soporte' | 'convenios' | 'requisicion' | 'logistica') => void;
}

export const InicioView: React.FC<InicioViewProps> = ({ onNavigate }) => {
  const opciones: Opcion[] = [
    { nombre: 'Usuarios', descripcion: 'Gestión de usuarios', icono: <FaUsers size={50} />, view: 'usuarios' },
    { nombre: 'Mejoras', descripcion: 'Ideas y mejoras', icono: <FaLightbulb size={50} />, view: 'mejoras' },
    { nombre: 'Soporte', descripcion: 'Soporte técnico', icono: <FaHeadset size={50} />, view: 'soporte' },
    { nombre: 'Convenios', descripcion: 'Gestión de convenios', icono: <FaHandshake size={50} />, view: 'convenios' },
    { nombre: 'Requisición', descripcion: 'Solicitudes de compras', icono: <FaFileInvoice size={50} />, view: 'requisicion' },
    { nombre: 'Logistica', descripcion: 'Entrega de pedidos', icono: <FaGift size={50} />, view: 'logistica' },
  ];

  return (
    <div className="inicio-container">
      {/* Header con WhatsApp */}
      <div className="header">
        <div className="chatbot-label">
          <FaWhatsapp size={28} className="chatbot-icon" />
          <span>Chat-Bot Whatsapp</span>
        </div>
      </div>

      {/* Contenedor del panal centrado */}
      <div className="honeycomb-container">
        <div className="honeycomb">
          {/* Primera fila de hexágonos */}
          <div className="honeycomb-row">
            {opciones.slice(0, 3).map((op, idx) => (
              <HexagonItem key={idx} opcion={op} onNavigate={onNavigate} />
            ))}
          </div>
          
          {/* Segunda fila de hexágonos (centrada) */}
          <div className="honeycomb-row honeycomb-row-centered">
            {opciones.slice(3).map((op, idx) => (
              <HexagonItem key={idx + 3} opcion={op} onNavigate={onNavigate} />
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
  );
};

// Componente Hexágono reutilizable
const HexagonItem: React.FC<{ opcion: Opcion; onNavigate: InicioViewProps['onNavigate'] }> = ({ opcion, onNavigate }) => {
  return (
    <div className="honeycomb-cell" onClick={() => onNavigate(opcion.view)}>
      <div className="honeycomb-hex">
        <div className="honeycomb-icon">
          {opcion.icono}
        </div>
        <div className="honeycomb-hex-content">
          <h3>{opcion.nombre}</h3>
          <p>{opcion.descripcion}</p>
          <button>Ver más</button>
        </div>
      </div>
    </div>
  );
};