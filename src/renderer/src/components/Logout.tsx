import { api } from '../services/api'

export const AuthService = {
  login: async (username: string, password: string) => {
    const response = await api.post('/api/login', {
      username,
      password
    })
    return response.data
  },

  logout: async () => {
    // Si tienes un endpoint para logout en el backend
    try {
      await api.post('/api/logout')
    } catch (error) {
      console.error('Logout error:', error)
    }
    // Limpiar datos de sesión del frontend
    localStorage.removeItem('userData')
    sessionStorage.removeItem('sessionToken')
  }
}
