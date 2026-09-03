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
  FiShield
} from 'react-icons/fi'

// 1. Ampliamos la interfaz para recibir todas las métricas del backend
interface ChatbotMetrics {
  totalConveniosBancos: number
  messagesToday: number
  activeChats: number
  automationRate: number
  pendingErrors: number
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
  padding: 2.5rem;
  background: #1a1a2e;
  min-height: 100vh;
  color: #fff;
  font-family: 'Segoe UI', sans-serif;
  animation: ${fadeIn} 0.4s ease-out;
  overflow-y: auto;
  box-sizing: border-box;
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 1rem;
`

const TitleArea = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`

const BackButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 180, 216, 0.2);
    border-color: #00b4d8;
  }
`

const Title = styled.h1`
  font-size: 1.8rem;
  font-weight: 600;
  letter-spacing: 0.5px;
`

const GridKpis = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`

const KpiCard = styled.div`
  background: rgba(15, 52, 96, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
`

const KpiIcon = styled.div<{ color?: string; textColor?: string }>`
  background: ${(props) => props.color || 'rgba(0, 180, 216, 0.15)'};
  color: ${(props) => props.textColor || '#00b4d8'};
  width: 55px;
  height: 55px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
`

const KpiInfo = styled.div`
  display: flex;
  flex-direction: column;
`

const KpiValue = styled.span`
  font-size: 1.8rem;
  font-weight: 700;
  color: #fff;
`

const KpiLabel = styled.span`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.2rem;
`

const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`

const Panel = styled.div`
  background: rgba(15, 52, 96, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
`

const PanelTitle = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 1.2rem;
  font-weight: 600;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 0.6rem;
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;

  th,
  td {
    padding: 0.9rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    font-size: 0.9rem;
  }

  th {
    color: rgba(255, 255, 255, 0.6);
    font-weight: 500;
  }

  td {
    color: rgba(255, 255, 255, 0.9);
  }
`

const StatusBadge = styled.span<{ status: 'success' | 'warning' | 'info' }>`
  background: ${(props) =>
    props.status === 'success'
      ? 'rgba(40, 167, 69, 0.2)'
      : props.status === 'warning'
        ? 'rgba(255, 193, 7, 0.2)'
        : 'rgba(0, 180, 216, 0.2)'};
  color: ${(props) =>
    props.status === 'success' ? '#2ecc71' : props.status === 'warning' ? '#f1c40f' : '#00b4d8'};
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
`

const HealthItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  &:last-child {
    border-bottom: none;
  }
`

const HealthLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 0.95rem;
`

const ChatBotDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [metrics, setMetrics] = useState<ChatbotMetrics>({
    totalConveniosBancos: 0,
    messagesToday: 0,
    activeChats: 0,
    automationRate: 98.5,
    pendingErrors: 0
  })
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])

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
    // Opcional: refrescar cada 10 segundos automáticamente
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Container>
      <Header>
        <TitleArea>
          <BackButton onClick={() => navigate('/supermenu')}>
            <FiArrowLeft /> Volver al Menú
          </BackButton>
          <Title>Dashboard de Operaciones - Chatbot WhatsApp</Title>
        </TitleArea>
      </Header>

      {/* Tarjetas de Métricas KPI Dinámicas */}
      <GridKpis>
        <KpiCard>
          <KpiIcon color="rgba(40, 167, 69, 0.15)" textColor="#2ecc71">
            <FiUsers />
          </KpiIcon>
          <KpiInfo>
            <KpiValue>{metrics.totalConveniosBancos?.toLocaleString() || 0}</KpiValue>
            <KpiLabel>Convenios Bancarios Totales</KpiLabel>
          </KpiInfo>
        </KpiCard>

        <KpiCard>
          <KpiIcon color="rgba(0, 180, 216, 0.15)" textColor="#00b4d8">
            <FiMessageSquare />
          </KpiIcon>
          <KpiInfo>
            <KpiValue>{metrics.messagesToday?.toLocaleString() || 0}</KpiValue>
            <KpiLabel>Mensajes Procesados Hoy</KpiLabel>
          </KpiInfo>
        </KpiCard>

        <KpiCard>
          <KpiIcon color="rgba(40, 167, 69, 0.15)" textColor="#2ecc71">
            <FiUsers />
          </KpiIcon>
          <KpiInfo>
            <KpiValue>{metrics.activeChats?.toLocaleString() || 0}</KpiValue>
            <KpiLabel>Chats Activos (Últimas 24h)</KpiLabel>
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
          <KpiIcon color="rgba(241, 196, 15, 0.15)" textColor="#f1c40f">
            <FiShield />
          </KpiIcon>
          <KpiInfo>
            <KpiValue>{metrics.pendingErrors}</KpiValue>
            <KpiLabel>Fallas de API pendientes</KpiLabel>
          </KpiInfo>
        </KpiCard>
      </GridKpis>

      {/* Secciones Principales */}
      <SectionGrid>
        {/* Tabla de Actividad Reciente Dinámica */}
        <Panel>
          <PanelTitle>
            <FiActivity /> Actividad Reciente de Conversaciones (En Vivo)
          </PanelTitle>
          <Table>
            <thead>
              <tr>
                <th>Usuario / Remitente</th>
                <th>Intención / Flujo</th>
                <th>Tiempo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.length > 0 ? (
                recentActivity.map((item) => (
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
                  <td colSpan={4} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                    No hay actividad reciente registrada aún.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Panel>

        {/* Panel de Salud del Servidor */}
        <Panel>
          <PanelTitle>
            <FiServer /> Estado del Servidor y API
          </PanelTitle>
          <HealthItem>
            <HealthLabel>
              <FiCheckCircle color="#2ecc71" size={18} />
              Servidor Web (Render)
            </HealthLabel>
            <StatusBadge status="success">Online (100%)</StatusBadge>
          </HealthItem>

          <HealthItem>
            <HealthLabel>
              <FiCheckCircle color="#2ecc71" size={18} />
              Meta Cloud API (Webhook)
            </HealthLabel>
            <StatusBadge status="success">Conectado</StatusBadge>
          </HealthItem>

          <HealthItem>
            <HealthLabel>
              <FiClock color="#00b4d8" size={18} />
              Latencia Promedio
            </HealthLabel>
            <span style={{ fontSize: '0.9rem', color: '#00b4d8', fontWeight: 600 }}>185 ms</span>
          </HealthItem>

          <HealthItem>
            <HealthLabel>
              <FiShield color="#9b59b6" size={18} />
              Motor BuilderBot
            </HealthLabel>
            <StatusBadge status="success">Estable</StatusBadge>
          </HealthItem>
        </Panel>
      </SectionGrid>
    </Container>
  )
}

export default ChatBotDashboard
