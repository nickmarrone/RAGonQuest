import axios from 'axios';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: '/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for common headers
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common error cases
    if (error.response) {
      // Server responded with error status
      const errorMessage = error.response.data?.detail || `HTTP error! status: ${error.response.status}`;
      return Promise.reject(new Error(errorMessage));
    } else if (error.request) {
      // Request was made but no response received
      return Promise.reject(new Error('No response received from server'));
    } else {
      // Something else happened
      return Promise.reject(new Error('Request failed'));
    }
  }
);

export default api; 