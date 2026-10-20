import React, { useState, useEffect } from 'react'
import {
  faEye,
  faCheckCircle,
  faTimesCircle,
  faClock,
  faTruck,
  faBoxOpen
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { FiSearch } from 'react-icons/fi'
import axios from 'axios'
import '../styles/ApprovalList.css'

interface ApprovalItem {
  id: number
  datos_completos: {
    id: number
    nombre_solicitante: string
    departamento: string
    descripcion: string
    fecha_creacion: string
    [key: string]: unknown
  }
  estado: string
  aprobador: string
  tabla_origen: string
  fecha_decision: string | null
  entregado_por?: string
  fecha_entrega?: string | null
  observaciones?: string
}

type TabType = 'approved' | 'rejected' | 'delivered'

export const ApprovalList: React.FC = () => {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([])
  const [rejected, setRejected] = useState<ApprovalItem[]>([])
  const [delivered, setDelivered] = useState<ApprovalItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('approved')
  const [searchTerm, setSearchTerm] = useState('')
  const [deliveryData, setDeliveryData] = useState({
    entregado_por: '',
    observaciones: ''
  })

  // Fecha larga (con hora y minutos exactos en Colombia)
  const formatDate = (dateInput: string | Date | null | undefined): string => {
    if (!dateInput) return ''
    const date = new Date(dateInput)
    if (isNaN(date.getTime())) return ''

    return date.toLocaleString('en-GB', {
      timeZone: 'America/Bogota',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  // Fecha corta para las tarjetas principales (Solicitud, Decisión y Entrega)
  const formatShortDate = (dateInput: string | Date | null | undefined): string => {
    if (!dateInput) return ''
    const date = new Date(dateInput)
    if (isNaN(date.getTime())) return ''

    return date.toLocaleDateString('es-CO', {
      timeZone: 'America/Bogota'
    })
  }

  // Estados y lectura inicial del usuario logueado
  const [isSubmitting, setIsSubmitting] = useState<'delivery' | 'reject' | null>(null)

  const storedUser = JSON.parse(localStorage.getItem('userData') || '{}')
  const userDept = (storedUser.departamento || '').toLowerCase().trim()
  const username = (storedUser.usuario || storedUser.username || '').toLowerCase().trim()

  const canManageDeliveries =
    userDept.includes('logísti') ||
    userDept.includes('logistica') ||
    username === 'jefelogistica' ||
    username === 'admin'

  // El useEffect solo para cargar los datos al iniciar la vista
  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        setLoading(true)
        setError(null)

        const response = await axios.get('http://localhost:3003/api/aprobaciones')
        const allItems = response.data

        // Definir si el usuario tiene permiso global (jefelogistica y admin)
        const isGlobalUser = canManageDeliveries

        // Si NO es usuario global, filtramos estrictamente por su departamento
        const filteredItems = isGlobalUser
          ? allItems
          : allItems.filter((req: ApprovalItem) => {
              let detalles = req.datos_completos
              if (typeof detalles === 'string') {
                try {
                  detalles = JSON.parse(detalles)
                } catch {
                  detalles = {} as typeof detalles
                }
              }
              const itemDept = (detalles?.departamento || '').toLowerCase().trim()
              return itemDept === userDept
            })

        const approvedItems = filteredItems
          .filter((item: ApprovalItem) => (item.estado || '').toLowerCase() === 'aprobado')
          .sort(
            (a: ApprovalItem, b: ApprovalItem) =>
              new Date(b.fecha_decision || 0).getTime() - new Date(a.fecha_decision || 0).getTime()
          )

        const rejectedItems = filteredItems.filter((item: ApprovalItem) => {
          const est = (item.estado || '').toLowerCase().trim()
          return est.includes('rechaz')
        })

        const deliveredItems = filteredItems.filter(
          (item: ApprovalItem) => (item.estado || '').toLowerCase() === 'entregado'
        )

        setApprovals(approvedItems)
        setRejected(rejectedItems)
        setDelivered(deliveredItems)
      } catch (err) {
        console.error('Error al cargar aprobaciones:', err)
        setError('No se pudieron cargar las solicitudes')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [canManageDeliveries, userDept])

  // Render de las pestañas
  const renderTabContent = (): React.ReactNode | null => {
    const filterItems = (items: ApprovalItem[]): ApprovalItem[] => {
      const term = searchTerm.trim().toLocaleLowerCase()
      if (!term) return items

      return items.filter((item) => {
        const requestId = String(item.datos_completos?.id ?? item.id).toLocaleLowerCase()
        const approvalId = String(item.id).toLocaleLowerCase()
        const requesterName = String(
          item.datos_completos?.nombre_solicitante ?? ''
        ).toLocaleLowerCase()

        return requestId.includes(term) || approvalId.includes(term) || requesterName.includes(term)
      })
    }

    switch (activeTab) {
      case 'approved':
        return renderApprovalList(filterItems(approvals), canManageDeliveries)
      case 'rejected':
        return renderApprovalList(filterItems(rejected), false)
      case 'delivered':
        return renderApprovalList(filterItems(delivered), false, true)
      default:
        return null
    }
  }

  const toggleExpand = (id: number): void => {
    setExpandedId(expandedId === id ? null : id)
  }

  const handleDelivery = async (aprobacionId: number): Promise<void> => {
    if (!deliveryData.entregado_por.trim()) {
      alert('Por favor ingrese el nombre de quien realiza la entrega')
      return
    }

    try {
      setIsSubmitting('delivery')
      setError(null)

      // Actualizar el estado en el backend
      const rolParaHeader =
        username === 'admin' || username === 'jefelogistica' ? username : userDept

      await axios.patch(
        `http://localhost:3003/api/aprobaciones/${aprobacionId}/entregar`,
        {
          entregado_por: deliveryData.entregado_por.trim(),
          observaciones: deliveryData.observaciones.trim()
        },
        {
          headers: {
            'x-user-role': rolParaHeader
          }
        }
      )

      // Actualizar el estado local
      const updatedItem = approvals.find((item) => item.id === aprobacionId)
      if (updatedItem) {
        const deliveredItem = {
          ...updatedItem,
          estado: 'Entregado',
          entregado_por: deliveryData.entregado_por.trim(),
          observaciones: deliveryData.observaciones.trim(),
          fecha_entrega: new Date().toISOString()
        }

        setApprovals((prev) => prev.filter((item) => item.id !== aprobacionId))
        setDelivered((prev) => [deliveredItem, ...prev])
      }

      // Resetear el formulario
      setDeliveryData({ entregado_por: '', observaciones: '' })
      setExpandedId(null)
    } catch (err) {
      console.error('Error al registrar entrega:', err)
      setError('Error al registrar entrega. Por favor intente nuevamente.')
    } finally {
      setIsSubmitting(null)
    }
  }

  // Función para rechazar la solicitud desde logística
  const handleReject = async (aprobacionId: number): Promise<void> => {
    const responsableLogistica = deliveryData.entregado_por.trim()
    if (!responsableLogistica) {
      alert('Por favor ingrese el nombre del responsable de logística')
      return
    }

    if (!deliveryData.observaciones.trim()) {
      alert(
        'Por favor ingrese una observación indicando el motivo del rechazo (ej. sin stock, muy costoso, etc.)'
      )
      return
    }

    try {
      setIsSubmitting('reject')
      setError(null)

      await axios.patch(`http://localhost:3003/api/aprobaciones/${aprobacionId}/rechazar`, {
        rechazado_por: responsableLogistica,
        observaciones: deliveryData.observaciones.trim()
      })

      const updatedItem = approvals.find((item) => item.id === aprobacionId)
      if (updatedItem) {
        const rejectedItem = {
          ...updatedItem,
          estado: 'Rechazado',
          entregado_por: responsableLogistica,
          observaciones: deliveryData.observaciones.trim(),
          fecha_decision: new Date().toISOString()
        }

        setApprovals((prev) => prev.filter((item) => item.id !== aprobacionId))
        setRejected((prev) => [rejectedItem, ...prev])
      }

      setDeliveryData({ entregado_por: '', observaciones: '' })
      setExpandedId(null)
    } catch (err) {
      console.error('Error al rechazar solicitud:', err)
      setError('Error al rechazar la solicitud. Por favor intente nuevamente.')
    } finally {
      setIsSubmitting(null)
    }
  }

  const handleDeliveryInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target
    setDeliveryData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const renderStatusIcon = (status: string): React.ReactNode => {
    const statusLower = status.toLowerCase()
    if (statusLower === 'aprobado') {
      return <FontAwesomeIcon icon={faCheckCircle} className="status-icon approved" />
    }
    if (statusLower === 'rechazado') {
      return <FontAwesomeIcon icon={faTimesCircle} className="status-icon rejected" />
    }
    if (statusLower === 'entregado') {
      return <FontAwesomeIcon icon={faBoxOpen} className="status-icon delivered" />
    }
    return <FontAwesomeIcon icon={faClock} className="status-icon pending" />
  }

  const mayusculaCadaPalabra = (value: string): string =>
    value
      .split(/(\s+)/)
      .map((part) => (part.trim() ? part.charAt(0).toUpperCase() + part.slice(1) : part))
      .join('')

  const mayusculaPrimeraletra = (value: string): string =>
    value ? value.charAt(0).toUpperCase() + value.slice(1) : ''

  const renderApprovalList = (
    items: ApprovalItem[],
    showDeliveryButton: boolean,
    isDelivered: boolean = false
  ): React.ReactNode => {
    if (items.length === 0) {
      return (
        <div className="no-results">
          {searchTerm.trim()
            ? 'No se encontraron solicitudes para esa búsqueda'
            : 'No hay elementos para mostrar'}
        </div>
      )
    }

    return (
      <div className={`approval-list ${isDelivered ? 'delivered-list' : ''}`}>
        {items.map((item) => {
          // Obtenemos la clase de estado en minúsculas para el borde (aprobado, rechazado, entregado)
          const estadoClase = item.estado.toLowerCase()

          return (
            <div
              key={item.id}
              className={`approval-item ${estadoClase} ${expandedId === item.id ? 'expanded' : ''}`}
            >
              <div className="item-header" onClick={() => toggleExpand(item.id)}>
                <div className="header-info">
                  <span className="reqId">#{item.datos_completos.id}</span>
                  <h3>{mayusculaCadaPalabra(item.datos_completos.nombre_solicitante)}</h3>
                  <p className="department">{item.datos_completos.departamento}</p>
                  <p className="description">
                    {mayusculaPrimeraletra(item.datos_completos.descripcion)}
                  </p>
                </div>

                <div className="header-dates">
                  <p className="request-date">
                    <span>Solicitud:</span> {formatDate(item.datos_completos.fecha_creacion)}
                  </p>
                  {isDelivered ? (
                    <p className="delivery-date">
                      <span>Entregado:</span> {formatDate(item.fecha_entrega)}
                    </p>
                  ) : (
                    <p className="approval-date">
                      <span>Decisión:</span> {formatDate(item.fecha_decision)}
                    </p>
                  )}
                </div>

                <div className="header-actions">
                  {renderStatusIcon(item.estado)}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleExpand(item.id)
                    }}
                    className="view-button"
                  >
                    <FontAwesomeIcon icon={faEye} /> {expandedId === item.id ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
              </div>

              {expandedId === item.id && (
                <div className="item-details">
                  <div className="details-section">
                    <h4>Detalles de la Solicitud</h4>
                    <div className="details-grid">
                      {Object.entries(item.datos_completos).map(
                        ([key, value]) =>
                          key !== 'id' &&
                          key !== 'estado' &&
                          key !== 'nombre_solicitante' &&
                          key !== 'departamento' &&
                          key !== 'descripcion' &&
                          key.toLowerCase() !== 'fecha_solicitud' &&
                          key.toLowerCase() !== 'fecha_creacion' &&
                          key.toLowerCase() !== 'fecha creacion' && (
                            <div key={key} className="detail-item">
                              <span className="detail-label">
                                {key.toLowerCase() === 'fecha_creacion' ||
                                key.toLowerCase() === 'fecha creacion'
                                  ? 'Fecha Solicitud'
                                  : key.replace(/_/g, ' ')}
                              </span>
                              <span className="detail-value">
                                {key.toLowerCase().includes('fecha')
                                  ? formatShortDate(String(value))
                                  : key.toLowerCase() === 'observaciones'
                                    ? mayusculaPrimeraletra(String(value))
                                    : String(value)}
                              </span>
                            </div>
                          )
                      )}
                    </div>
                  </div>

                  {/* Información unificada y ordenada */}
                  <div className="approval-info">
                    <div className="approval-field">
                      <span>Aprobador:</span>
                      <span>{mayusculaPrimeraletra(item.aprobador)}</span>
                    </div>
                    <div className="approval-field">
                      <span>Origen:</span>
                      <span>{mayusculaPrimeraletra(item.tabla_origen)}</span>
                    </div>
                    <div className="approval-field">
                      <span>Estado:</span>
                      <span className={`status-text ${estadoClase}`}>
                        {mayusculaPrimeraletra(item.estado)}
                      </span>
                    </div>

                    {isDelivered && item.entregado_por && (
                      <div className="approval-field">
                        <span>Entregado por:</span>
                        <span className={`status-text ${estadoClase}`}>
                          {mayusculaPrimeraletra(item.entregado_por)}
                        </span>
                      </div>
                    )}

                    {!isDelivered && estadoClase === 'rechazado' && item.entregado_por && (
                      <div className="approval-field">
                        <span>Rechazado por:</span>
                        <span className={`status-text ${estadoClase}`}>
                          {mayusculaPrimeraletra(item.entregado_por)}
                        </span>
                      </div>
                    )}
                  </div>

                  {item.observaciones && (
                    <div
                      className={`delivery-observations ${estadoClase === 'rechazado' ? 'rejected-observations' : ''}`}
                    >
                      <h4>
                        {estadoClase === 'rechazado'
                          ? 'Observaciones de rechazo:'
                          : 'Observaciones de entrega:'}
                      </h4>
                      <p>{mayusculaPrimeraletra(item.observaciones)}</p>
                    </div>
                  )}

                  {showDeliveryButton && (
                    <div className="delivery-section">
                      <h4>Gestión de Logística (Inventario y Despacho)</h4>
                      <div className="delivery-form">
                        <div className="form-group">
                          <label>Responsable de Logística:</label>
                          <input
                            type="text"
                            name="entregado_por"
                            value={deliveryData.entregado_por}
                            onChange={handleDeliveryInputChange}
                            placeholder="Nombre del responsable"
                            disabled={isSubmitting !== null}
                          />
                        </div>
                        <div className="form-group">
                          <label>Observaciones / Motivo de rechazo:</label>
                          <textarea
                            name="observaciones"
                            value={deliveryData.observaciones}
                            onChange={handleDeliveryInputChange}
                            placeholder="Escribe notas de entrega o el motivo obligatorio en caso de rechazo..."
                            rows={3}
                            disabled={isSubmitting !== null}
                          />
                        </div>
                        <div
                          className="delivery-buttons-container"
                          style={{ display: 'flex', gap: '12px', marginTop: '15px' }}
                        >
                          {/* Botón de Entregar */}
                          <button
                            type="button"
                            onClick={() => handleDelivery(item.id)}
                            className="deliver-button"
                            disabled={isSubmitting !== null}
                            style={{ flex: 1 }}
                          >
                            {isSubmitting === 'delivery' ? (
                              'Procesando...'
                            ) : (
                              <>
                                <FontAwesomeIcon icon={faTruck} /> Marcar como Entregado
                              </>
                            )}
                          </button>

                          {/* Botón de Rechazar */}
                          <button
                            type="button"
                            onClick={() => handleReject(item.id)}
                            className="reject-button"
                            disabled={isSubmitting !== null}
                            style={{ flex: 1 }}
                          >
                            {isSubmitting === 'reject' ? (
                              'Procesando...'
                            ) : (
                              <>
                                <FontAwesomeIcon icon={faTimesCircle} /> Rechazar Solicitud
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="approval-list-container">
      <h2 className="list-title">
        {activeTab === 'approved' && 'Solicitudes Aprobadas'}
        {activeTab === 'rejected' && 'Solicitudes Rechazadas'}
        {activeTab === 'delivered' && 'Solicitudes Entregadas'}
      </h2>

      <div className="tabs">
        <button
          className={`tab-button approved ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          Aprobadas
        </button>
        <button
          className={`tab-button rejected ${activeTab === 'rejected' ? 'active' : ''}`}
          onClick={() => setActiveTab('rejected')}
        >
          Rechazadas
        </button>
        <button
          className={`tab-button delivered ${activeTab === 'delivered' ? 'active' : ''}`}
          onClick={() => setActiveTab('delivered')}
        >
          Entregadas
        </button>
      </div>

      <div className="barraBusqueda">
        <FiSearch className="barraBusqueda-icon" aria-hidden="true" />
        <input
          type="search"
          aria-label="Buscar solicitudes por ID o nombre"
          placeholder="Buscar por ID o nombre..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando datos...</p>
        </div>
      ) : (
        <div className="content-container">{renderTabContent()}</div>
      )}
    </div>
  )
}
