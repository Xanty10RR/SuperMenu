import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiChevronDown,
  FiChevronUp,
  FiRefreshCw,
  FiSearch
} from 'react-icons/fi'
import styles from '../styles/RequisicionesView.module.css'

interface Requisicion {
  id: number
  nombre_solicitante: string
  departamento: string
  datos_completos?: {
    departamento?: string
  }
  descripcion: string
  fecha_creacion: string
  tipo?: string
  [key: string]: unknown
}

export const RequisicionesView: React.FC = () => {
  const [requisiciones, setRequisiciones] = useState<Requisicion[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<
    'tic' | 'logistica' | 'rrhh' | 'comercial' | 'otros' | 'todas'
  >('todas')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [procesando, setProcesando] = useState<{
    id: number
    estado: 'aprobado' | 'rechazado'
  } | null>(null)

  const fetchRequisiciones = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      // Siempre traemos todas para que los contadores y pestañas tengan la información completa
      const response = await axios.get('http://localhost:3003/api/requisiciones/todas')
      setRequisiciones(response.data)
    } catch (err) {
      console.error('Error fetching requisiciones:', err)
      setError('Error al cargar las requisiciones')
    } finally {
      setLoading(false)
    }
  }, []) // Quitar activeTab de aquí para que no vuelva a recargar al cambiar de pestaña

  useEffect((): void => {
    void fetchRequisiciones()
  }, [fetchRequisiciones])

  // Obtenemos el usuario logueado
  const storedUser = JSON.parse(localStorage.getItem('userData') || '{}')
  const userDept = (storedUser.departamento || '').toLowerCase().trim()
  const username = (storedUser.usuario || storedUser.username || '').toLowerCase().trim()

  const isGlobalUser =
    userDept.includes('logísti') ||
    userDept.includes('logistica') ||
    username === 'admin' ||
    username === 'jefelogistica'

  const handleAprobarRechazar = async (
    requisicion: Requisicion,
    nuevoEstado: 'aprobado' | 'rechazado'
  ): Promise<void> => {
    if (procesando?.id === requisicion.id) return

    setProcesando({ id: requisicion.id, estado: nuevoEstado })

    try {
      const nombreAprobador = 'jefesistemas'

      const response = await axios.post('http://localhost:3003/api/aprobaciones', {
        id_requisicion: requisicion.id,
        estado: nuevoEstado,
        aprobador: nombreAprobador,
        datos_completos: requisicion
      })

      if (response.status === 200) {
        setRequisiciones((prev) => prev.filter((item) => item.id !== requisicion.id))
      }
    } catch (err) {
      console.error('Error al enviar la decisión:', err)
      alert('Hubo un error al procesar la solicitud.')
    } finally {
      setProcesando(null)
    }
  }

  const toggleExpand = (id: number): void => {
    setExpandedId(expandedId === id ? null : id)
  }

  const formatDate = (dateInput: string | Date): string => {
    if (!dateInput) return ''

    const date = new Date(dateInput)
    if (isNaN(date.getTime())) return ''

    // Se resta 5 horas exactas (5 horas * 60 minutos * 60 segundos * 1000 milisegundos)
    // para convertir de UTC a la hora de Colombia (UTC-5)
    const colombiaTime = new Date(date.getTime() - 5 * 60 * 60 * 1000)

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }

    return colombiaTime.toLocaleString('es-CO', options)
  }

  const getBadgeClass = (tipo?: string): string => {
    switch (tipo) {
      case 'TIC':
        return styles.badgeTic
      case 'Logística':
        return styles.badgeLogistica
      case 'RRHH':
        return styles.badgeRrhh
      case 'Comercial':
        return styles.badgeComercial
      case 'Otros':
        return styles.badgeOtros
      default:
        return ''
    }
  }

  // Contadores basados en el total maestro de requisiciones
  const pendientesArea = (tabKey: string): number => {
    if (tabKey === 'todas') return requisiciones.length

    return requisiciones.filter((req) => {
      const depto = (req.departamento || '').toLowerCase().trim()
      switch (tabKey) {
        case 'tic':
          // Buscamos 'it', 'sistemas' o que 'tic' sea una palabra independiente
          return (
            depto.includes('it') ||
            depto.includes('sistemas') ||
            depto === 'tic' ||
            depto.split(/[\s/]+/).includes('tic')
          )
        case 'logistica':
          return depto.includes('logísti') || depto.includes('logistica')
        case 'rrhh':
          return depto.includes('rrhh') || depto.includes('recursos')
        case 'comercial':
          return depto.includes('comercial')
        case 'otros':
          return (
            !depto.includes('it') &&
            !depto.includes('sistemas') &&
            depto !== 'tic' &&
            !depto.includes('logísti') &&
            !depto.includes('logistica') &&
            !depto.includes('rrhh') &&
            !depto.includes('comercial')
          )
        default:
          return false
      }
    }).length
  }

  // Filtrado por la pestaña activa (aplicando la misma regla exacta)
  const requisicionesPorTab = requisiciones.filter((req) => {
    if (activeTab === 'todas') return true
    const depto = (req.departamento || '').toLowerCase().trim()

    if (activeTab === 'tic')
      return (
        depto.includes('it') ||
        depto.includes('sistemas') ||
        depto === 'tic' ||
        depto.split(/[\s/]+/).includes('tic')
      )
    if (activeTab === 'logistica') return depto.includes('logísti') || depto.includes('logistica')
    if (activeTab === 'rrhh') return depto.includes('rrhh') || depto.includes('recursos')
    if (activeTab === 'comercial') return depto.includes('comercial')
    if (activeTab === 'otros') {
      return (
        !depto.includes('it') &&
        !depto.includes('sistemas') &&
        !depto.includes('logísti') &&
        !depto.includes('logistica') &&
        !depto.includes('rrhh') &&
        !depto.includes('comercial')
      )
    }
    return true
  })

  // Filtrado final por Roles y barra de búsqueda
  const filtrarRequisiciones = requisicionesPorTab.filter((req) => {
    const deptoReq = (req.departamento || req.datos_completos?.departamento || '')
      .toLowerCase()
      .trim()
    const passesRole = isGlobalUser || deptoReq === userDept

    const matchesSearch =
      searchTerm === '' ||
      Object.values(req).some((val) => String(val).toLowerCase().includes(searchTerm.toLowerCase()))

    return passesRole && matchesSearch
  })

  return (
    <div className={styles.container}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className={styles.header}>Gestión de Requisiciones</h1>

        {/* Filtros y búsqueda */}
        <div className={styles.filterContainer}>
          {/* Las pestañas de departamentos SOLO para Logística y Admin */}
          {isGlobalUser && (
            <div className={styles.tabs}>
              {(['todas', 'tic', 'logistica', 'rrhh', 'comercial', 'otros'] as const).map((tab) => {
                const count = pendientesArea(tab)
                const label =
                  tab === 'todas'
                    ? 'Todas'
                    : tab === 'tic'
                      ? 'IT/Sistemas'
                      : tab === 'logistica'
                        ? 'Logística'
                        : tab === 'rrhh'
                          ? 'RRHH'
                          : tab === 'comercial'
                            ? 'Comercial'
                            : 'Otros'

                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`${styles.tab} ${
                      activeTab === tab ? styles.tabActive : styles.tabInactive
                    }`}
                  >
                    {label}
                    {count >= 0 && ` (${count})`}
                  </button>
                )
              })}
            </div>
          )}

          <div className={styles.searchContainer}>
            <FiSearch className={styles.searchIcon} size={18} />
            <input
              type="text"
              placeholder="Buscar requisiciones..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button onClick={fetchRequisiciones} className={styles.refreshButton}>
            <FiRefreshCw className={loading ? styles.spinner : ''} />
            <span style={{ marginLeft: '8px' }}>Actualizar</span>
          </button>
        </div>

        {/* Contenido principal */}
        <div className={styles.requisicionList}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
            </div>
          ) : error ? (
            <div className={styles.errorMessage}>{error}</div>
          ) : filtrarRequisiciones.length === 0 ? (
            <div className={styles.emptyMessage}>No se encontraron requisiciones</div>
          ) : (
            <ul>
              <AnimatePresence>
                {filtrarRequisiciones.map((req) => (
                  <motion.li
                    key={req.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={styles.requisicionItem}
                  >
                    <div className={styles.requisicionHeader}>
                      <div className={styles.requisicionInfo}>
                        <div className={styles.requisicionTitle}>
                          {req.tipo && (
                            <span
                              className={`${styles.requisicionBadge} ${getBadgeClass(req.tipo)}`}
                            >
                              {req.tipo}
                            </span>
                          )}
                          <h3 className={styles.requisicionName}>{req.nombre_solicitante}</h3>
                        </div>
                        <p className={styles.requisicionMeta}>
                          {req.departamento} • {formatDate(req.fecha_creacion)}
                        </p>
                        <p className={styles.requisicionDesc}>{req.descripcion}</p>
                      </div>

                      <div className={styles.requisicionButtons}>
                        <button
                          onClick={() => toggleExpand(req.id)}
                          className={`${styles.button} ${styles.buttonView}`}
                          aria-label="Ver detalles"
                        >
                          <FiEye className={styles.buttonIcon} />
                          <span>Ver</span>
                          {expandedId === req.id ? (
                            <FiChevronUp style={{ marginLeft: '5px' }} />
                          ) : (
                            <FiChevronDown style={{ marginLeft: '5px' }} />
                          )}
                        </button>

                        <button
                          className={`${styles.button} ${styles.buttonApprove}`}
                          onClick={() => handleAprobarRechazar(req, 'aprobado')}
                          disabled={procesando?.id === req.id}
                          style={{
                            opacity: procesando?.id === req.id ? 0.6 : 1,
                            cursor: procesando?.id === req.id ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <FiCheckCircle className={styles.buttonIcon} />
                          <span>
                            {procesando?.id === req.id && procesando?.estado === 'aprobado'
                              ? 'Procesando...'
                              : 'Aprobar'}
                          </span>
                        </button>

                        <button
                          className={`${styles.button} ${styles.buttonReject}`}
                          onClick={() => handleAprobarRechazar(req, 'rechazado')}
                          disabled={procesando?.id === req.id}
                          style={{
                            opacity: procesando?.id === req.id ? 0.6 : 1,
                            cursor: procesando?.id === req.id ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <FiXCircle className={styles.buttonIcon} />
                          <span>
                            {procesando?.id === req.id && procesando?.estado === 'rechazado'
                              ? 'Procesando...'
                              : 'Rechazar'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedId === req.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className={styles.detailsContainer}
                        >
                          <div className={styles.detailsGrid}>
                            {Object.entries(req)
                              .filter(
                                ([key]) =>
                                  ![
                                    'id',
                                    'nombre_solicitante',
                                    'departamento',
                                    'descripcion',
                                    'fecha_creacion',
                                    'tipo'
                                  ].includes(key)
                              )
                              .map(([key, value]) => (
                                <div key={key} className={styles.detailItem}>
                                  <div className={styles.detailLabel}>{key.replace(/_/g, ' ')}</div>
                                  <div className={styles.detailValue}>
                                    {typeof value === 'string' ? value : JSON.stringify(value)}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </motion.div>
    </div>
  )
}
