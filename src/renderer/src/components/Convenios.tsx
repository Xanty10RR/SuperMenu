import React, { useState, useEffect, useCallback } from 'react'
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
  type FormularioConvenio = {
    codigo_convenio: string
    nombre_convenio: string
    nombre: string
    nit: string
    que_se_recauda: string
    categoria: string
    tipo_captura: string
    ubicacion: string
    descripcion: string
    referencias: string
    forma_consulta_datos: string
  }

  // Se declara el estado forzando explícitamente <FormularioConvenio>
  const [formulario, setFormulario] = useState<FormularioConvenio>({
    codigo_convenio: '',
    nombre_convenio: '',
    nombre: '',
    nit: '',
    que_se_recauda: '',
    categoria: '',
    tipo_captura: '',
    ubicacion: '',
    descripcion: '',
    referencias: '',
    forma_consulta_datos: ''
  })

  // Función para limpiar el formulario que sí vamos a usar
  const resetFormulario = (): void => {
    setFormulario({
      codigo_convenio: '',
      nombre_convenio: '',
      nombre: '',
      nit: '',
      que_se_recauda: '',
      categoria: '',
      tipo_captura: '',
      ubicacion: '',
      descripcion: '',
      referencias: '',
      forma_consulta_datos: ''
    })
  }

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1)
  const elementosPorPagina = 15

  // Cargar datos desde el backend
  const cargarDatos = useCallback(async (): Promise<void> => {
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
  }, [busqueda])

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarDatos()
      setPaginaActual(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [cargarDatos])

  const handleCambiarBanco = (banco: 'bbva' | 'aval' | 'agrario'): void => {
    setBancoSeleccionado(banco)
    setPaginaActual(1)
  }

  // Crear un nuevo convenio
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
        resetFormulario()
        cargarDatos()
      } else {
        alert('Error al guardar el convenio en el servidor.')
      }
    } catch (error) {
      console.error('Error de red al crear:', error)
    }
  }

  // Editar convenio existente
  const abrirModalEditar = (item: Convenio): void => {
    setConvenioEnEdicion(item)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itemAny = item as any

    setFormulario({
      codigo_convenio: String(itemAny.codigo_convenio || itemAny.id || ''),
      nombre_convenio: String(itemAny.nombre_convenio || itemAny.convenio || itemAny.empresa || ''),
      nombre: String(itemAny.nombre_convenio || ''),
      nit: String(itemAny.nit || itemAny.nit_convenio || ''),
      que_se_recauda: String(itemAny.que_se_recauda || ''),
      categoria: String(itemAny.categoria || itemAny.modalidad || ''),
      tipo_captura: String(itemAny.tipo_captura || ''),
      ubicacion: String(itemAny.ubicacion || ''),
      descripcion: String(itemAny.referencia || itemAny.descripcion || ''),
      referencias: String(itemAny.referencias || ''),
      forma_consulta_datos: String(itemAny.forma_consulta_datos || '')
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
        resetFormulario()
        cargarDatos()
      } else {
        alert('Error al actualizar el convenio.')
      }
    } catch (error) {
      console.error('Error de red al editar:', error)
    }
  }

  // Eliminar convenio
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
            resetFormulario()
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
                : 'Editar Convenio (BBVA)'}
            </h3>
            <form
              className="convenios-form"
              onSubmit={modalCrearAbierto ? handleGuardarCreacion : handleGuardarEdicion}
            >
              {/* Campos específicos para bbva */}
              {bancoSeleccionado.toUpperCase() === 'BBVA' && (
                <>
                  <input
                    className="convenios-form__field"
                    type="text"
                    placeholder="Código de Convenio"
                    value={formulario.codigo_convenio || ''}
                    onChange={(e) =>
                      setFormulario({ ...formulario, codigo_convenio: e.target.value })
                    }
                    required
                  />
                  <input
                    className="convenios-form__field"
                    type="text"
                    placeholder="Nombre del Convenio"
                    value={formulario.nombre_convenio || ''}
                    onChange={(e) =>
                      setFormulario({ ...formulario, nombre_convenio: e.target.value })
                    }
                    required
                  />
                  <input
                    className="convenios-form__field"
                    type="text"
                    placeholder="NIT"
                    value={formulario.nit || ''}
                    onChange={(e) => setFormulario({ ...formulario, nit: e.target.value })}
                  />
                  <input
                    className="convenios-form__field"
                    type="text"
                    placeholder="Qué se recauda"
                    value={formulario.que_se_recauda || ''}
                    onChange={(e) =>
                      setFormulario({ ...formulario, que_se_recauda: e.target.value })
                    }
                  />
                  <input
                    className="convenios-form__field"
                    type="text"
                    placeholder="Categoría"
                    value={formulario.categoria || ''}
                    onChange={(e) => setFormulario({ ...formulario, categoria: e.target.value })}
                  />
                  <input
                    className="convenios-form__field"
                    type="text"
                    placeholder="Tipo de Captura (ej. BARRAS / MANUAL)"
                    value={formulario.tipo_captura || ''}
                    onChange={(e) => setFormulario({ ...formulario, tipo_captura: e.target.value })}
                  />
                  <input
                    className="convenios-form__field"
                    type="text"
                    placeholder="Ubicación (ej. NACIONAL)"
                    value={formulario.ubicacion || ''}
                    onChange={(e) => setFormulario({ ...formulario, ubicacion: e.target.value })}
                  />
                  <textarea
                    className="convenios-form__field convenios-form__description"
                    placeholder="Referencias"
                    value={formulario.referencias || ''}
                    onChange={(e) => setFormulario({ ...formulario, referencias: e.target.value })}
                  />
                  <input
                    className="convenios-form__field"
                    type="text"
                    placeholder="Forma Consulta Datos (W, S, N)"
                    value={formulario.forma_consulta_datos || ''}
                    onChange={(e) =>
                      setFormulario({ ...formulario, forma_consulta_datos: e.target.value })
                    }
                  />
                </>
              )}

              {/* Botones de acción */}
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
