import axios, { type AxiosRequestConfig } from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // ejemplo: https://mi-backend.azurewebsites.net
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// 👇 interceptor global
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper para requests tipados
export async function apiRequest<T>(
  path: string,
  options: AxiosRequestConfig = {}
): Promise<T> {
  try {
    const res = await api({ url: path, ...options });
    return res.data as T;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data?.message || `Error ${error.response.status}`);
    } else if (error.request) {
      throw new Error('No se recibió respuesta del servidor');
    } else {
      throw new Error(error.message || 'Error desconocido');
    }
  }
}