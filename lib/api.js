// API library for making HTTP requests
import { auth } from "./firebase";

const handleResponse = (response) => {
  if (!response.ok) {
    switch (response.status) {
      case 401:
        throw new Error("Unauthorized");
      case 403:
        throw new Error("Forbidden - You don't have permission");
      case 404:
        throw new Error("Resource not found");
      case 429:
        throw new Error("Too many requests");
      default:
        throw new Error(`HTTP error! status: ${response.status}`);
    }
  }
  return response.json();
};

const getContentType = (options = {}) => {
  if (options.headers?.["Content-Type"]) return options.headers["Content-Type"];

  if (options.body instanceof FormData) return null;

  if (options.body && typeof options.body === "string") return "text/plain";

  return "application/json";
};

const api = {
  // Base API configuration
  config: {
    baseURL: "",
  },

  // Initialize API with config
  init: (config = {}) => {
    api.config = {
      ...api.config,
      ...config,
    };
  },

  // Generic request handler
  request: async (endpoint, options = {}, forceRefresh = false) => {
    try {
      const url = api.config.baseURL + endpoint;

      // Get auth token if getToken function exists
      let headers = {
        ...api.config.headers,
        ...options.headers,
      };

      const contentType = getContentType(options);
      if (contentType) headers["Content-Type"] = contentType;

      const token = await auth.currentUser?.getIdToken(forceRefresh);
      headers = {
        ...headers,
        Authorization: `Bearer ${token}`,
      };

      const response = await fetch(url, {
        ...options,
        headers,
      });

      // if 401, retry with force refresh
      if (response.status === 401 && !forceRefresh) {
        return api.request(endpoint, options, true); // Retry with force refresh
      }

      return handleResponse(response);
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // GET request
  get: (endpoint, options = {}) => {
    return api.request(endpoint, {
      ...options,
      method: "GET",
    });
  },

  // POST request
  post: (endpoint, body, options = {}) => {
    return api.request(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  // POST FormData request for file uploads
  postForm: (endpoint, formData, options = {}) => {
    return api.request(endpoint, {
      ...options,
      method: "POST",
      headers: {},
      body: formData,
    });
  },

  // PUT request
  put: (endpoint, body, options = {}) => {
    return api.request(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  // DELETE request
  delete: (endpoint, options = {}) => {
    return api.request(endpoint, {
      ...options,
      method: "DELETE",
    });
  },

  // PATCH request
  patch: (endpoint, body, options = {}) => {
    return api.request(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },
};

export default api;
