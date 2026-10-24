import React, { useState, useEffect, useCallback } from 'react'
import {
  FiTrash,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiCalendar,
  FiChevronDown
} from 'react-icons/fi'
import '../styles/PanelErrores.css'

interface ErrorApi {
  id: number
  mensaje: string
  origen: string
  resuelto: boolean
  fecha: string
  telefono?: string | null
}

const esObjeto = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const normalizarRol = (rol: string): string =>
  rol
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

const esRegistroError = (value: unknown): value is ErrorApi => {
  if (!esObjeto(value)) return false

  return (
    (typeof value.id === 'number' || (typeof value.id === 'string' && /^\d+$/.test(value.id))) &&
    typeof value.mensaje === 'string' &&
    typeof value.origen === 'string' &&
    typeof value.resuelto === 'boolean' &&
    typeof value.fecha === 'string' &&
    (typeof value.telefono === 'string' || value.telefono === null || value.telefono === undefined)
  )
}

export const PanelErrores: React.FC = () => {
  const [errores, setErrores] = useState<ErrorApi[]>([])
  const [cargando, setCargando] = useState<boolean>(true)
  const [filtro, setFiltro] = useState<'pendientes' | 'resueltos'>('pendientes')
  const [periodo, setPeriodo] = useState<
    'todos' | '24h' | '7dias' | '14dias' | '21dias' | '1mes' | '2meses'
  >('todos')
  const [errorCarga, setErrorCarga] = useState('')
  const [errorResolucion, setErrorResolucion] = useState('')
  const [resolviendoId, setResolviendoId] = useState<number | null>(null)

  const obtenerRolUsuario = (): string => {
    try {
      const rawData = localStorage.getItem('userData') || localStorage.getItem('usuario') || '{}'
      const userData: unknown = JSON.parse(rawData)

      // Se comprueba si es un objeto válido
      if (!esObjeto(userData)) {
        // Si es un string directo en localStorage
        const rolDirecto = localStorage.getItem('userRole') || localStorage.getItem('rol') || ''
        return rolDirecto.toLowerCase()
      }

      const departamento = typeof userData.departamento === 'string' ? userData.departamento : ''
      const rol = typeof userData.rol === 'string' ? userData.rol : ''
      const role = typeof userData.role === 'string' ? userData.role : ''
      const cargo = typeof userData.cargo === 'string' ? userData.cargo : ''

      const rolesEncontrados = [departamento, rol, role, cargo]
        .filter((r) => r.length > 0)
        .map(normalizarRol)

      // Verificamos si alguno de los campos incluye palabras clave permitidas
      const rolValido = rolesEncontrados.find(
        (r) => r.includes('admin') || r.includes('jefe') || r.includes('sistemas')
      )

      return rolValido || rol || 'admin'
    } catch (error) {
      console.error('No se pudo leer el rol del usuario:', error)
      return 'admin'
    }
  }

  const rolUsuario = obtenerRolUsuario()

  // Habilitamos los permisos si el rol normalizado incluye 'admin', 'jefe' o 'sistemas'
  const puedeResolverErrores =
    rolUsuario.includes('admin') || rolUsuario.includes('jefe') || rolUsuario.includes('sistemas')

  const obtenerErrores = useCallback(async (): Promise<void> => {
    try {
      setCargando(true)
      setErrorCarga('')

      const rolActual = rolUsuario
      const nombreUsuario =
        localStorage.getItem('userName') || localStorage.getItem('usuario') || 'admin'

      const response = await fetch('http://localhost:3003/api/errores', {
        headers: {
          'Content-Type': 'application/json',
          rol: rolActual,
          'x-user-role': rolActual,
          'x-user-name': nombreUsuario
        }
      })

      if (!response.ok) {
        throw new Error(`No se pudieron cargar los errores (HTTP ${response.status})`)
      }

      const data: unknown = await response.json()
      if (!Array.isArray(data) || !data.every(esRegistroError)) {
        throw new Error('La respuesta del servidor no tiene el formato esperado')
      }

      setErrores(
        data.map((registro) => ({
          ...registro,
          id: Number(registro.id)
        }))
      )
    } catch (error) {
      console.error('Error de red al cargar errores:', error)
      setErrorCarga(
        error instanceof Error ? error.message : 'Ocurrió un error al cargar los registros.'
      )
    } finally {
      setCargando(false)
    }
  }, [rolUsuario])

  useEffect(() => {
    obtenerErrores()
  }, [obtenerErrores])

  const handleResolverError = async (id: number): Promise<void> => {
    try {
      setResolviendoId(id)
      setErrorResolucion('')

      const nombreUsuario =
        localStorage.getItem('userName') || localStorage.getItem('usuario') || 'admin'

      const response = await fetch(`http://localhost:3003/api/errores/${id}/resolver`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          rol: rolUsuario,
          'x-user-role': rolUsuario,
          'x-user-name': nombreUsuario,
          usuario: nombreUsuario
        }
      })

      if (!response.ok) {
        throw new Error(`No se pudo resolver el error (HTTP ${response.status})`)
      }

      setErrores((prev) => prev.map((err) => (err.id === id ? { ...err, resuelto: true } : err)))
    } catch (error) {
      console.error('Error al resolver:', error)
      setErrorResolucion(
        error instanceof Error ? error.message : 'Ocurrió un error al resolver la incidencia.'
      )
    } finally {
      setResolviendoId(null)
    }
  }

  const handleLimpiarHistorial = async (): Promise<void> => {
    try {
      const nombreUsuario =
        localStorage.getItem('userName') || localStorage.getItem('usuario') || 'admin'
      const response = await fetch('http://localhost:3003/api/errores/archivar-resueltos', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          rol: rolUsuario,
          'x-user-role': rolUsuario,
          'x-user-name': nombreUsuario
        }
      })

      if (!response.ok) {
        throw new Error('No se pudo limpiar el historial')
      }

      // Filtra la vista local para dejar solo los pendientes
      setErrores((prev) => prev.filter((err) => !err.resuelto))
    } catch (error) {
      console.error('Error al limpiar historial:', error)
      setErrorResolucion(
        error instanceof Error ? error.message : 'Ocurrió un error al limpiar el historial.'
      )
    }
  }

  const ahora = new Date()
  let limitePeriodo: Date | null = null
  switch (periodo) {
    case '24h':
      limitePeriodo = new Date(ahora.getTime() - 24 * 60 * 60 * 1000)
      break
    case '7dias':
      limitePeriodo = new Date(ahora)
      limitePeriodo.setDate(limitePeriodo.getDate() - 7)
      break
    case '14dias':
      limitePeriodo = new Date(ahora)
      limitePeriodo.setDate(limitePeriodo.getDate() - 14)
      break
    case '21dias':
      limitePeriodo = new Date(ahora)
      limitePeriodo.setDate(limitePeriodo.getDate() - 21)
      break
    case '1mes':
    case '2meses': {
      const meses = periodo === '1mes' ? 1 : 2
      const dia = ahora.getDate()
      limitePeriodo = new Date(ahora)
      limitePeriodo.setDate(1)
      limitePeriodo.setMonth(limitePeriodo.getMonth() - meses)
      const ultimoDiaDelMes = new Date(
        limitePeriodo.getFullYear(),
        limitePeriodo.getMonth() + 1,
        0
      ).getDate()
      limitePeriodo.setDate(Math.min(dia, ultimoDiaDelMes))
      break
    }
  }
  const erroresFiltrados = errores.filter((err) => {
    const coincideEstado = filtro === 'pendientes' ? !err.resuelto : err.resuelto
    if (!coincideEstado) return false
    if (limitePeriodo === null) return true

    const fechaError = new Date(err.fecha).getTime()
    return fechaError >= limitePeriodo.getTime() && fechaError <= ahora.getTime()
  })
  const pendientesCount = errores.filter((err) => !err.resuelto).length
  const historialCount = errores.filter((err) => err.resuelto).length

  return (
    <div className="panel-errores-container">
      <div className="panel-errores-header">
        <h1>Centro de Control - Errores de API</h1>
        <p>Monitoreo de incidencias y fallas en el Chatbot SuperAsistente</p>
      </div>

      <div className="panel-errores-card">
        {/* Filtros */}
        <div className="panel-errores-tabs">
          <div className="panel-errores-tabs-group">
            <button
              onClick={() => setFiltro('pendientes')}
              className={`panel-errores-tab ${filtro === 'pendientes' ? 'active' : ''}`}
            >
              <FiAlertCircle />
              Pendientes
              <span className="panel-errores-tab-count">{pendientesCount}</span>
            </button>
            <button
              onClick={() => setFiltro('resueltos')}
              className={`panel-errores-tab ${filtro === 'resueltos' ? 'active' : ''}`}
            >
              <FiClock />
              Historial
              <span className="panel-errores-tab-count">{historialCount}</span>
            </button>
          </div>
          <div className="panel-errores-period-group">
            <label className="panel-errores-period-label" htmlFor="panel-errores-period">
              <FiCalendar aria-hidden="true" />
              Período
            </label>
            <div className="panel-errores-period-select">
              <select
                id="panel-errores-period"
                value={periodo}
                onChange={(event) => {
                  const value = event.currentTarget.value
                  setPeriodo(
                    value === '24h' ||
                      value === '7dias' ||
                      value === '14dias' ||
                      value === '21dias' ||
                      value === '1mes' ||
                      value === '2meses'
                      ? value
                      : 'todos'
                  )
                }}
              >
                <option value="todos">Todo el historial</option>
                <option value="24h">Últimas 24 horas</option>
                <option value="7dias">Última semana</option>
                <option value="14dias">Hace 2 semanas</option>
                <option value="21dias">Hace 3 semanas</option>
                <option value="1mes">Último mes</option>
                <option value="2meses">Últimos 2 meses</option>
              </select>
              <FiChevronDown aria-hidden="true" />
            </div>
          </div>
        </div>

        {filtro === 'resueltos' && historialCount > 0 && puedeResolverErrores && (
          <div className="panel-errores-toolbar">
            <button onClick={handleLimpiarHistorial} className="btn-limpiar-historial">
              <FiTrash />
              Limpiar historial
            </button>
          </div>
        )}

        {/* Carga o Estado Vacío */}
        {errorCarga && (
          <div className="panel-errores-error" role="alert">
            {errorCarga}
          </div>
        )}
        {errorResolucion && (
          <div className="panel-errores-error" role="alert">
            {errorResolucion}
          </div>
        )}
        {cargando ? (
          <div className="panel-errores-empty">Cargando registros de errores...</div>
        ) : errorCarga ? null : erroresFiltrados.length === 0 ? (
          <div className="panel-errores-empty">
            <p>No hay elementos para mostrar</p>
          </div>
        ) : (
          /* Tabla */
          <div className="panel-errores-table-wrapper">
            <table className="panel-errores-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Mensaje de Error</th>
                  <th>Origen / Endpoint</th>
                  <th>Teléfono</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  {filtro === 'pendientes' && puedeResolverErrores && (
                    <th className="panel-errores-action-heading">Acción</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {erroresFiltrados.map((error) => (
                  <tr key={error.id}>
                    <td>#{error.id}</td>
                    <td className="panel-errores-message">{error.mensaje}</td>
                    <td className="panel-errores-origin">{error.origen}</td>
                    <td>{error.telefono || 'Sistema'}</td>
                    <td className="panel-errores-date">
                      {new Date(error.fecha).toLocaleString('es-CO')}
                    </td>
                    <td>
                      <span className={`badge-status ${error.resuelto ? 'resuelto' : 'pendiente'}`}>
                        {error.resuelto ? 'Resuelto' : 'Pendiente'}
                      </span>
                    </td>
                    {filtro === 'pendientes' && puedeResolverErrores && (
                      <td className="panel-errores-action">
                        {!error.resuelto && puedeResolverErrores && (
                          <button
                            onClick={() => handleResolverError(error.id)}
                            className="btn-resolver"
                            disabled={resolviendoId === error.id}
                          >
                            <FiCheckCircle />
                            {resolviendoId === error.id ? 'Resolviendo...' : 'Resolver'}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default PanelErrores
