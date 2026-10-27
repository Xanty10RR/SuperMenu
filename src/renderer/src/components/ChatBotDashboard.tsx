import React, { useEffect, useState } from 'react'
import '../styles/ChatBotDashboard.css'
import PanelErrores from './PanelErrores'
import { api } from '../services/api'

import {
  FiMessageSquare,
  FiUsers,
  FiActivity,
  FiServer,
  FiCheckCircle,
  FiClock,
  FiCpu,
  FiBriefcase,
  FiMessageCircle,
  FiAlertTriangle,
  FiBarChart
} from 'react-icons/fi'

// Interfaz para recibir todas las métricas del backend
interface ChatbotMetrics {
  totalConveniosBancos: number | string
  desgloseBancos: {
    agrario: number | string
    aval: number | string
    bbva: number | string
  }
  totalHistoricoUsuarios: number | string
  promedioMensajesPorUsuario?: number
  messagesToday: number
  activeChats: number | string
  automationRate: number
  pendingErrors: number
  saludServidores?: {
    serverStatus: string
    supabaseStatus: string
    metaApiStatus: string
    builderBotStatus: string
    latencyMs: string
  }
}

interface ActivityItem {
  id: number | string
  user: string
  intent: string
  time: string
  status: 'success' | 'warning' | 'info'
}

const claseLatencia = (latencyStr?: string): string => {
  if (!latencyStr) return 'latency--unknown'
  const milliseconds = Number.parseInt(latencyStr.replace(/[^0-9]/g, ''), 10)
  if (Number.isNaN(milliseconds)) return 'latency--unknown'
  if (milliseconds < 150) return 'latency--good'
  if (milliseconds <= 300) return 'latency--warning'
  return 'latency--error'
}

const formatearConteo = (valor: number | string): string =>
  new Intl.NumberFormat('es-CO').format(Number(valor))

const ChatBotDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'errors'>('metrics')
  const [metrics, setMetrics] = useState<ChatbotMetrics>({
    totalConveniosBancos: 0,
    desgloseBancos: {
      agrario: 0,
      aval: 0,
      bbva: 0
    },
    totalHistoricoUsuarios: 0,
    messagesToday: 0,
    activeChats: 0,
    automationRate: 0,
    pendingErrors: 0
  })
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [currentPage, setCurrentPage] = useState<number>(1)
  const itemsPerPage = 10

  // Cálculo paginación de (Actividad Reciente de Conversaciones) max registros 10 por página
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentActivity = recentActivity.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(recentActivity.length / itemsPerPage) || 1

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        // Cargar métricas de KPIs
        const metricsRes = await api.get<ChatbotMetrics>('/api/chatbot/metrics')
        setMetrics(metricsRes.data)

        // Cargar actividad real en vivo desde Supabase
        const activityRes = await api.get<ActivityItem[]>('/api/chatbot/activity')
        setRecentActivity(activityRes.data)
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error)
      }
    }

    fetchData()
    // Refresca cada 10 segundos automáticamente
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <main className="chatbot-dashboard">
      <header className="chatbot-dashboard__header">
        <div className="chatbot-dashboard__title-area">
          <h1 className="chatbot-dashboard__title">
            Centro de Operaciones - Chatbot SuperAsistente
          </h1>
        </div>
      </header>

      <div className="chatbot-dashboard__tabs" role="group" aria-label="Secciones del dashboard">
        <button
          type="button"
          onClick={() => setActiveTab('metrics')}
          aria-pressed={activeTab === 'metrics'}
          className={`chatbot-dashboard__tab${activeTab === 'metrics' ? ' chatbot-dashboard__tab--active' : ''}`}
        >
          <FiBarChart className="chatbot-dashboard__tab-icon" aria-hidden="true" />
          <span>Métricas y Actividad</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('errors')}
          aria-pressed={activeTab === 'errors'}
          className={`chatbot-dashboard__tab${activeTab === 'errors' ? ' chatbot-dashboard__tab--active' : ''}`}
        >
          <FiAlertTriangle className="chatbot-dashboard__tab-icon" aria-hidden="true" />
          <span>Panel de Errores</span>
        </button>
      </div>

      {activeTab === 'errors' && <PanelErrores />}

      {/* Tarjetas de Métricas KPI Dinámicas */}
      <section className="chatbot-dashboard__kpi-grid" hidden={activeTab === 'errors'}>
        <article className="chatbot-dashboard__kpi-card chatbot-dashboard__kpi-card--agrario">
          <div className="chatbot-dashboard__kpi-icon chatbot-dashboard__kpi-icon--green">
            <FiBriefcase />
          </div>
          <div className="chatbot-dashboard__kpi-info">
            <span className="chatbot-dashboard__kpi-value">
              {formatearConteo(metrics.desgloseBancos.agrario)}
            </span>
            <span className="chatbot-dashboard__kpi-label">Convenios Agrario</span>
          </div>
        </article>

        <article className="chatbot-dashboard__kpi-card chatbot-dashboard__kpi-card--aval">
          <div className="chatbot-dashboard__kpi-icon chatbot-dashboard__kpi-icon--purple">
            <FiBriefcase />
          </div>
          <div className="chatbot-dashboard__kpi-info">
            <span className="chatbot-dashboard__kpi-value">
              {formatearConteo(metrics.desgloseBancos.aval)}
            </span>
            <span className="chatbot-dashboard__kpi-label">Convenios Aval</span>
          </div>
        </article>

        <article className="chatbot-dashboard__kpi-card chatbot-dashboard__kpi-card--bbva">
          <div className="chatbot-dashboard__kpi-icon chatbot-dashboard__kpi-icon--blue">
            <FiBriefcase />
          </div>
          <div className="chatbot-dashboard__kpi-info">
            <span className="chatbot-dashboard__kpi-value">
              {formatearConteo(metrics.desgloseBancos.bbva)}
            </span>
            <span className="chatbot-dashboard__kpi-label">Convenios BBVA</span>
          </div>
        </article>

        <article className="chatbot-dashboard__kpi-card chatbot-dashboard__kpi-card--total-convenios">
          <div className="chatbot-dashboard__kpi-icon chatbot-dashboard__kpi-icon--blue">
            <FiBriefcase />
          </div>
          <div className="chatbot-dashboard__kpi-info">
            <span className="chatbot-dashboard__kpi-value">
              {formatearConteo(metrics.totalConveniosBancos)}
            </span>
            <span className="chatbot-dashboard__kpi-label">Convenios Bancarios Totales</span>
          </div>
        </article>

        <article className="chatbot-dashboard__kpi-card chatbot-dashboard__kpi-card--usuarios">
          <div className="chatbot-dashboard__kpi-icon chatbot-dashboard__kpi-icon--blue">
            <FiUsers />
          </div>
          <div className="chatbot-dashboard__kpi-info">
            <span className="chatbot-dashboard__kpi-value">
              {formatearConteo(metrics.totalHistoricoUsuarios)}
            </span>
            <span className="chatbot-dashboard__kpi-label">Total Histórico de Usuarios</span>
          </div>
        </article>

        <article className="chatbot-dashboard__kpi-card chatbot-dashboard__kpi-card--flujos">
          <div className="chatbot-dashboard__kpi-icon chatbot-dashboard__kpi-icon--blue">
            <FiMessageSquare />
          </div>
          <div className="chatbot-dashboard__kpi-info">
            <span className="chatbot-dashboard__kpi-value">
              {metrics.promedioMensajesPorUsuario !== undefined
                ? metrics.promedioMensajesPorUsuario
                : 0}
            </span>
            <span className="chatbot-dashboard__kpi-label">Promedio Mensajes / Usuario</span>
          </div>
        </article>

        <article className="chatbot-dashboard__kpi-card chatbot-dashboard__kpi-card--chats">
          <div className="chatbot-dashboard__kpi-icon chatbot-dashboard__kpi-icon--green">
            <FiMessageCircle />
          </div>
          <div className="chatbot-dashboard__kpi-info">
            <span className="chatbot-dashboard__kpi-value">
              {formatearConteo(metrics.activeChats)}
            </span>
            <span className="chatbot-dashboard__kpi-label">Chats Únicos (Últimas 24h)</span>
          </div>
        </article>

        <article className="chatbot-dashboard__kpi-card chatbot-dashboard__kpi-card--automatizacion">
          <div className="chatbot-dashboard__kpi-icon chatbot-dashboard__kpi-icon--purple">
            <FiActivity />
          </div>
          <div className="chatbot-dashboard__kpi-info">
            <span className="chatbot-dashboard__kpi-value">{metrics.automationRate}%</span>
            <span className="chatbot-dashboard__kpi-label">
              Tasa de Automatización del Bot (Últimas 24h)
            </span>
          </div>
        </article>

        <article className="chatbot-dashboard__kpi-card chatbot-dashboard__kpi-card--fallas">
          <div className="chatbot-dashboard__kpi-icon chatbot-dashboard__kpi-icon--orange">
            <FiAlertTriangle />
          </div>
          <div className="chatbot-dashboard__kpi-info">
            <span className="chatbot-dashboard__kpi-value">{metrics.pendingErrors}</span>
            <span className="chatbot-dashboard__kpi-label">Fallas de API Pendientes</span>
          </div>
        </article>
      </section>

      <section className="chatbot-dashboard__section-grid" hidden={activeTab === 'errors'}>
        <article className="chatbot-dashboard__panel">
          <div className="chatbot-dashboard__panel-header">
            <h3 className="chatbot-dashboard__panel-title chatbot-dashboard__panel-title--compact">
              <FiActivity /> Actividad Reciente de Conversaciones
            </h3>
            <div className="chatbot-dashboard__live-indicator">
              <span className="chatbot-dashboard__live-dot" />
              Actualización en vivo
            </div>
          </div>

          <table className="chatbot-dashboard__table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Intención / Flujo</th>
                <th>Día/Hora</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {currentActivity.length > 0 ? (
                currentActivity.map((item) => (
                  <tr key={item.id}>
                    <td>{item.user}</td>
                    <td>{item.intent}</td>
                    <td>{item.time}</td>
                    <td>
                      <span
                        className={`chatbot-dashboard__status-badge chatbot-dashboard__status-badge--${item.status}`}
                      >
                        Completado
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="chatbot-dashboard__empty-state">
                    No hay actividad reciente registrada aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Paginación tabla*/}
          {recentActivity.length > 0 && (
            <div className="chatbot-dashboard__pagination">
              <span>
                Mostrando {indexOfFirstItem + 1} -{' '}
                {Math.min(indexOfLastItem, recentActivity.length)} de {recentActivity.length}{' '}
                registros
              </span>
              <div className="chatbot-dashboard__pagination-controls">
                <button
                  className="chatbot-dashboard__page-button"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    className={`chatbot-dashboard__page-button ${
                      currentPage === pageNumber ? 'chatbot-dashboard__page-button--active' : ''
                    }`}
                    onClick={() => setCurrentPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  className="chatbot-dashboard__page-button"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </article>

        {/* Panel Salud de Servidores */}
        <article className="chatbot-dashboard__panel">
          <h3 className="chatbot-dashboard__panel-title">
            <FiServer /> Estado del Servidor y API
          </h3>
          <div className="chatbot-dashboard__health-item">
            <div className="chatbot-dashboard__health-label">
              <FiCheckCircle className="chatbot-dashboard__health-icon chatbot-dashboard__health-icon--green" />
              Servidor Web (Render)
            </div>
            <span className="chatbot-dashboard__status-badge chatbot-dashboard__status-badge--success">
              {metrics?.saludServidores?.serverStatus || 'Online (100%)'}
            </span>
          </div>

          <div className="chatbot-dashboard__health-item">
            <div className="chatbot-dashboard__health-label">
              <FiCheckCircle className="chatbot-dashboard__health-icon chatbot-dashboard__health-icon--green" />
              Meta Cloud API (Webhook)
            </div>
            <span className="chatbot-dashboard__status-badge chatbot-dashboard__status-badge--success">
              {metrics?.saludServidores?.metaApiStatus || 'Conectado'}
            </span>
          </div>

          <div className="chatbot-dashboard__health-item">
            <div className="chatbot-dashboard__health-label">
              <FiCheckCircle className="chatbot-dashboard__health-icon chatbot-dashboard__health-icon--green" />
              Supabase (Base de Datos - Servidor)
            </div>
            <span className="chatbot-dashboard__status-badge chatbot-dashboard__status-badge--success">
              {metrics?.saludServidores?.supabaseStatus || 'Conectado'}
            </span>
          </div>

          <div className="chatbot-dashboard__health-item">
            <div className="chatbot-dashboard__health-label">
              <FiCpu className="chatbot-dashboard__health-icon chatbot-dashboard__health-icon--purple" />
              Motor BuilderBot
            </div>
            <span className="chatbot-dashboard__status-badge chatbot-dashboard__status-badge--success">
              {metrics?.saludServidores?.builderBotStatus || 'Estable'}
            </span>
          </div>

          <div className="chatbot-dashboard__health-item">
            <div className="chatbot-dashboard__health-label">
              <FiClock
                className={`chatbot-dashboard__health-icon ${claseLatencia(
                  metrics?.saludServidores?.latencyMs
                )}`}
              />
              Latencia Base de Datos PostgreSQL
            </div>
            <span
              className={`chatbot-dashboard__latency ${claseLatencia(
                metrics?.saludServidores?.latencyMs
              )}`}
            >
              {metrics?.saludServidores?.latencyMs || '0 ms'}
            </span>
          </div>
        </article>
      </section>
    </main>
  )
}

export default ChatBotDashboard
