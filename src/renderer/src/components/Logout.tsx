import axios from 'axios';

export const AuthService = {
  login: async (username: string, password: string) => {
    const response = await axios.post('http://localhost:3003/api/login', {
      username,
      password
    });
    return response.data;
  },

  logout: async () => {
    // Si tienes un endpoint para logout en el backend
    try {
      await axios.post('http://localhost:3003/api/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    // Limpiar datos de sesión del frontend
    localStorage.removeItem('userData');
    sessionStorage.removeItem('sessionToken');
  }
};