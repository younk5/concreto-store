// Gera /p/<id> com as metas do produto no HTML servido ao WhatsApp, Google e afins.
const fs = require("fs");
const path = require("path");

const SUPABASE_URL = "https://thiibazkdxavfrlgmofk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_VFtc4jYMPuUXjVWiO1s5hA_C4dkZiL2";
const SITE = "https://concreto-store-main.vercel.app";
const UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function brl(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "";
  return number.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function readTemplate() {
  const local = path.join(process.cwd(), "produto.html");
  try {
    return fs.readFileSync(local, "utf8");
  } catch (error) {
    return null;
  }
}

async function fetchTemplate() {
  const response = await fetch(`${SITE}/produto.html`, { headers: { "cache-control": "no-cache" } });
  if (!response.ok) throw new Error(`template ${response.status}`);
  return response.text();
}

async function fetchProduct(id) {
  const url = `${SUPABASE_URL}/rest/v1/products?select=*&id=eq.${encodeURIComponent(id)}&active=eq.true&limit=1`;
  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  if (!response.ok) throw new Error(`supabase ${response.status}`);
  const rows = await response.json();
  return Array.isArray(rows) ? rows[0] || null : null;
}

function productPhoto(product) {
  if (product.image_url) return product.image_url;
  const extra = Array.isArray(product.images) ? product.images : [];
  for (const item of extra) {
    const url = typeof item === "string" ? item : item && item.url;
    if (url) return url;
  }
  return `${SITE}/img/og-image.jpg`;
}

function allPhotos(product) {
  const list = [];
  if (product.image_url) list.push(product.image_url);
  const extra = Array.isArray(product.images) ? product.images : [];
  for (const item of extra) {
    const url = typeof item === "string" ? item : item && item.url;
    if (url && !list.includes(url)) list.push(url);
  }
  return list.length ? list : [`${SITE}/img/og-image.jpg`];
}

function setContent(html, pattern, replacement) {
  return pattern.test(html) ? html.replace(pattern, replacement) : html;
}

function inject(html, product) {
  const name = String(product.name || "Produto").trim();
  const price = brl(product.price);
  const photo = productPhoto(product);
  const url = `${SITE}/p/${product.id}`;
  const description = (product.description || "").replace(/\s+/g, " ").trim();
  const cut = (text, size) => {
    if (!text || text.length <= size) return text || "";
    const slice = text.slice(0, size);
    const space = slice.lastIndexOf(" ");
    return (space > size * 0.6 ? slice.slice(0, space) : slice) + "...";
  };
  const summary = cut(
    `${price ? price + " - " : ""}${name}${product.category ? " (" + product.category + ")" : ""}. ${
      description || "Detalhes e compra pelo WhatsApp na VG Store."
    }`,
    200
  );
  const title = `${name}${price ? " - " + price : ""} | VG Store`;

  let out = html;

  out = setContent(out, /<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`);
  out = setContent(
    out,
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${escapeHtml(summary)}">`
  );
  out = setContent(
    out,
    /<meta property="og:title" content="[^"]*">/,
    `<meta property="og:title" content="${escapeHtml(title)}">`
  );
  out = setContent(
    out,
    /<meta property="og:description" content="[^"]*">/,
    `<meta property="og:description" content="${escapeHtml(summary)}">`
  );
  out = setContent(
    out,
    /<meta property="og:image" content="[^"]*">/,
    `<meta property="og:image" content="${escapeHtml(photo)}">`
  );
  out = setContent(
    out,
    /<meta property="og:url" content="[^"]*">/,
    `<meta property="og:url" content="${escapeHtml(url)}">`
  );
  out = setContent(
    out,
    /<link rel="canonical" href="[^"]*">/,
    `<link rel="canonical" href="${escapeHtml(url)}">`
  );
  out = setContent(
    out,
    /<meta name="twitter:title" content="[^"]*">/,
    `<meta name="twitter:title" content="${escapeHtml(title)}">`
  );
  out = setContent(
    out,
    /<meta name="twitter:description" content="[^"]*">/,
    `<meta name="twitter:description" content="${escapeHtml(summary)}">`
  );
  out = setContent(
    out,
    /<meta name="twitter:image" content="[^"]*">/,
    `<meta name="twitter:image" content="${escapeHtml(photo)}">`
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: description || name,
    image: allPhotos(product),
    category: product.category || undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: Number.isFinite(Number(product.price)) ? Number(product.price).toFixed(2) : undefined,
      availability: "https://schema.org/InStock",
      url
    }
  };

  out = out.replace(
    "</head>",
    `  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n</head>`
  );

  return out;
}

module.exports = async (req, res) => {
  const query = String(req.url || "").split("?")[1] || "";
  const fromQuery = new URLSearchParams(query).get("id");
  const fromPath = (String(req.url || "").match(/\/p\/([0-9a-fA-F-]{36})/) || [])[1];
  const id = String(fromQuery || fromPath || "").trim();

  let html = readTemplate();
  if (!html) {
    try {
      html = await fetchTemplate();
    } catch (error) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.end("template indisponivel");
    }
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");

  if (!UUID.test(id)) {
    res.statusCode = 404;
    res.setHeader("Cache-Control", "s-maxage=60");
    return res.end(html);
  }

  let product = null;
  try {
    product = await fetchProduct(id);
  } catch (error) {
    product = null;
  }

  if (!product) {
    res.statusCode = 200;
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=300");
    return res.end(html);
  }

  res.statusCode = 200;
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=86400");
  return res.end(inject(html, product));
};
