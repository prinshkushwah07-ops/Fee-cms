console.log('DEBUG: VITE_API_URL from env is:', import.meta.env.VITE_API_URL);
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper to sanitize endpoint and append prefix if missing
const getFullUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${BASE_URL.replace(/\/$/, '')}${cleanEndpoint}`;
};

// Custom error handling mapping function
const parseError = async (err, response = null) => {
  // If response is null, it's a network/TypeError/CORS issue
  if (!response) {
    const isNetworkError = err instanceof TypeError || err.message?.includes('fetch') || err.message?.includes('network');
    if (isNetworkError) {
      return new Error('Unable to connect to the backend server. Please verify your internet connection or check if the API service is running.');
    }
    return err;
  }

  let responseData = {};
  try {
    responseData = await response.json();
  } catch (parseErr) {
    // If not JSON, ignore
  }

  const message = responseData.message || responseData.error || '';
  
  if (response.status === 401) {
    return new Error(message || 'Invalid username or password.');
  }

  if (response.status === 400) {
    return new Error(message || 'Required input parameters are missing or invalid.');
  }

  if (response.status === 403) {
    return new Error(message || 'Access denied. You do not have permissions for this action.');
  }

  if (response.status === 404) {
    return new Error(message || 'Requested resource or API endpoint not found.');
  }

  if (response.status >= 500) {
    // Check if error contains database or SQL terms
    const isDbError = /db|mysql|connect|econnrefused|query|pool|sql/i.test(message);
    if (isDbError) {
      if (import.meta.env.DEV) {
        console.error('DEVELOPMENT DB ERROR:', message);
      }
      return new Error('Database connection failure. The server is unable to connect to the database.');
    }
    return new Error(message || 'Server error: An unexpected error occurred on the server.');
  }

  return new Error(message || `Server request failed with status ${response.status}`);
};

const request = async (method, endpoint, data = null) => {
  const url = getFullUrl(endpoint);
  const options = {
    method,
    headers: {}
  };

  if (data) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(data);
  }

  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const parsedErr = await parseError(null, res);
      if (import.meta.env.DEV) {
        console.group('=== Nexvora API Request Error ===');
        console.error('API Base URL:', BASE_URL);
        console.error('Request Endpoint:', endpoint);
        console.error('HTTP Status Code:', res.status);
        console.error('Response Error:', parsedErr.message);
        console.groupEnd();
      }
      throw parsedErr;
    }
    return await res.json();
  } catch (err) {
    // If it's already a parsed Error from response, rethrow it
    if (err.message && (
      err.message.includes('Unable to connect') ||
      err.message.includes('Database connection') ||
      err.message.includes('Invalid username') ||
      err.message.includes('Required input') ||
      err.message.includes('Access denied') ||
      err.message.includes('not found') ||
      err.message.includes('Server error')
    )) {
      throw err;
    }
    const parsedErr = await parseError(err);
    if (import.meta.env.DEV) {
      console.group('=== Nexvora API Network/CORS Error ===');
      console.error('API Base URL:', BASE_URL);
      console.error('Request Endpoint:', endpoint);
      console.error('Network Error Details:', err);
      console.error('Response Error Message:', parsedErr.message);
      console.groupEnd();
    }
    throw parsedErr;
  }
};

export const api = {
  get: (endpoint) => request('GET', endpoint),
  post: (endpoint, data) => request('POST', endpoint, data),
  put: (endpoint, data) => request('PUT', endpoint, data),
  delete: (endpoint) => request('DELETE', endpoint)
};

