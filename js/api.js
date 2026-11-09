import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const BUCKET = "products";
let client = null;

function db() {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    });
  }
  return client;
}

export async function listActiveProducts() {
  const { data, error } = await db()
    .from("products")
    .select("id,name,description,price,category,image_url,image_path,featured,active,created_at")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getActiveProduct(id) {
  const { data, error } = await db()
    .from("products")
    .select("id,name,description,price,category,image_url,image_path,featured,active,created_at")
    .eq("id", id)
    .eq("active", true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listAllProducts() {
  const { data, error } = await db()
    .from("products")
    .select("id,name,description,price,category,image_url,image_path,featured,active,created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createProduct(values) {
  const { data, error } = await db()
    .from("products")
    .insert(values)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProduct(id, values) {
  const { data, error } = await db()
    .from("products")
    .update(values)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProduct(id) {
  const { error } = await db().from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await db().auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signIn(email, password) {
  const { data, error } = await db().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function signOut() {
  const { error } = await db().auth.signOut();
  if (error) throw error;
}

export async function uploadProductImage(blob) {
  const random = crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const path = `${random}.webp`;

  const { error } = await db().storage.from(BUCKET).upload(path, blob, {
    contentType: "image/webp",
    cacheControl: "31536000",
    upsert: false
  });

  if (error) throw error;

  const { data } = db().storage.from(BUCKET).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

export async function removeProductImage(path) {
  if (!path) return;
  const { error } = await db().storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
