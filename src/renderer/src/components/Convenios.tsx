import React, { useState, useEffect } from 'react'
import { FaPlus, FaSearch, FaEdit, FaTrash, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import '../styles/Convenios.css'

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

  // Estados para Modales (Crear y Editar)
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false)
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false)
  const [convenioEnEdicion, setConvenioEnEdicion] = useState<Convenio | null>(null)

  // Estados del formulario
  const [formulario, setFormulario] = useState({
    nombre: '',
    nit: '',
    categoria: '',
    descripcion: ''
  })

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1)
  const elementosPorPagina = 15

  // Cargar datos desde el backend
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
      }
    } catch (error) {
      console.error('Error al cargar convenios:', error)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarDatos()
      setPaginaActual(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [busqueda])

  const handleCambiarBanco = (banco: 'bbva' | 'aval' | 'agrario'): void => {
    setBancoSeleccionado(banco)
    setPaginaActual(1)
  }

  // --- 1. CREAR CONVENIO ---
  const handleGuardarCreacion = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    try {
      const response = await fetch(`http://localhost:3003/api/convenios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formulario, banco: bancoSeleccionado })
      })
      if (response.ok) {
        setModalCrearAbierto(false)
        setFormulario({ nombre: '', nit: '', categoria: '', descripcion: '' })
        cargarDatos() // Recargar la tabla
      } else {
        alert('Error al guardar el convenio en el servidor.')
      }
    } catch (error) {
      console.error('Error de red al crear:', error)
    }
  }

  // --- 2. EDITAR CONVENIO ---
  const abrirModalEditar = (item: Convenio): void => {
    setConvenioEnEdicion(item)
    setFormulario({
      nombre: item.nombre_convenio || item.convenio || item.empresa || '',
      nit: String(item.nit || item.nit_convenio || ''),
      categoria: item.categoria || item.modalidad || '',
      descripcion: item.referencia || ''
    })
    setModalEditarAbierto(true)
  }

  const handleGuardarEdicion = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!convenioEnEdicion) return
    const idConvenio = convenioEnEdicion.id || convenioEnEdicion.codigo_convenio

    try {
      const response = await fetch(`http://localhost:3003/api/convenios/${idConvenio}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formulario, banco: bancoSeleccionado })
      })
      if (response.ok) {
        setModalEditarAbierto(false)
        setConvenioEnEdicion(null)
        setFormulario({ nombre: '', nit: '', categoria: '', descripcion: '' })
        cargarDatos()
      } else {
        alert('Error al actualizar el convenio.')
      }
    } catch (error) {
      console.error('Error de red al editar:', error)
    }
  }

  // --- 3. ELIMINAR CONVENIO ---
  const handleEliminar = async (item: Convenio): Promise<void> => {
    const idConvenio = item.id || item.codigo_convenio
    if (
      !confirm(
        `¿Estás segura de eliminar el convenio ${item.nombre_convenio || item.convenio || ''}?`
      )
    )
      return

    try {
      const response = await fetch(
        `http://localhost:3003/api/convenios/${idConvenio}?banco=${bancoSeleccionado}`,
        {
          method: 'DELETE'
        }
      )
      if (response.ok) {
        cargarDatos()
      } else {
        alert('Error al eliminar el registro.')
      }
    } catch (error) {
      console.error('Error de red al eliminar:', error)
    }
  }

  // Elementos de la tabla actual con paginación
  const listaCompleta = datosConvenios[bancoSeleccionado] || []
  const indiceUltimoElemento = paginaActual * elementosPorPagina
  const indicePrimerElemento = indiceUltimoElemento - elementosPorPagina
  const listaActual = listaCompleta.slice(indicePrimerElemento, indiceUltimoElemento)
  const totalPaginas = Math.ceil(listaCompleta.length / elementosPorPagina) || 1

  return (
    <div className="convenios-container">
      <div className="convenios-header">
        <h2>Gestión de Convenios Bancarios</h2>
        <button
          className="convenios-button convenios-button--new"
          onClick={() => {
            setFormulario({ nombre: '', nit: '', categoria: '', descripcion: '' })
            setModalCrearAbierto(true)
          }}
        >
          <FaPlus /> Nuevo Convenio
        </button>
      </div>

      {/* Pestañas de Bancos */}
      <div className="convenios-tabs">
        {(['bbva', 'aval', 'agrario'] as const).map((banco) => (
          <button
            key={banco}
            className={`convenios-button convenios-tab${bancoSeleccionado === banco ? ' convenios-tab--active' : ''}`}
            onClick={() => handleCambiarBanco(banco)}
          >
            {banco} ({datosConvenios[banco]?.length || 0})
          </button>
        ))}
      </div>

      {/* Buscador */}
      <div className="convenios-search">
        <FaSearch className="convenios-search__icon" />
        <input
          className="convenios-search__input"
          type="text"
          placeholder="Buscar por nombre, empresa, NIT o sigla..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {cargando && <div className="convenios-loading">Cargando registros... ⏳</div>}

      {/* Tabla */}
      <div className="convenios-table-container">
        <table className="convenios-table">
          <thead>
            <tr className="convenios-table__header">
              <th>ID / Código / NIT</th>
              <th>Nombre / Convenio / Empresa</th>
              <th>NIT / Referencia</th>
              <th>Categoría / Modalidad</th>
              <th className="convenios-table__actions-heading">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {listaActual.length === 0 ? (
              <tr>
                <td colSpan={5} className="convenios-table__empty">
                  No hay convenios registrados.
                </td>
              </tr>
            ) : (
              listaActual.map((item, index) => (
                <tr key={index} className="convenios-table__row">
                  <td>{item.codigo_convenio || item.nit || 'N/A'}</td>
                  <td>{item.nombre_convenio || item.convenio || item.empresa || 'N/A'}</td>
                  <td>{item.nit || item.referencia || 'N/A'}</td>
                  <td>{item.categoria || item.modalidad || 'N/A'}</td>
                  <td className="convenios-table__actions">
                    <button
                      className="convenios-button convenios-button--edit"
                      onClick={() => abrirModalEditar(item)}
                      title="Editar"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="convenios-button convenios-button--delete"
                      onClick={() => handleEliminar(item)}
                      title="Eliminar"
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

      {/* Paginación */}
      <div className="convenios-pagination">
        <span>
          Mostrando {listaCompleta.length > 0 ? indicePrimerElemento + 1 : 0} al{' '}
          {Math.min(indiceUltimoElemento, listaCompleta.length)} de {listaCompleta.length}
        </span>
        <div className="convenios-pagination__controls">
          <button
            className={`convenios-button convenios-pagination__button${paginaActual === 1 ? ' convenios-pagination__button--disabled' : ''}`}
            onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
            disabled={paginaActual === 1}
          >
            <FaChevronLeft /> Anterior
          </button>
          <span>
            Página {paginaActual} de {totalPaginas}
          </span>
          <button
            className={`convenios-button convenios-pagination__button${paginaActual === totalPaginas ? ' convenios-pagination__button--disabled' : ''}`}
            onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
            disabled={paginaActual === totalPaginas}
          >
            Siguiente <FaChevronRight />
          </button>
        </div>
      </div>

      {/* Modal Crear / Editar */}
      {(modalCrearAbierto || modalEditarAbierto) && (
        <div className="convenios-modal-overlay">
          <div className="convenios-modal">
            <h3>
              {modalCrearAbierto
                ? `Nuevo Convenio (${bancoSeleccionado.toUpperCase()})`
                : 'Editar Convenio'}
            </h3>
            <form
              className="convenios-form"
              onSubmit={modalCrearAbierto ? handleGuardarCreacion : handleGuardarEdicion}
            >
              <input
                className="convenios-form__field"
                type="text"
                placeholder="Nombre del Convenio / Empresa"
                value={formulario.nombre}
                onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                required
              />
              <input
                className="convenios-form__field"
                type="text"
                placeholder="NIT"
                value={formulario.nit}
                onChange={(e) => setFormulario({ ...formulario, nit: e.target.value })}
              />
              <input
                className="convenios-form__field"
                type="text"
                placeholder="Categoría"
                value={formulario.categoria}
                onChange={(e) => setFormulario({ ...formulario, categoria: e.target.value })}
              />
              <textarea
                className="convenios-form__field convenios-form__description"
                placeholder="Descripción / Referencia"
                value={formulario.descripcion}
                onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })}
              />
              <div className="convenios-form__actions">
                <button
                  className="convenios-button convenios-button--cancel"
                  type="button"
                  onClick={() => {
                    setModalCrearAbierto(false)
                    setModalEditarAbierto(false)
                  }}
                >
                  Cancelar
                </button>
                <button className="convenios-button convenios-button--save" type="submit">
                  {modalCrearAbierto ? 'Guardar' : 'Actualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
