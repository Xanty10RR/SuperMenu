import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import {
  FiArrowLeft,
  FiMessageSquare,
  FiUsers,
  FiActivity,
  FiServer,
  FiCheckCircle,
  FiClock,
  FiCpu,
  FiBriefcase,
  FiMessageCircle,
  FiAlertTriangle
} from 'react-icons/fi'

// Ampliamos la interfaz para recibir todas las métricas del backend
interface ChatbotMetrics {
  totalConveniosBancos: number
  totalHistoricoUsuarios: number
  messagesToday: number
  activeChats: number
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

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`

const Container = styled.div`
  padding: 25px 20px;
  background: #f5f7fa;
  min-height: 100vh;
  color: #333;
  font-family: 'Segoe UI', sans-serif;
  animation: ${fadeIn} 0.4s ease-out;
  overflow-y: auto;
  box-sizing: border-box;
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  border-bottom: 1px solid #ddd;
  padding-bottom: 15px;
`

const TitleArea = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`

const BackButton = styled.button`
  background: #2f6db2;
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    background: #1d2f4a;
  }
`

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #23395d;
  margin: 0;
`

const GridKpis = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

const KpiCard = styled.div`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`

const KpiIcon = styled.div<{ color?: string; textColor?: string }>`
  background: ${(props) => props.color || 'rgba(47, 109, 178, 0.12)'};
  color: ${(props) => props.textColor || '#2f6db2'};
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
`

const KpiInfo = styled.div`
  display: flex;
  flex-direction: column;
`

const KpiValue = styled.span`
  font-size: 1.6rem;
  font-weight: 700;
  color: #23395d;
`

const KpiLabel = styled.span`
  font-size: 0.85rem;
  color: #666;
  margin-top: 4px;
`

const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
`

const Panel = styled.div`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`

const PanelTitle = styled.h3`
  font-size: 1.1rem;
  margin-bottom: 15px;
  font-weight: 600;
  color: #23395d;
  display: flex;
  align-items: center;
  gap: 8px;
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  border-radius: 6px;
  overflow: hidden;

  thead {
    background-color: #2f6db2;
    color: white;
  }

  th,
  td {
    padding: 12px 14px;
    font-size: 0.88rem;
  }

  th {
    font-weight: 500;
  }

  tbody tr {
    border-bottom: 1px solid #dddddd;
  }

  tbody tr:nth-of-type(even) {
    background-color: #f8fafc;
  }

  tbody tr:hover {
    background-color: #f1f5f9;
  }
`

const StatusBadge = styled.span<{ status: 'success' | 'warning' | 'info' }>`
  background: ${(props) =>
    props.status === 'success' ? '#d1fae5' : props.status === 'warning' ? '#fef3c7' : '#dbeafe'};
  color: ${(props) =>
    props.status === 'success' ? '#10b981' : props.status === 'warning' ? '#d97706' : '#2f6db2'};
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
`

const HealthItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #eee;

