import React, { useState, useEffect } from 'react'
import { FaPlus, FaSearch, FaEdit, FaTrash, FaChevronLeft, FaChevronRight } from 'react-icons/fa'

interface Convenio {
  id?: number | string
  codigo_convenio?: number | string
  nombre_convenio?: string
  convenio?: string
  empresa?: string
  nit?: number | string
  nit_convenio?: number | string
  categoria?: string
  modalidad?: string
  referencia?: string
}

interface DatosBancos {
  total: number
  bbva: Convenio[]
  agrario: Convenio[]
  aval: Convenio[]
}

export const Convenios: React.FC = () => {
  const [bancoSeleccionado, setBancoSeleccionado] = useState<'bbva' | 'aval' | 'agrario'>('bbva')
  const [datosConvenios, setDatosConvenios] = useState<DatosBancos>({
    total: 0,
    bbva: [],
    agrario: [],
    aval: []
  })
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(false)
  const [modalAbierto, setModalAbierto] = useState(false)

  // Estados para la Paginación
  const [paginaActual, setPaginaActual] = useState(1)
  const elementosPorPagina = 15

  // Estados para el formulario de nuevo convenio
  const [nuevoConvenio, setNuevoConvenio] = useState({
    nombre: '',
    nit: '',
    categoria: '',
    descripcion: ''
  })

  // Cargar datos reales desde el backend en el puerto 3003
  useEffect(() => {
    const cargarDatos = async (): Promise<void> => {
      setCargando(true)
      try {
        const response = await fetch(
          `http://localhost:3003/api/convenios/buscar?q=${encodeURIComponent(busqueda)}`
        )
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          setDatosConvenios(data)
          setPaginaActual(1) // Reiniciar a la página 1 cuando cambia la búsqueda
        }
      } catch (error) {
        console.error('Error al cargar convenios:', error)
      } finally {
        setCargando(false)
      }
    }

    const timer = setTimeout(() => {
      cargarDatos()
    }, 400) // Retraso prudente (debounce) para no saturar al escribir

    return () => clearTimeout(timer)
  }, [busqueda])

  // Cambiar de banco también reinicia la paginación a la 1
  const handleCambiarBanco = (banco: 'bbva' | 'aval' | 'agrario'): void => {
    setBancoSeleccionado(banco)
    setPaginaActual(1)
  }

  // Obtener la lista completa del banco actual
  const listaCompleta = datosConvenios[bancoSeleccionado] || []

  // Calcular los elementos que se van a mostrar en la página actual (Paginación local rápida)
  const indiceUltimoElemento = paginaActual * elementosPorPagina
  const indicePrimerElemento = indiceUltimoElemento - elementosPorPagina
  const listaActual = listaCompleta.slice(indicePrimerElemento, indiceUltimoElemento)
  const totalPaginas = Math.ceil(listaCompleta.length / elementosPorPagina) || 1

  return (
    <div className="convenios-container" style={{ padding: '20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}
      >
        <h2>Gestión de Convenios Bancarios</h2>
        <button
          className="btn-nuevo"
          onClick={() => setModalAbierto(true)}
          style={{
            background: '#28a745',
            color: '#fff',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FaPlus /> Nuevo Convenio
        </button>
      </div>

      {/* Pestañas para cambiar de banco */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {(['bbva', 'aval', 'agrario'] as const).map((banco) => (
          <button
            key={banco}
            onClick={() => handleCambiarBanco(banco)}
            style={{
              padding: '8px 20px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              background: bancoSeleccionado === banco ? '#007bff' : '#e0e0e0',
              color: bancoSeleccionado === banco ? '#fff' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {banco} ({datosConvenios[banco]?.length || 0})
          </button>
        ))}
      </div>

      {/* Buscador en tiempo real */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <FaSearch style={{ position: 'absolute', left: '12px', top: '12px', color: '#888' }} />
        <input
          type="text"
          placeholder="Buscar por nombre, empresa, NIT o sigla..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 10px 10px 40px',
            borderRadius: '5px',
            border: '1px solid #ccc'
          }}
        />
      </div>

      {/* Indicador de carga */}
      {cargando && (
        <div style={{ marginBottom: '10px', color: '#007bff', fontWeight: '500' }}>
          Buscando registros... ⏳
        </div>
      )}

      {/* Tabla Interactiva */}
      <div
        style={{
          background: '#fff',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
              <th style={{ padding: '12px' }}>ID / Código / NIT</th>
              <th style={{ padding: '12px' }}>Nombre / Convenio / Empresa</th>
              <th style={{ padding: '12px' }}>NIT / Referencia</th>
              <th style={{ padding: '12px' }}>Categoría / Modalidad</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {listaActual.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                  {busqueda.trim()
                    ? 'No se encontraron convenios para esa búsqueda.'
                    : `No hay convenios registrados en ${bancoSeleccionado.toUpperCase()}.`}
                </td>
              </tr>
            ) : (
              listaActual.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>{item.codigo_convenio || item.nit || 'N/A'}</td>
                  <td style={{ padding: '12px' }}>
                    {item.nombre_convenio || item.convenio || item.empresa || 'N/A'}
                  </td>
                  <td style={{ padding: '12px' }}>{item.nit || item.referencia || 'N/A'}</td>
                  <td style={{ padding: '12px' }}>{item.categoria || item.modalidad || 'N/A'}</td>
                  <td
                    style={{
                      padding: '12px',
                      textAlign: 'center',
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '10px'
                    }}
                  >
                    <button
                      title="Editar"
                      style={{
                        background: '#ffc107',
                        border: 'none',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <FaEdit />
                    </button>
                    <button
                      title="Eliminar"
                      style={{
                        background: '#dc3545',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Controles de Paginación */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '15px',
          background: '#fff',
          padding: '10px 15px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
      >
        <span style={{ fontSize: '14px', color: '#555' }}>
          Mostrando {listaCompleta.length > 0 ? indicePrimerElemento + 1 : 0} al{' '}
          {Math.min(indiceUltimoElemento, listaCompleta.length)} de {listaCompleta.length} registros
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
            disabled={paginaActual === 1}
            style={{
              padding: '6px 12px',
              background: paginaActual === 1 ? '#e0e0e0' : '#007bff',
              color: paginaActual === 1 ? '#888' : '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: paginaActual === 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <FaChevronLeft /> Anterior
          </button>
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
            Página {paginaActual} de {totalPaginas}
          </span>
          <button
            onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
            disabled={paginaActual === totalPaginas}
            style={{
              padding: '6px 12px',
              background: paginaActual === totalPaginas ? '#e0e0e0' : '#007bff',
              color: paginaActual === totalPaginas ? '#888' : '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            Siguiente <FaChevronRight />
          </button>
        </div>
      </div>

      {/* Modal para Crear Convenio Manual */}
      {modalAbierto && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: '30px',
              borderRadius: '8px',
              width: '400px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
            }}
          >
            <h3>Registrar Nuevo Convenio ({bancoSeleccionado.toUpperCase()})</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                console.log('Guardando en tabla:', bancoSeleccionado, nuevoConvenio)
                setModalAbierto(false)
                setNuevoConvenio({ nombre: '', nit: '', categoria: '', descripcion: '' })
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}
            >
              <input
                type="text"
                placeholder="Nombre del Convenio / Empresa"
                value={nuevoConvenio.nombre}
                onChange={(e) => setNuevoConvenio({ ...nuevoConvenio, nombre: e.target.value })}
                required
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              <input
                type="text"
                placeholder="NIT"
                value={nuevoConvenio.nit}
                onChange={(e) => setNuevoConvenio({ ...nuevoConvenio, nit: e.target.value })}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              <input
                type="text"
                placeholder="Categoría"
                value={nuevoConvenio.categoria}
                onChange={(e) => setNuevoConvenio({ ...nuevoConvenio, categoria: e.target.value })}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              <textarea
                placeholder="Descripción de beneficios"
                value={nuevoConvenio.descripcion}
                onChange={(e) =>
                  setNuevoConvenio({ ...nuevoConvenio, descripcion: e.target.value })
                }
                style={{
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  resize: 'vertical'
                }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '10px'
                }}
              >
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  style={{
                    padding: '8px 12px',
                    background: '#6c757d',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 12px',
                    background: '#28a745',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
