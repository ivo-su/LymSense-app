const API_URL = "http://127.0.0.1:8000";
const AUTH_TOKEN_KEY = "lymsense_session_token";

function getStoredToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

function setStoredToken(token) {
  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export function mergeRequestHeaders(baseHeaders = {}, token = getStoredToken()) {
  const mergedHeaders = { ...baseHeaders };
  if (!token) return mergedHeaders;

  return {
    ...mergedHeaders,
    Authorization: `Bearer ${token}`,
  };
}

function buildAuthHeaders(headers = {}) {
  return mergeRequestHeaders(headers, getStoredToken());
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 5000);
  const { headers: extraHeaders, ...requestOptions } = options;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      credentials: "include",
      ...requestOptions,
      headers: mergeRequestHeaders(
        { "Content-Type": "application/json", ...(extraHeaders || {}) },
        getStoredToken(),
      ),
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("El servidor local no respondió. Reinicia la aplicación.");
    }
    throw new Error("No se pudo conectar con el servidor local.");
  } finally {
    window.clearTimeout(timeout);
  }

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json().catch(() => ({})) : null;

  if (!response.ok) {
    const detail = Array.isArray(payload.detail)
      ? payload.detail.map((item) => {
          const location = item.loc?.at(-1);
          return location ? `${location}: ${item.msg}` : item.msg;
        }).join("; ")
      : payload.detail;
    throw new Error(detail || "No se pudo completar la solicitud");
  }

  return response.status === 204 || payload === null ? null : payload;
}

export function signUp(userPayload) {
  return request("/auth/signup", {
    method: "POST",
    body: JSON.stringify(userPayload),
  }).then((result) => {
    if (result?.token) setStoredToken(result.token);
    return result;
  });
}

export function signIn(userPayload) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(userPayload),
  }).then((result) => {
    if (result?.token) setStoredToken(result.token);
    return result;
  });
}

export function getCurrentUser() {
  const token = getStoredToken();
  if (token) {
    return request("/auth/me");
  }
  return request("/auth/me");
}

export function logoutUser() {
  setStoredToken(null);
  return request("/auth/logout", { method: "POST" });
}

export function getUsers() {
  return request("/admin/users");
}

export function createManagedUser(user) {
  return request("/admin/users", {
    method: "POST",
    body: JSON.stringify(user),
  });
}

export function updateManagedUserStatus(userId, isActive) {
  return request(`/admin/users/${userId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ is_active: isActive }),
  });
}

export function deleteManagedUser(userId) {
  return request(`/admin/users/${userId}`, { method: "DELETE" });
}

export function getAccountProfile() {
  return request("/account/profile");
}

export function updateAccountProfile(profile) {
  return request("/account/profile", {
    method: "PATCH",
    body: JSON.stringify(profile),
  });
}

export function getPatients(search = "") {
  const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
  return request(`/patients${query}`);
}

export function getPatient(patientId) {
  return request(`/patients/${patientId}`);
}

export function createPatient(patient) {
  return request("/patients", {
    method: "POST",
    body: JSON.stringify(patient),
  });
}

export function deletePatient(patientId) {
  return request(`/patients/${patientId}`, { method: "DELETE" });
}

export function createLog(log) {
  return request("/logs", {
    method: "POST",
    body: JSON.stringify(log),
  });
}

export function getLogs() {
  return request("/logs");
}

export function deleteLog(logId) {
  return request(`/logs/${logId}`, { method: "DELETE" });
}

export function setLogReference(logId) {
  return request(`/logs/${logId}/reference`, { method: "PATCH" });
}