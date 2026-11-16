import { SUPABASE_URL, SUPABASE_ANON_KEY, STORE_KEY } from "./config.js";

const REST = `${SUPABASE_URL}/rest/v1`;
const STORAGE = `${SUPABASE_URL}/storage/v1`;
const BUCKET = "products";

const EXT_BY_TYPE = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif"
};

function baseHeaders() {
  const headers = { apikey: SUPABASE_ANON_KEY };
  if (String(SUPABASE_ANON_KEY || "").startsWith("eyJ")) {
    headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
  }
  if (STORE_KEY) headers["x-store-key"] = STORE_KEY;
  return headers;
}

async function readBody(response) {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
}

function toError(response, data) {
  const message = data && typeof data === "object"
    ? data.message || data.error_description || data.error || JSON.stringify(data)
    : String(data || response.statusText);
  const error = new Error(message);
  error.status = response.status;
  error.code = data && typeof data === "object" ? data.code : undefined;
  return error;
}

async function api(path, { method = "GET", body, prefer, headers = {} } = {}) {
  const init = { method, headers: { ...baseHeaders(), ...headers } };
  if (body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  if (prefer) init.headers.Prefer = prefer;

  const response = await fetch(`${REST}${path}`, init);
  const data = await readBody(response);
  if (!response.ok) throw toError(response, data);
  return data;
}

// a coluna "images" (galeria) pode nao existir num banco antigo:
// nesse caso o painel continua funcionando com uma foto so.
function needsImagesFallback(error) {
  const message = String(error && error.message ? error.message : "");
  return /images/i.test(message) &&
    (error.code === "PGRST204" || error.code === "42703" || /images/i.test(message));
}

function dropImages(values) {
  if (!values || !("images" in values)) return values;
  const copy = { ...values };
  delete copy.images;
  return copy;
}

export function productImages(product) {
  const list = [];
  const push = (url, path) => {
    if (!url) return;
    if (list.some((entry) => entry.url === url)) return;
    list.push({ url, path: path || null });
  };

  push(product && product.image_url, product && product.image_path);

  const extra = product && Array.isArray(product.images) ? product.images : [];
  extra.forEach((item) => {
    if (typeof item === "string") push(item, null);
    else if (item) push(item.url, item.path);
  });

  return list;
}

export async function listActiveProducts() {
  const data = await api("/products?select=*&active=eq.true&order=created_at.desc");
  return data ?? [];
}

export async function getActiveProduct(id) {
  const data = await api(
    `/products?select=*&id=eq.${encodeURIComponent(id)}&active=eq.true&limit=1`
  );
  return (data && data[0]) || null;
}

export async function listAllProducts() {
  const data = await api("/products?select=*&order=created_at.desc");
  return data ?? [];
}

export async function createProduct(values) {
  try {
    const data = await api("/products", {
      method: "POST",
      body: values,
      prefer: "return=representation"
    });
    return (data && data[0]) || null;
  } catch (error) {
    if (error.code !== "PGRST204" && error.code !== "42703") throw error;
    const data = await api("/products", {
      method: "POST",
      body: dropImages(values),
      prefer: "return=representation"
    });
    return (data && data[0]) || null;
  }
}

export async function updateProduct(id, values) {
  try {
    const data = await api(`/products?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: values,
      prefer: "return=representation"
    });
    return (data && data[0]) || null;
  } catch (error) {
    if (error.code !== "PGRST204" && error.code !== "42703") throw error;
    const data = await api(`/products?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: dropImages(values),
      prefer: "return=representation"
    });
    return (data && data[0]) || null;
  }
}

export async function deleteProduct(id) {
  await api(`/products?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
}

function randomName() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function uploadProductImage(blob) {
  const type = blob.type || "image/jpeg";
  const path = `${randomName()}.${EXT_BY_TYPE[type] || "jpg"}`;

  const response = await fetch(`${STORAGE}/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      ...baseHeaders(),
      "Content-Type": type,
      "cache-control": "31536000",
      "x-upsert": "false"
    },
    body: blob
  });

  const data = await readBody(response);
  if (!response.ok) throw toError(response, data);

  return { path, url: `${STORAGE}/object/public/${BUCKET}/${path}` };
}

export async function removeProductImage(path) {
  if (!path) return;

  const response = await fetch(`${STORAGE}/object/${BUCKET}`, {
    method: "DELETE",
    headers: { ...baseHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: [path] })
  });

  if (!response.ok) throw toError(response, await readBody(response));
}
