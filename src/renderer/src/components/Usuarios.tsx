import React, { useState, ChangeEvent, FormEvent } from 'react';

// 1. Definimos la interfaz para un objeto Usuario
interface User {
  id: number;
  name: string;
  email: string;
}

// Datos iniciales de ejemplo
const initialUsers: User[] = [
  { id: 1, name: 'Santiago', email: 'santiago@gmail.com' },
];

const Usuarios: React.FC = () => {
  // 2. Estados del componente
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '' });

  // 3. Manejadores de eventos
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      alert('Nombre y Email son requeridos.');
      return;
    }

    if (editingUser) {
      // Actualizar usuario existente
      setUsers(
        users.map((user) =>
          user.id === editingUser.id ? { ...user, ...formData } : user
        )
      );
      setEditingUser(null);
    } else {
      // Crear nuevo usuario
      const newUser: User = {
        id: Date.now(), // ID simple basado en el timestamp
        ...formData,
      };
      setUsers([...users, newUser]);
    }

    setFormData({ name: '', email: '' }); // Limpiar formulario
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      setUsers(users.filter((user) => user.id !== id));
    }
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '' });
  };

  // 4. Renderizado del componente
  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Gestión de Usuarios</h1>

      <div style={styles.formCard}>
        <h2>{editingUser ? 'Editar Usuario' : 'Añadir Nuevo Usuario'}</h2>
        <form onSubmit={handleFormSubmit} style={styles.form}>
          <input
            type="text"
            name="name"
            placeholder="Nombre"
            value={formData.name}
            onChange={handleInputChange}
            style={styles.input}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            style={styles.input}
            required
          />
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
        <h2>Lista de Usuarios</h2>
        <ul style={styles.userList}>
          {users.map((user) => (
            <li key={user.id} style={styles.userItem}>
              <div style={styles.userInfo}>
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </div>
              <div style={styles.buttonGroup}>
                <button onClick={() => handleEdit(user)} style={styles.buttonEdit}>Editar</button>
                <button onClick={() => handleDelete(user.id)} style={styles.buttonDelete}>Eliminar</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// 5. Estilos para el componente (CSS-in-JS)
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: 'Arial, sans-serif',
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
  },
  header: {
    textAlign: 'center',
    color: '#333',
  },
  formCard: {
    background: '#f9f9f9',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '30px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  input: {
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '16px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
  },
  buttonPrimary: {
    padding: '10px 15px',
    border: 'none',
    borderRadius: '4px',
    background: '#007bff',
    color: 'white',
    fontSize: '16px',
    cursor: 'pointer',
  },
  buttonSecondary: {
    padding: '10px 15px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    background: '#fff',
    color: '#333',
    fontSize: '16px',
    cursor: 'pointer',
  },
  listCard: {
    background: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  userList: {
    listStyle: 'none',
    padding: 0,
  },
  userItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    borderBottom: '1px solid #eee',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  buttonEdit: {
    background: '#ffc107',
    color: 'black',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  buttonDelete: {
    background: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
  }
};

export default Usuarios;