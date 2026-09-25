const API_URL = "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 5000);

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
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

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const detail = Array.isArray(error.detail)
      ? error.detail.map((item) => {
          const location = item.loc?.at(-1);
          return location ? `${location}: ${item.msg}` : item.msg;
        }).join("; ")
      : error.detail;
    throw new Error(detail || "No se pudo completar la solicitud");
  }

  return response.status === 204 ? null : response.json();
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