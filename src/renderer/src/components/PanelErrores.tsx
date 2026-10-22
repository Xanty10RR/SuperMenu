import React, { useState, useEffect, useCallback } from 'react'
import '../styles/PanelErrores.css'

interface ErrorApi {
  id: number
  mensaje: string
  origen: string
  resuelto: boolean
  fecha: string
  telefono: string | null
}

const esObjeto = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const esRegistroError = (value: unknown): value is ErrorApi => {
  if (!esObjeto(value)) return false

  return (
    typeof value.id === 'number' &&
    typeof value.mensaje === 'string' &&
    typeof value.origen === 'string' &&
    typeof value.resuelto === 'boolean' &&
    typeof value.fecha === 'string' &&
    (typeof value.telefono === 'string' || value.telefono === null)
  )
}

export const PanelErrores: React.FC = () => {
  const [errores, setErrores] = useState<ErrorApi[]>([])
  const [cargando, setCargando] = useState<boolean>(true)
  const [filtro, setFiltro] = useState<'todos' | 'pendientes'>('pendientes')
  const [errorCarga, setErrorCarga] = useState('')
  const [errorResolucion, setErrorResolucion] = useState('')
  const [resolviendoId, setResolviendoId] = useState<number | null>(null)

  const obtenerRolUsuario = (): string => {
    try {
      const userData: unknown = JSON.parse(localStorage.getItem('userData') || '{}')
      if (!esObjeto(userData)) return ''

      const usuario = userData
      return (
        [usuario.departamento, usuario.rol, usuario.role, usuario.cargo]
          .filter((rol): rol is string => typeof rol === 'string')
          .map((rol) =>
            rol
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '')
          )
          .find((rol) => rol === 'admin' || rol === 'jefesistemas') || ''
      )
    } catch (error) {
      console.error('No se pudo leer el rol del usuario:', error)
      return ''
    }
  }

  const rolUsuario = obtenerRolUsuario()
  const puedeResolverErrores = rolUsuario === 'admin' || rolUsuario === 'jefesistemas'

  const obtenerErrores = useCallback(async (): Promise<void> => {
    try {
      setCargando(true)
      setErrorCarga('')
      const response = await fetch('http://localhost:3003/api/errores', {
        headers: {
          rol: rolUsuario,
          'x-user-role': rolUsuario
        }
      })
      if (!response.ok) {
        throw new Error(`No se pudieron cargar los errores (HTTP ${response.status})`)
      }

      const data: unknown = await response.json()
      if (!Array.isArray(data) || !data.every(esRegistroError)) {
        throw new Error('La respuesta del servidor no tiene el formato esperado')
      }

      setErrores(data)
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
      const response = await fetch(`http://localhost:3003/api/errores/${id}/resolver`, {
        method: 'PATCH',
        headers: {
          rol: rolUsuario,
          'x-user-role': rolUsuario
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

  const erroresFiltrados = errores.filter((err) => {
    if (filtro === 'pendientes') return !err.resuelto
    return true
  })

  return (
    <div className="panel-errores-container">
      {/* Encabezado */}
      <div className="panel-errores-header">
        <h1>Centro de Control - Errores de API</h1>
        <p>Monitoreo de incidencias y fallas en el Chatbot SuperAsistente</p>
      </div>

      {/* Contenido Principal */}
      <div className="panel-errores-card">
        {/* Filtros */}
        <div className="panel-errores-tabs">
          <button
            onClick={() => setFiltro('pendientes')}
            className={`panel-errores-tab ${filtro === 'pendientes' ? 'active' : ''}`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFiltro('todos')}
            className={`panel-errores-tab ${filtro === 'todos' ? 'active' : ''}`}
          >
            Historial Completo
          </button>
        </div>

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
            <p style={{ margin: 0, fontWeight: 500 }}>No hay elementos para mostrar</p>
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
                  <th style={{ textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {erroresFiltrados.map((error) => (
                  <tr key={error.id}>
                    <td>#{error.id}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{error.mensaje}</td>
                    <td style={{ color: '#2563eb', fontFamily: 'monospace' }}>{error.origen}</td>
                    <td>{error.telefono || 'N/A'}</td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {new Date(error.fecha).toLocaleString('es-CO')}
                    </td>
                    <td>
                      <span className={`badge-status ${error.resuelto ? 'resuelto' : 'pendiente'}`}>
                        {error.resuelto ? 'Resuelto' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="panel-errores-action">
                      {!error.resuelto && puedeResolverErrores && (
                        <button
                          onClick={() => handleResolverError(error.id)}
                          className="btn-resolver"
                          disabled={resolviendoId === error.id}
                        >
                          {resolviendoId === error.id ? 'Resolviendo...' : '✔ Resolver'}
                        </button>
                      )}
                    </td>
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
