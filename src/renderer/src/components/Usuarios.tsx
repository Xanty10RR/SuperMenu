import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react'
import { FiEdit2, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi'
import '../styles/Usuarios.css'

interface User {
  id: number
  usuario: string
  departamento: string
  tabla_asignada: string
}

const Usuarios: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    usuario: '',
    clave: '',
    departamento: 'IT/Sistemas',
    tabla_asignada: 'requisiciones'
  })

  // ---- Detección de Rol Admin ----
  const usuarioRaw = localStorage.getItem('userData') || localStorage.getItem('usuario') || '{}'
  let rolUsuario = ''
  let nombreUsuario = ''

  try {
    const parsed = JSON.parse(usuarioRaw)
    if (typeof parsed === 'object' && parsed !== null) {
      rolUsuario = (parsed.departamento || parsed.rol || parsed.cargo || '').toLowerCase()
      nombreUsuario = (parsed.usuario || parsed.username || '').toLowerCase()
    } else {
      rolUsuario = String(parsed).toLowerCase()
    }
  } catch {
    rolUsuario = usuarioRaw.toLowerCase()
  }

  // Es admin si el usuario se llama "admin" o si su departamento/rol incluye "admin"
  const esAdmin = nombreUsuario === 'admin' || rolUsuario.includes('admin')
  const normalizedSearchTerm = searchTerm
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  const filteredUsers = users.filter((user) => {
    const searchableText = `${user.usuario} ${user.departamento}`
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()

    return searchableText.includes(normalizedSearchTerm)
  })

  useEffect((): void => {
    fetchUsuarios()
  }, [])

  const fetchUsuarios = async (): Promise<void> => {
    try {
      const response = await fetch('http://localhost:3003/api/usuarios')
      if (response.ok) {
        const data: User[] = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error)
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    if (!esAdmin) {
      alert('Solo el administrador puede realizar esta acción.')
      return
    }

    if (!formData.usuario) {
      alert('El nombre de usuario es requerido.')
      return
    }

    try {
      if (editingUser) {
        const response = await fetch(`http://localhost:3003/api/usuarios/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        if (response.ok) {
          setEditingUser(null)
          await fetchUsuarios()
        }
      } else {
        const response = await fetch('http://localhost:3003/api/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        if (response.ok) {
          await fetchUsuarios()
        }
      }

      setFormData({
        usuario: '',
        clave: '',
        departamento: 'IT/Sistemas',
        tabla_asignada: 'requisiciones'
      })
    } catch (error) {
      console.error('Error al guardar el usuario:', error)
    }
  }

  const handleEdit = (user: User): void => {
    setEditingUser(user)
    setFormData({
      usuario: user.usuario,
      clave: '',
      departamento: user.departamento,
      tabla_asignada: user.tabla_asignada
    })
  }

  const handleDelete = async (id: number): Promise<void> => {
    if (!esAdmin) return
    if (window.confirm('¿Estás seguro de que quieres eliminar a este usuario?')) {
      try {
        const response = await fetch(`http://localhost:3003/api/usuarios/${id}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          await fetchUsuarios()
        }
      } catch (error) {
        console.error('Error al eliminar usuario:', error)
      }
    }
  }

  const cancelEdit = (): void => {
    setEditingUser(null)
    setFormData({
      usuario: '',
      clave: '',
      departamento: 'IT/Sistemas',
      tabla_asignada: 'requisiciones'
    })
  }

  return (
    <div className="usuarios-container">
      <h1 className="usuarios-header">Gestión de Jefes y Usuarios</h1>

      {/* Solo el admin puede ver el formulario de crear / editar */}
      {esAdmin && (
        <div className="usuarios-card usuarios-form-card">
          <h2>{editingUser ? 'Editar usuario' : 'Añadir usuario'}</h2>
          <form onSubmit={handleFormSubmit} className="usuarios-form">
            <input
              type="text"
              name="usuario"
              placeholder="Nombre de usuario (ej: jefelogistica)"
              value={formData.usuario}
              onChange={handleInputChange}
              className="usuarios-input"
              required
            />
            <input
              type="password"
              name="clave"
              placeholder={editingUser ? 'Nueva contraseña (opcional)' : 'Contraseña'}
              value={formData.clave}
              onChange={handleInputChange}
              className="usuarios-input"
              {...(!editingUser ? { required: true } : {})}
            />
            <select
              name="departamento"
              value={formData.departamento}
              onChange={handleInputChange}
              className="usuarios-input"
            >
              <option value="IT/Sistemas">IT/Sistemas</option>
              <option value="Logística">Logística</option>
              <option value="RRHH">RRHH</option>
              <option value="Comercial">Comercial</option>
              <option value="Otros">Otros</option>
            </select>

            <div className="usuarios-button-group">
              <button type="submit" className="usuarios-button usuarios-button-primary">
                {editingUser ? <FiEdit2 aria-hidden="true" /> : <FiPlus aria-hidden="true" />}
                {editingUser ? 'Actualizar' : 'Añadir'}
              </button>
              {editingUser && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="usuarios-button usuarios-button-secondary"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Lista de usuarios registrados */}
      <div className="usuarios-card usuarios-list-card">
        <h2>Lista de usuarios registrados ({users.length})</h2>
        <div className="usuarios-searchContainer">
          <FiSearch className="usuarios-searchIcon" aria-hidden="true" />
          <input
            type="search"
            className="usuarios-searchInput"
            placeholder="Buscar por nombre o departamento"
            aria-label="Buscar usuarios por nombre o departamento"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <ul className="usuarios-list">
          {filteredUsers.map((user) => (
            <li key={user.id} className="usuarios-item">
              <div className="usuarios-info">
                <strong>{user.usuario}</strong>
                <span>Departamento: {user.departamento}</span>
              </div>

              {/* Solo mostrar botones de editar y eliminar si es admin */}
              {esAdmin && (
                <div className="usuarios-button-group">
                  <button
                    onClick={() => handleEdit(user)}
                    className="usuarios-button usuarios-button-edit"
                    aria-label={`Editar usuario ${user.usuario}`}
                  >
                    <FiEdit2 aria-hidden="true" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="usuarios-button usuarios-button-delete"
                    aria-label={`Eliminar usuario ${user.usuario}`}
                  >
                    <FiTrash2 aria-hidden="true" />
                    Eliminar
                  </button>
                </div>
              )}
            </li>
          ))}
          {filteredUsers.length === 0 && (
            <li className="usuarios-empty">No se encontraron usuarios.</li>
          )}
        </ul>
      </div>
    </div>
  )
}

export default Usuarios
