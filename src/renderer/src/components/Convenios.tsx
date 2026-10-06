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
  referencias?: string
  referencia?: string
  longitud_referencia?: string
  ubicacion?: string
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
    referencia: string
    tipo_referencia: string
    longitud_referencia: string
    codigo_barras: string
    valida_fecha: string
    manual: string
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
    forma_consulta_datos: '',
    referencia: '',
    tipo_referencia: '',
    longitud_referencia: '',
    codigo_barras: '',
    valida_fecha: '',
    manual: ''
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
      forma_consulta_datos: '',
      referencia: '',
      tipo_referencia: '',
      longitud_referencia: '',
      codigo_barras: '',
      valida_fecha: '',
      manual: ''
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

  // Manejar cambios en los campos del formulario
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target
    setFormulario((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  // Editar convenio existente
  const abrirModalEditar = (item: Convenio): void => {
    setConvenioEnEdicion(item)
    //@typescript-eslint/no-explicit-any
    const itemAny = item as unknown as Record<string, any>

    setFormulario({
      codigo_convenio: String(itemAny.codigo_convenio || itemAny.id || ''),
      nombre_convenio: String(itemAny.nombre_convenio || itemAny.convenio || itemAny.empresa || ''),
      nombre: String(itemAny.nombre_convenio || ''),
      nit: String(itemAny.nit_convenio || itemAny.nit || ''),
      descripcion: String(itemAny.descripcion || ''),
      referencias: String(itemAny.referencias || itemAny.referencia || ''),

      // Campos específicos de Agrario:
      referencia: String(itemAny.referencia || itemAny.descripcion || ''),
      tipo_referencia: String(itemAny.tipo_referencia || ''),
      longitud_referencia: String(itemAny.longitud_referencia || ''),
      codigo_barras: String(itemAny.codigo_barras || 'NO'),
      valida_fecha: String(itemAny.valida_fecha || 'NO'),
      manual: String(itemAny.manual || 'SI'),

      // Campos de BBVA (por si el modal es compartido)
      que_se_recauda: String(itemAny.que_se_recauda || ''),
      categoria: String(itemAny.categoria || ''),
      tipo_captura: String(itemAny.tipo_captura || ''),
      ubicacion: String(itemAny.ubicacion || ''),
      forma_consulta_datos: String(itemAny.forma_consulta || '')
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

  // Reúne las referencias de todos los bancos y elimina duplicados y valores vacíos (BBVA)
  const referenciasUnicasBbva = Array.from(
    new Set(
      [...datosConvenios.bbva]
        .map((convenio) => convenio.referencias?.trim() || convenio.referencia?.trim())
        .filter((referencia): referencia is string => Boolean(referencia))
    )
  )

  // Reúne las ubicaciones únicas de todos los bancos y elimina duplicados (BBVA)
  const ubicacionesUnicasBbva = Array.from(
    new Set(
      [...datosConvenios.bbva, ...datosConvenios.aval, ...datosConvenios.agrario]
        .map((convenio) => convenio.ubicacion?.trim())
        .filter((ubicacion): ubicacion is string => Boolean(ubicacion))
    )
  )

  // Referencias ÚNICAS solo para el Banco Agrario
  const referenciasAgrario = Array.from(
    new Set(
      datosConvenios.agrario
        .map((convenio) => convenio.referencia?.trim() || convenio.referencias?.trim())
        .filter((ref): ref is string => Boolean(ref))
    )
  )

  // Referencias ÚNICAS solo para el Banco Agrario
  // Longitudes de referencia numéricas y ordenadas solo para el Banco Agrario
  const longitudReferenciaAgrario = Array.from(
    new Set(
      datosConvenios.agrario
        .map((convenio) => Number(convenio.longitud_referencia))
        .filter((lon) => !isNaN(lon) && lon > 0)
    )
  ).sort((a, b) => a - b) // Esto los ordena de menor a mayor solitos

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
          <div
            className="convenios-modal"
            style={{ maxHeight: '90vh', overflowY: 'auto', padding: '20px' }}
          >
            <h3>
              {modalCrearAbierto
                ? `Nuevo Convenio (${bancoSeleccionado.toUpperCase()})`
                : `Editar Convenio (${bancoSeleccionado.toUpperCase()})`}
            </h3>
            <form
              className="convenios-form"
              onSubmit={modalCrearAbierto ? handleGuardarCreacion : handleGuardarEdicion}
            >
              {/* Campos específicos para BBVA */}
              {bancoSeleccionado.toUpperCase() === 'BBVA' && (
                <>
                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Código de convenio
                    </label>
                    <input
                      className="convenios-form__field"
                      type="text"
                      name="codigo_convenio"
                      value={formulario.codigo_convenio || ''}
                      onChange={handleInputChange}
                      style={{ width: '100%' }}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Nombre del convenio
                    </label>
                    <input
                      className="convenios-form__field"
                      type="text"
                      name="nombre_convenio"
                      value={formulario.nombre_convenio || ''}
                      onChange={handleInputChange}
                      style={{ width: '100%' }}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      NIT
                    </label>
                    <input
                      className="convenios-form__field"
                      type="text"
                      name="nit"
                      value={formulario.nit || ''}
                      onChange={handleInputChange}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      ¿Qué se recauda?
                    </label>
                    <input
                      className="convenios-form__field"
                      type="text"
                      name="que_se_recauda"
                      value={formulario.que_se_recauda || ''}
                      onChange={handleInputChange}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Categoría
                    </label>
                    <select
                      className="convenios-form__field"
                      name="categoria"
                      value={formulario.categoria || ''}
                      onChange={handleInputChange}
                      style={{ width: '100%' }}
                    >
                      <option value="">Seleccione una categoría...</option>
                      <option value="Servicios públicos">Servicios públicos</option>
                      <option value="Impuestos">Impuestos</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Tipo de Captura
                    </label>
                    <select
                      className="convenios-form__field"
                      name="tipo_captura"
                      value={formulario.tipo_captura || ''}
                      onChange={handleInputChange}
                      style={{ width: '100%' }}
                    >
                      <option value="">Seleccione el tipo de captura...</option>
                      <option value="BARRAS">BARRAS</option>
                      <option value="MANUAL">MANUAL</option>
                      <option value="OTROS">OTROS</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Ubicación
                    </label>
                    <input
                      type="text"
                      name="ubicacion"
                      value={formulario.ubicacion || ''}
                      onChange={handleInputChange}
                      list="lista-ubicaciones"
                      style={{ width: '100%' }}
                    />
                    <datalist id="lista-ubicaciones">
                      {ubicacionesUnicasBbva.map((ubi, idx) => (
                        <option key={idx} value={ubi} />
                      ))}
                    </datalist>
                    <small
                      style={{
                        display: 'block',
                        marginTop: '4px',
                        color: '#666',
                        fontSize: '12px'
                      }}
                    >
                      Si su ubicación no se encuentra en la lista, escriba o seleccione en formato{' '}
                      <strong>Departamento - Ciudad</strong> para guardar.
                    </small>
                  </div>

                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Referencias
                    </label>
                    <input
                      className="convenios-form__field convenios-form__description"
                      type="text"
                      name="referencias"
                      value={formulario.referencias || ''}
                      onChange={handleInputChange}
                      placeholder="Escriba o seleccione la referencia..."
                      list="referencias-dinamicas"
                      style={{ width: '100%' }}
                    />
                    <small
                      style={{
                        display: 'block',
                        marginTop: '4px',
                        color: '#666',
                        fontSize: '12px'
                      }}
                    >
                      Puede seleccionar una existente o escribir una nueva estructura de referencia.
                    </small>

                    <datalist id="referencias-dinamicas">
                      {referenciasUnicasBbva.map((ref, index) => (
                        <option key={index} value={String(ref)} />
                      ))}
                    </datalist>
                  </div>

                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Forma consulta datos - WEB SERVICE (W), BASE DE DATOS (S), NO CONSULTA (N)
                    </label>
                    <select
                      className="convenios-form__field"
                      name="forma_consulta_datos"
                      value={formulario.forma_consulta_datos || ''}
                      onChange={handleInputChange}
                      style={{ width: '100%' }}
                    >
                      <option value="">Seleccione la forma de consulta...</option>
                      <option value="W">W</option>
                      <option value="S">S</option>
                      <option value="N">N</option>
                    </select>
                  </div>
                </>
              )}

              {/* Campos específicos para AGRARIO */}
              {bancoSeleccionado.toUpperCase() === 'AGRARIO' && (
                <>
                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Código de convenio
                    </label>
                    <input
                      className="convenios-form__field"
                      type="text"
                      name="codigo_convenio"
                      value={formulario.codigo_convenio || ''}
                      onChange={handleInputChange}
                      style={{ width: '100%' }}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Nombre del convenio
                    </label>
                    <input
                      className="convenios-form__field"
                      type="text"
                      name="nombre_convenio"
                      value={formulario.nombre_convenio || ''}
                      onChange={handleInputChange}
                      style={{ width: '100%' }}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      NIT
                    </label>
                    <input
                      className="convenios-form__field"
                      type="text"
                      name="nit"
                      value={formulario.nit || ''}
                      onChange={handleInputChange}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Referencia
                    </label>
                    <input
                      className="convenios-form__field"
                      type="text"
                      name="referencia"
                      value={formulario.referencia || ''}
                      onChange={handleInputChange}
                      placeholder="Escriba o seleccione la referencia..."
                      list="lista-referencia-agrario"
                      style={{ width: '100%' }}
                    />
                    <small
                      style={{
                        display: 'block',
                        marginTop: '4px',
                        color: '#666',
                        fontSize: '12px'
                      }}
                    >
                      Puede seleccionar una existente o escribir una nueva estructura de referencia
                    </small>
                    <datalist id="lista-referencia-agrario">
                      {referenciasAgrario.map((ref, idx) => (
                        <option key={idx} value={ref} />
                      ))}
                    </datalist>
                  </div>

                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Tipo de referencia
                    </label>
                    <select
                      className="convenios-form__field"
                      name="tipo_referencia"
                      value={formulario.tipo_referencia || ''}
                      onChange={handleInputChange}
                      style={{ width: '100%' }}
                    >
                      <option value="">Seleccione el tipo de referencia...</option>
                      <option value="109 BASE 9">109 BASE 9</option>
                      <option value="ALFANUMERICO">ALFANUMERICO</option>
                      <option value="CARACTERES SIN NUMERO">CARACTERES SIN NUMERO</option>
                      <option value="NUMERICO">NUMERICO</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Longitud de referencia
                    </label>
                    <input
                      className="convenios-form__field"
                      type="text"
                      name="longitud_referencia"
                      value={formulario.longitud_referencia || ''}
                      onChange={handleInputChange}
                      placeholder="Escriba o seleccione la longitud de referencia..."
                      list="lista-longitud-agrario"
                      style={{ width: '100%' }}
                    />
                    <datalist id="lista-longitud-agrario">
                      {longitudReferenciaAgrario.map((lon, idx) => (
                        <option key={idx} value={lon} />
                      ))}
                    </datalist>
                    <small
                      style={{
                        display: 'block',
                        marginTop: '4px',
                        color: '#666',
                        fontSize: '12px'
                      }}
                    >
                      Puede seleccionar una existente o escribir una nueva estructura de longitud de
                      referencia
                    </small>
                  </div>

                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Código de barras
                    </label>
                    <select
                      className="convenios-form__field"
                      name="codigo_barras"
                      value={formulario.codigo_barras || ''}
                      onChange={handleInputChange}
                      style={{ width: '100%' }}
                    >
                      <option value="">Seleccione si valida código de barras...</option>
                      <option value="SI">SI</option>
                      <option value="NO">NO</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Valida fecha
                    </label>
                    <select
                      className="convenios-form__field"
                      name="valida_fecha"
                      value={formulario.valida_fecha || ''}
                      onChange={handleInputChange}
                      style={{ width: '100%' }}
                    >
                      <option value="">Seleccione si valida fecha...</option>
                      <option value="SI">SI</option>
                      <option value="NO">NO</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Manual
                    </label>
                    <select
                      className="convenios-form__field"
                      name="manual"
                      value={formulario.manual || ''}
                      onChange={handleInputChange}
                      style={{ width: '100%' }}
                    >
                      <option value="">Seleccione si es manual...</option>
                      <option value="SI">SI</option>
                      <option value="NO">NO</option>
                    </select>
                  </div>
                </>
              )}

              {/* Botones de acción */}
              <div
                className="convenios-form__actions"
                style={{
                  marginTop: '20px',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px'
                }}
              >
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
