import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
})

apiClient.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('accessToken')
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // TODO: RefreshToken 재발급
    }
    return Promise.reject(error)
  },
)

export default apiClient
