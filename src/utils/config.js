/**
 * Utilidad de configuración de red para el ecosistema RAG RAFAM.
 * Almacena y lee la URL del API Backend (FastAPI).
 */

const DEFAULT_URL = 'http://localhost:8000';

export const getBackendUrl = () => {
  return localStorage.getItem('rafam_backend_url') || DEFAULT_URL;
};

export const setBackendUrl = (url) => {
  if (!url) {
    localStorage.removeItem('rafam_backend_url');
    return;
  }
  
  // Normalizar la URL para que no termine con '/'
  let cleanUrl = url.trim();
  if (cleanUrl.endsWith('/')) {
    cleanUrl = cleanUrl.slice(0, -1);
  }
  
  // Asegurar el protocolo http/https
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'http://' + cleanUrl;
  }
  
  localStorage.setItem('rafam_backend_url', cleanUrl);
};
