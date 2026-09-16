import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react'

interface User {
  id: number
  usuario: string
  departamento: string
  tabla_asignada: string
}

const Usuarios: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    usuario: '',
    clave: '',
    departamento: 'IT/Sistemas',
    tabla_asignada: 'requisiciones'
  })

  useEffect((): void => {
    fetchUsuarios()
  }, [])

  const fetchUsuarios = async (): Promise<void> => {
    try {
      const response = await fetch('/api/usuarios')
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
    if (!formData.usuario) {
      alert('El nombre de usuario es requerido.')
      return
    }

    try {
      if (editingUser) {
        const response = await fetch(`/api/usuarios/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        if (response.ok) {
          setEditingUser(null)
          await fetchUsuarios()
        }
      } else {
        const response = await fetch('/api/usuarios', {
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
    if (window.confirm('¿Estás seguro de que quieres eliminar este jefe de área?')) {
      try {
        const response = await fetch(`/api/usuarios/${id}`, { method: 'DELETE' })
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
    <div style={styles.container}>
      <h1 style={styles.header}>Gestión de Jefes y Usuarios Aprobadores</h1>

      <div style={styles.formCard}>
        <h2>{editingUser ? 'Editar Jefe de Área' : 'Añadir Nuevo Jefe de Área'}</h2>
        <form onSubmit={handleFormSubmit} style={styles.form}>
          <input
            type="text"
            name="usuario"
            placeholder="Usuario (ej. jefelogistica)"
            value={formData.usuario}
            onChange={handleInputChange}
            style={styles.input}
            required
          />
          <input
            type="password"
            name="clave"
            placeholder={editingUser ? 'Nueva contraseña (opcional)' : 'Contraseña'}
            value={formData.clave}
            onChange={handleInputChange}
            style={styles.input}
            {...(!editingUser ? { required: true } : {})}
          />
          <select
            name="departamento"
            value={formData.departamento}
            onChange={handleInputChange}
            style={styles.input}
          >
            <option value="IT/Sistemas">IT/Sistemas</option>
            <option value="Logística">Logística</option>
            <option value="RRHH">RRHH</option>
            <option value="Comercial">Comercial</option>
            <option value="Otros">Otros</option>
          </select>

          <div style={styles.buttonGroup}>
            <button type="submit" style={styles.buttonPrimary}>
              {editingUser ? 'Actualizar' : 'Añadir'}
            </button>
            {editingUser && (
              <button type="button" onClick={cancelEdit} style={styles.buttonSecondary}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div style={styles.listCard}>
        <h2>Lista de Jefes Registrados</h2>
        <ul style={styles.userList}>
          {users.map((user) => (
            <li key={user.id} style={styles.userItem}>
              <div style={styles.userInfo}>
                <strong>{user.usuario}</strong>
                <span>Departamento: {user.departamento}</span>
              </div>
              <div style={styles.buttonGroup}>
                <button onClick={() => handleEdit(user)} style={styles.buttonEdit}>
                  Editar
                </button>
                <button onClick={() => handleDelete(user.id)} style={styles.buttonDelete}>
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: 'Arial, sans-serif',
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px'
  },
  header: { textAlign: 'center', color: '#23395d' },
  formCard: {
    background: '#f9f9f9',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '30px'
  },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px' },
  buttonGroup: { display: 'flex', gap: '10px' },
  buttonPrimary: {
    padding: '10px 15px',
    border: 'none',
    borderRadius: '4px',
    background: '#23395d',
    color: 'white',
    fontSize: '16px',
    cursor: 'pointer'
  },
  buttonSecondary: {
    padding: '10px 15px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    background: '#fff',
    color: '#333',
    fontSize: '16px',
    cursor: 'pointer'
  },
  listCard: {
    background: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  userList: { listStyle: 'none', padding: 0 },
  userItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    borderBottom: '1px solid #eee'
  },
  userInfo: { display: 'flex', flexDirection: 'column' },
  buttonEdit: {
    background: '#2f6db2',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  buttonDelete: {
    background: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '4px',
    cursor: 'pointer'
  }
}

export default Usuarios
