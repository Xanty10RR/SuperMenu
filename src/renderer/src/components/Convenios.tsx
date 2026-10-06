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
  descripcion?: string
  que_se_recauda?: string
  categoria?: string
  modalidad?: string
  tipo_captura?: string
  referencias?: string
  referencia?: string
  tipo_referencia?: string
  longitud_referencia?: string
  ubicacion?: string
  codigo_barras?: string
  valida_fecha?: string
  manual?: string
  forma_consulta?: string
  estado?: string
  nura?: number | string
  sigla?: string
  descripcion_recaudo?: string
  dato_captura?: string
  departamento?: string
  ciudad?: string
  modalidad_captura?: string
  valida_fecha_vencimiento?: string
  recibe_pagos_parciales?: string
  monto?: string
  banco_dueno?: string
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
    estado: string
    nura: string
    empresa: string
    convenio: string
    sigla: string
    descripcion_recaudo: string
    dato_captura: string
    modalidad: string
    departamento: string
    ciudad: string
    modalidad_captura: string
    valida_fecha_vencimiento: string
    recibe_pagos_parciales: string
    monto: string
    banco_dueno: string
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
    manual: '',
    estado: 'ACTIVO',
    nura: '',
    empresa: '',
    convenio: '',
    sigla: '',
    descripcion_recaudo: '',
    dato_captura: '',
    modalidad: '',
    departamento: '',
    ciudad: '',
    modalidad_captura: '',
    valida_fecha_vencimiento: 'NO',
    recibe_pagos_parciales: 'NO',
    monto: '',
    banco_dueno: ''
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
      manual: '',
      estado: 'ACTIVO',
      nura: '',
      empresa: '',
      convenio: '',
      sigla: '',
      descripcion_recaudo: '',
      dato_captura: '',
      modalidad: '',
      departamento: '',
      ciudad: '',
      modalidad_captura: '',
      valida_fecha_vencimiento: 'NO',
      recibe_pagos_parciales: 'NO',
      monto: '',
      banco_dueno: ''
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
    setFormulario({
      // Campos comunes
      codigo_convenio: String(item.codigo_convenio || item.id || ''),
      nombre_convenio: String(item.nombre_convenio || item.convenio || item.empresa || ''),
      nombre: String(item.nombre_convenio || ''),
      nit: String(item.nit_convenio || item.nit || ''),
      descripcion: String(item.descripcion || ''),
      referencias: String(item.referencias || item.referencia || ''),

      // Campos específicos de Agrario
      referencia: String(item.referencia || item.descripcion || ''),
      tipo_referencia: String(item.tipo_referencia || ''),
      longitud_referencia: String(item.longitud_referencia || ''),
      codigo_barras: String(item.codigo_barras || 'NO'),
      valida_fecha: String(item.valida_fecha || 'NO'),
      manual: String(item.manual || 'SI'),

      // Campos de BBVA (por si el modal es compartido)
      que_se_recauda: String(item.que_se_recauda || ''),
      categoria: String(item.categoria || ''),
      tipo_captura: String(item.tipo_captura || ''),
      ubicacion: String(item.ubicacion || ''),
      forma_consulta_datos: String(item.forma_consulta || ''),

      // Campos específicos para AVAL
      estado: String(item.estado || 'ACTIVO'),
      nura: String(item.nura || ''),
      empresa: String(item.empresa || ''),
      convenio: String(item.convenio || ''),
      sigla: String(item.sigla || ''),
      descripcion_recaudo: String(item.descripcion_recaudo || ''),
      dato_captura: String(item.dato_captura || ''),
      modalidad: String(item.modalidad || ''),
      departamento: String(item.departamento || ''),
      ciudad: String(item.ciudad || ''),
      modalidad_captura: String(item.modalidad_captura || ''),
      valida_fecha_vencimiento: String(item.valida_fecha_vencimiento || 'NO'),
      recibe_pagos_parciales: String(item.recibe_pagos_parciales || 'NO'),
      monto: String(item.monto || ''),
      banco_dueno: String(item.banco_dueno || '')
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

  // Reúne las referencias del banco (BBVA) y elimina duplicados y valores vacíos
  const referenciasUnicasBbva = Array.from(
    new Set(
      [...datosConvenios.bbva]
        .map((convenio) => convenio.referencias?.trim() || convenio.referencia?.trim())
        .filter((referencia): referencia is string => Boolean(referencia))
    )
  )

  // Reúne las ubicaciones del banco (BBVA)
  const ubicacionesUnicasBbva = Array.from(
    new Set(
      [...datosConvenios.bbva]
        .map((convenio) => convenio.ubicacion?.trim())
        .filter((ubicacion): ubicacion is string => Boolean(ubicacion))
    )
  )

  // Referencias únicas solo para el Banco Agrario
  const referenciasAgrario = Array.from(
    new Set(
      datosConvenios.agrario
        .map((convenio) => convenio.referencia?.trim() || convenio.referencias?.trim())
        .filter((ref): ref is string => Boolean(ref))
    )
  )

  // Referencias únicas solo para el Banco Agrario
  const longitudReferenciaAgrario = Array.from(
    new Set(
      datosConvenios.agrario
        .map((convenio) => Number(convenio.longitud_referencia))
        .filter((lon) => !isNaN(lon) && lon > 0)
    )
  ).sort((a, b) => a - b) // Esto los ordena de menor a mayor

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

              {/* Campos específicos para AVAL */}
              {bancoSeleccionado.toUpperCase() === 'AVAL' && (
                <>
                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Estado
                    </label>
                    <select
                      className="convenios-form__field"
                      name="estado"
                      value={formulario.estado || 'ACTIVO'}
                      onChange={handleInputChange}
                      style={{ width: '100%' }}
                    >
                      <option value="ACTIVO">ACTIVO</option>
                      <option value="INACTIVO">INACTIVO</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      NURA
                    </label>
                    <input
                      className="convenios-form__field"
                      type="text"
                      name="nura"
                      value={formulario.nura || ''}
                      onChange={handleInputChange}
                      placeholder="Ej: 2, 5, 6"
                      style={{ width: '100%' }}
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
                      placeholder="NIT de la empresa"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Empresa
                    </label>
                    <input
                      className="convenios-form__field"
                      type="text"
                      name="empresa"
                      value={formulario.empresa || ''}
                      onChange={handleInputChange}
                      placeholder="Nombre de la empresa"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Convenio
                    </label>
                    <input
                      className="convenios-form__field"
                      type="text"
                      name="convenio"
                      value={formulario.convenio || ''}
                      onChange={handleInputChange}
                      placeholder="Nombre del convenio"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Sigla
                    </label>
                    <input
                      className="convenios-form__field"
                      type="text"
                      name="sigla"
                      value={formulario.sigla || ''}
                      onChange={handleInputChange}
                      placeholder="Ej: KIMELCOLSA"
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
                      <option value="">Seleccione categoría...</option>
                      <option value="Servicios publicos">Servicios publicos</option>
                      <option value="Otros servicios">Otros servicios</option>
                      <option value="Instituciones educativas">Instituciones educativas</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Descripción Recaudo
                    </label>
                    <input
                      className="convenios-form__field"
                      type="text"
                      name="descripcion_recaudo"
                      value={formulario.descripcion_recaudo || ''}
                      onChange={handleInputChange}
                      placeholder="Ej: SIN DESCRIPCION"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Dato Captura
                    </label>
                    <input
                      className="convenios-form__field"
                      type="text"
                      name="dato_captura"
                      value={formulario.dato_captura || ''}
                      onChange={handleInputChange}
                      placeholder="Ej: CEDULA, Referencia De Pago, NRO DOCUMENTO"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Modalidad
                    </label>
                    <select
                      className="convenios-form__field"
                      name="modalidad"
                      value={formulario.modalidad || ''}
                      onChange={handleInputChange}
                      style={{ width: '100%' }}
                    >
                      <option value="">Seleccione modalidad...</option>
                      <option value="Facturador">Facturador</option>
                      <option value="No Facturador">No Facturador</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Longitud Referencia
                    </label>
                    <input
                      className="convenios-form__field"
                      type="text"
                      name="longitud_referencia"
                      value={formulario.longitud_referencia || ''}
                      onChange={handleInputChange}
                      placeholder="Ej: 0, 12"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Departamento
                    </label>
                    <input
                      className="convenios-form__field"
                      type="text"
                      name="departamento"
                      value={formulario.departamento || ''}
                      onChange={handleInputChange}
                      placeholder="Ej: Valle del Cauca, Antioquia"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Ciudad
                    </label>
                    <input
                      className="convenios-form__field"
                      type="text"
                      name="ciudad"
                      value={formulario.ciudad || ''}
                      onChange={handleInputChange}
                      placeholder="Ej: Cali, Medellin"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Modalidad Captura
                    </label>
                    <select
                      className="convenios-form__field"
                      name="modalidad_captura"
                      value={formulario.modalidad_captura || ''}
                      onChange={handleInputChange}
                      style={{ width: '100%' }}
                    >
                      <option value="">Seleccione modalidad captura...</option>
                      <option value="Manual">Manual</option>
                      <option value="Codigo de barras">Codigo de barras</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Valida Fecha Vencimiento
                    </label>
                    <select
                      className="convenios-form__field"
                      name="valida_fecha_vencimiento"
                      value={formulario.valida_fecha_vencimiento || 'NO'}
                      onChange={handleInputChange}
                      style={{ width: '100%' }}
                    >
                      <option value="SI">SI</option>
                      <option value="NO">NO</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Recibe Pagos Parciales
                    </label>
                    <select
                      className="convenios-form__field"
                      name="recibe_pagos_parciales"
                      value={formulario.recibe_pagos_parciales || 'NO'}
                      onChange={handleInputChange}
                      style={{ width: '100%' }}
                    >
                      <option value="SI">SI</option>
                      <option value="NO">NO</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Monto
                    </label>
                    <input
                      className="convenios-form__field"
                      type="text"
                      name="monto"
                      value={formulario.monto || ''}
                      onChange={handleInputChange}
                      placeholder="Ej: No Valida, Exactamente Igual"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Banco Dueño
                    </label>
                    <select
                      className="convenios-form__field"
                      name="banco_dueno"
                      value={formulario.banco_dueno || ''}
                      onChange={handleInputChange}
                      style={{ width: '100%' }}
                    >
                      <option value="">Seleccione banco dueño...</option>
                      <option value="Banco AV Villas">Banco AV Villas</option>
                      <option value="Banco de Bogotá">Banco de Bogotá</option>
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
