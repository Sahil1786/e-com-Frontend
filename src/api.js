const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/v1").replace(/\/+$/, "");

async function request(url, options = {}) {
  const { body, headers, responseType, ...requestOptions } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const response = await fetch(url, {
    ...requestOptions,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(body === undefined || isFormData ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    ...(body === undefined ? {} : { body: isFormData ? body : JSON.stringify(body) }),
  });

  if (responseType === "blob") {
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || payload.message || `Request failed (${response.status})`);
    }
    return response.blob();
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || payload.message || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

export function api(path, options = {}) {
  const { responseType, ...requestOptions } = options;
  return request(`${API_BASE_URL}${path}`, { ...requestOptions, responseType });
}

export function checkApi() {
  const healthUrl = API_BASE_URL.startsWith("http")
    ? `${new URL(API_BASE_URL).origin}/health`
    : "/health";
  return request(healthUrl);
}

export async function downloadInvoice(orderId, invoiceNumber) {
  const blob = await api(`/user/orders/${orderId}/invoice`, { responseType: "blob" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${invoiceNumber || "invoice"}.pdf`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