  &:last-child {
    border-bottom: none;
  }
`

const HealthLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.92rem;
  color: #333;
`
const colorLatencia = (latencyStr?: string): string => {
  if (!latencyStr) return '#2f6db2'
  const milliseconds = Number.parseInt(latencyStr.replace(/[^0-9]/g, ''), 10)
  if (Number.isNaN(milliseconds)) return '#2f6db2'
  if (milliseconds < 150) return '#10b981'
  if (milliseconds <= 300) return '#f59e0b'
  return '#ef4444'
}

const pulse = keyframes`
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
`

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
`

const LiveIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: #10b981;
  font-weight: 600;
  background: rgba(16, 185, 129, 0.1);
  padding: 4px 10px;
  border-radius: 12px;
`

const LiveDot = styled.span`
  width: 8px;
  height: 8px;
  background-color: #10b981;
  border-radius: 50%;
  animation: ${pulse} 1.5s infinite;
`

const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  padding-top: 12px;
  border-top: 1px solid #eee;
  font-size: 0.85rem;
  color: #666;
`

const PaginationControls = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
`

const PageButton = styled.button<{ active?: boolean }>`
  background: ${(props) => (props.active ? '#2f6db2' : '#f8fafc')};
  color: ${(props) => (props.active ? '#fff' : '#333')};
  border: 1px solid #cbd5e1;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${(props) => (props.active ? '#1d2f4a' : '#e2e8f0')};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const ChatBotDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [metrics, setMetrics] = useState<ChatbotMetrics>({
    totalConveniosBancos: 0,
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
        const metricsRes = await axios.get<ChatbotMetrics>(
          'http://localhost:3003/api/chatbot/metrics'
        )
        setMetrics(metricsRes.data)

        // Cargar actividad real en vivo desde Supabase
        const activityRes = await axios.get<ActivityItem[]>(
          'http://localhost:3003/api/chatbot/activity'
        )
        setRecentActivity(activityRes.data)
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error)
      }
    }

    fetchData()
    // Opcional: Refrescar cada 10 segundos automáticamente
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Container>
      <Header>
        <TitleArea>
          <BackButton onClick={() => navigate('/supermenu')}>
            <FiArrowLeft /> Volver
          </BackButton>
          <Title>Centro de Operaciones - Chatbot SuperAsistente</Title>
        </TitleArea>
      </Header>

      {/* Tarjetas de Métricas KPI Dinámicas */}
      <GridKpis>
        <KpiCard>
          <KpiIcon color="rgba(47, 109, 178, 0.12)" textColor="#2f6db2">
            <FiBriefcase />
          </KpiIcon>
          <KpiInfo>
            <KpiValue>{metrics.totalConveniosBancos?.toLocaleString() || 0}</KpiValue>
            <KpiLabel>Convenios Bancarios Totales</KpiLabel>
          </KpiInfo>
        </KpiCard>

        <KpiCard>
          <KpiIcon color="rgba(47, 109, 178, 0.12)" textColor="#2f6db2">
            <FiUsers />
          </KpiIcon>
          <KpiInfo>
            <KpiValue>{metrics.totalHistoricoUsuarios?.toLocaleString() || 0}</KpiValue>
            <KpiLabel>Total Histórico de Usuarios</KpiLabel>
          </KpiInfo>
        </KpiCard>

        <KpiCard>
          <KpiIcon color="rgba(47, 109, 178, 0.12)" textColor="#2f6db2">
            <FiMessageSquare />
          </KpiIcon>
          <KpiInfo>
            <KpiValue>{metrics.messagesToday?.toLocaleString() || 0}</KpiValue>
            <KpiLabel>Flujos Conversacionales Ejecutados Hoy</KpiLabel>
          </KpiInfo>
        </KpiCard>

        <KpiCard>
          <KpiIcon color="rgba(16, 185, 129, 0.15)" textColor="#10b981">
            <FiMessageCircle />
          </KpiIcon>
          <KpiInfo>
            <KpiValue>{metrics.activeChats?.toLocaleString() || 0}</KpiValue>
            <KpiLabel>Chats Únicos (Últimas 24h)</KpiLabel>
          </KpiInfo>
        </KpiCard>

        <KpiCard>
          <KpiIcon color="rgba(155, 89, 182, 0.15)" textColor="#9b59b6">
            <FiActivity />
          </KpiIcon>
          <KpiInfo>
            <KpiValue>{metrics.automationRate}%</KpiValue>
            <KpiLabel>Tasa de Automatización Chatbot</KpiLabel>
          </KpiInfo>
        </KpiCard>

        <KpiCard>
          <KpiIcon color="rgba(245, 158, 11, 0.15)" textColor="#f59e0b">
            <FiAlertTriangle />
          </KpiIcon>
          <KpiInfo>
            <KpiValue>{metrics.pendingErrors}</KpiValue>
            <KpiLabel>Fallas de API Pendientes</KpiLabel>
          </KpiInfo>
        </KpiCard>
      </GridKpis>

      <SectionGrid>
        <Panel>
          <PanelHeader>
            <PanelTitle style={{ margin: 0 }}>
              <FiActivity /> Actividad Reciente de Conversaciones
            </PanelTitle>
            <LiveIndicator>
              <LiveDot />
              Actualización en vivo
            </LiveIndicator>
          </PanelHeader>

          <Table>
            <thead>
              <tr>
                <th>Usuario / Remitente</th>
                <th>Intención / Flujo</th>
                <th>Hora</th>
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
                      <StatusBadge status={item.status}>Completado</StatusBadge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: '#666' }}>
                    No hay actividad reciente registrada aún.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>

          {/* Paginación tabla*/}
          {recentActivity.length > 0 && (
            <PaginationContainer>
              <span>
                Mostrando {indexOfFirstItem + 1} -{' '}
                {Math.min(indexOfLastItem, recentActivity.length)} de {recentActivity.length}{' '}
                registros
              </span>
              <PaginationControls>
                <PageButton
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </PageButton>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                  <PageButton
                    key={pageNumber}
                    active={currentPage === pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                  >
                    {pageNumber}
                  </PageButton>
                ))}
                <PageButton
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </PageButton>
              </PaginationControls>
            </PaginationContainer>
          )}
        </Panel>

        {/* Panel Salud de Servidorvidores */}
        <Panel>
          <PanelTitle>
            <FiServer /> Estado del Servidor y API
          </PanelTitle>
          <HealthItem>
            <HealthLabel>
              <FiCheckCircle color="#2ecc71" size={18} />
              Servidor Web (Render)
            </HealthLabel>
            <StatusBadge status="success">
              {metrics?.saludServidores?.serverStatus || 'Online (100%)'}
            </StatusBadge>
          </HealthItem>

          <HealthItem>
            <HealthLabel>
              <FiCheckCircle color="#2ecc71" size={18} />
              Meta Cloud API (Webhook)
            </HealthLabel>
            <StatusBadge status="success">
              {metrics?.saludServidores?.metaApiStatus || 'Conectado'}
            </StatusBadge>
          </HealthItem>

          <HealthItem>
            <HealthLabel>
              <FiCheckCircle color="#2ecc71" size={18} />
              Supabase (Base de Datos - Servidor)
            </HealthLabel>
            <StatusBadge status="success">
              {metrics?.saludServidores?.supabaseStatus || 'Conectado'}
            </StatusBadge>
          </HealthItem>

          <HealthItem>
            <HealthLabel>
              <FiCpu color="#9b59b6" size={18} />
              Motor BuilderBot
            </HealthLabel>
            <StatusBadge status="success">
              {metrics?.saludServidores?.builderBotStatus || 'Estable'}
            </StatusBadge>
          </HealthItem>

          <HealthItem>
            <HealthLabel>
              <FiClock color={colorLatencia(metrics?.saludServidores?.latencyMs)} size={18} />
              Latencia Base de Datos PostgreSQL
            </HealthLabel>
            <span
              style={{
                fontSize: '0.9rem',
                color: colorLatencia(metrics?.saludServidores?.latencyMs),
                fontWeight: 600
              }}
            >
              {metrics?.saludServidores?.latencyMs || '0 ms'}
            </span>
          </HealthItem>
        </Panel>
      </SectionGrid>
    </Container>
  )
}

export default ChatBotDashboard
