import React, { useState, useEffect, useCallback } from 'react'
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

  const erroresFiltrados = errores.filter((err) => {
    if (filtro === 'pendientes') return !err.resuelto // Muestra solo los errores no resueltos
    if (filtro === 'resueltos') return err.resuelto // Muestra solo los errores resueltos
    return true
  })

  return (
    <div className="panel-errores-container">
      <div className="panel-errores-header">
        <h1>Centro de Control - Errores de API</h1>
        <p>Monitoreo de incidencias y fallas en el Chatbot SuperAsistente</p>
      </div>

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
            onClick={() => setFiltro('resueltos')}
            className={`panel-errores-tab ${filtro === 'resueltos' ? 'active' : ''}`}
          >
            Historial
          </button>
        </div>

        {filtro === 'resueltos' && erroresFiltrados.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button
              onClick={handleLimpiarHistorial}
              className="btn-limpiar-historial"
              style={{
                backgroundColor: '#ef4444',
                color: '#fff',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              🗑️ Limpiar historial
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
