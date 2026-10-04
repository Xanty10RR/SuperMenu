import React, { useState, useEffect } from 'react'
import { FaPlus, FaSearch, FaEdit, FaTrash } from 'react-icons/fa'

interface Convenio {
  id?: number | string
  codigo_convenio?: number | string
  nombre_convenio?: string
  convenio?: string
  empresa?: string
  nit?: number | string
  nit_convenio?: number | string
  categoria?: string
}

export const Convenios: React.FC = () => {
  const [bancoSeleccionado, setBancoSeleccionado] = useState<'bbva' | 'aval' | 'agrario'>('bbva')
  const [convenios, setConvenios] = useState<Convenio[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)

  // Estados para el formulario de nuevo convenio
  const [nuevoConvenio, setNuevoConvenio] = useState({
    nombre: '',
    nit: '',
    categoria: '',
    descripcion: ''
  })

  // Simular la carga de datos según el banco seleccionado
  useEffect(() => {
    cargarConvenios()
  }, [bancoSeleccionado])

  const cargarConvenios = async (): Promise<void> => {
    try {
      // Aquí se van hacer las peticiones al backend o directo a Supabase según la tabla activa:
      // Ej: const res = await fetch(`/api/convenios/${bancoSeleccionado}`);
      // const data = await res.json();
      // setConvenios(data);
      setConvenios([]) // Temporal mientras conectas tu endpoint
    } catch (error) {
      console.error('Error al cargar convenios:', error)
    }
  }

  const handleCrearConvenio = (e: React.FormEvent): void => {
    e.preventDefault()
    // Lógica para enviar el nuevo convenio a la tabla correspondiente de Supabase
    console.log('Guardando en tabla:', bancoSeleccionado, nuevoConvenio)
    setModalAbierto(false)
    setNuevoConvenio({ nombre: '', nit: '', categoria: '', descripcion: '' })
  }

  const conveniosFiltrados = convenios.filter((item) => {
    const termino = busqueda.trim().toLocaleLowerCase()
    const nombre = item.nombre_convenio || item.convenio || item.empresa || ''
    const nit = item.nit ?? item.nit_convenio ?? ''
    const categoria = item.categoria || ''

    return [nombre, nit, categoria].some((valor) =>
      String(valor).toLocaleLowerCase().includes(termino)
    )
  })

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

      {/* Pestañas para cambiar de banco (según tus tablas en Supabase) */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {(['bbva', 'aval', 'agrario'] as const).map((banco) => (
          <button
            key={banco}
            onClick={() => setBancoSeleccionado(banco)}
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
            {banco}
          </button>
        ))}
      </div>

      {/* Buscador en tiempo real */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <FaSearch style={{ position: 'absolute', left: '12px', top: '12px', color: '#888' }} />
        <input
          type="text"
          placeholder="Buscar por nombre, empresa o categoría..."
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
              <th style={{ padding: '12px' }}>ID / Código</th>
              <th style={{ padding: '12px' }}>Nombre / Empresa</th>
              <th style={{ padding: '12px' }}>NIT</th>
              <th style={{ padding: '12px' }}>Categoría</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {conveniosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                  {busqueda.trim()
                    ? 'No se encontraron convenios para esa búsqueda'
                    : `No hay convenios registrados en ${bancoSeleccionado.toUpperCase()} o cargando datos...`}
                </td>
              </tr>
            ) : (
              conveniosFiltrados.map((item, index) => (
                <tr
                  key={item.id ?? item.codigo_convenio ?? `${bancoSeleccionado}-${index}`}
                  style={{ borderBottom: '1px solid #eee' }}
                >
                  <td style={{ padding: '12px' }}>{item.codigo_convenio || item.id}</td>
                  <td style={{ padding: '12px' }}>
                    {item.nombre_convenio || item.convenio || item.empresa}
                  </td>
                  <td style={{ padding: '12px' }}>{item.nit || item.nit_convenio}</td>
                  <td style={{ padding: '12px' }}>{item.categoria || 'N/A'}</td>
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
              onSubmit={handleCrearConvenio}
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
