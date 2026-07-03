import axios from 'axios';

// Get API base URL from environment variables, fallback to local development URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

/**
 * Resolves static or uploaded media URL to make sure it includes the backend host
 * if the backend returns relative paths.
 */
export const getImageUrl = (url) => {
  if (!url) return '';

  let path = url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      path = new URL(url).pathname; // e.g. "/media/mnist_uploads/xxx.png"
    } catch {
      path = url;
    }
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return normalizedPath; // relative to current origin -> nginx /media/ block handles it
};

export default api;
