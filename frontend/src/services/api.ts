// ARCHIVO: frontend/src/services/api.ts
/// <reference types="vite/client" />
import axios from 'axios';

// Crear instancia de Axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 15000,
});

// Interceptor para inyectar el token JWT en las peticiones salientes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('utcv_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y controlar errores globales (como 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si la API responde 401 (No Autorizado / Token Vencido), deslogueamos al usuario
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('utcv_token');
      localStorage.removeItem('utcv_rol');
      localStorage.removeItem('utcv_nombre');
      
      // Evitar bucles infinitos si ya estamos en login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?mensaje=sesion_expirada';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
