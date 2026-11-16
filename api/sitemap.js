// Sitemap dinamico: home + uma URL por produto ativo.
const SUPABASE_URL = "https://thiibazkdxavfrlgmofk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_VFtc4jYMPuUXjVWiO1s5hA_C4dkZiL2";
const SITE = "https://concreto-store-main.vercel.app";

function escapeXml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function listProducts() {
  const url = `${SUPABASE_URL}/rest/v1/products?select=id,created_at&active=eq.true&order=created_at.desc`;
  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  if (!response.ok) return [];
  const rows = await response.json();
  return Array.isArray(rows) ? rows : [];
}

module.exports = async (req, res) => {
  let products = [];
  try {
    products = await listProducts();
  } catch (error) {
    products = [];
  }

  const urls = [
    `  <url>\n    <loc>${SITE}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>`,
    ...products.map((product) => {
      const lastmod = product.created_at ? `\n    <lastmod>${new Date(product.created_at).toISOString()}</lastmod>` : "";
      return `  <url>\n    <loc>${SITE}/p/${escapeXml(product.id)}</loc>${lastmod}\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
    })
  ];

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=86400");
  res.end(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`
  );
};
