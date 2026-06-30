const fs = require('fs');
const path = require('path');

const SITE = 'https://studyreward.online';
const ROOT = path.join(__dirname, '..');

function pagesIn(dir, ext = '.html') {
  const d = path.join(ROOT, dir);
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d).filter(f => f.endsWith(ext));
}

function fileModTime(filePath) {
  try {
    const stat = fs.statSync(path.join(ROOT, filePath));
    return stat.mtime.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

function url(loc, lastmod = null, changefreq = 'weekly', priority = '0.8') {
  return `  <url>\n    <loc>${SITE}/${loc}</loc>\n    <lastmod>${lastmod || new Date().toISOString().split('T')[0]}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

function sitemapIndex(children) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${children.map(s => `  <sitemap>\n    <loc>${SITE}/${s}</loc>\n    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n  </sitemap>`).join('\n')}\n</sitemapindex>`;
}

function sitemapXml(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
}

// === Top-level pages ===
const topLevelPages = [
  { loc: '', priority: '1.0', changefreq: 'daily' },
  { loc: 'clinical-trials.html', priority: '0.9', changefreq: 'daily' },
  { loc: 'states.html', priority: '0.8', changefreq: 'weekly' },
  { loc: 'cities.html', priority: '0.8', changefreq: 'weekly' },
  { loc: 'conditions.html', priority: '0.8', changefreq: 'weekly' },
  { loc: 'guides.html', priority: '0.9', changefreq: 'weekly' },
  { loc: 'about.html', priority: '0.6', changefreq: 'monthly' },
  { loc: 'contact.html', priority: '0.5', changefreq: 'monthly' },
  { loc: 'privacy-policy.html', priority: '0.3', changefreq: 'yearly' },
  { loc: 'terms-of-service.html', priority: '0.3', changefreq: 'yearly' }
];

const topLevelUrls = topLevelPages.map(p =>
  url(p.loc, null, p.changefreq, p.priority)
);

// === State pages ===
const stateFiles = pagesIn('states');
const stateUrls = stateFiles.map(f => {
  const slug = f.replace('.html', '');
  const lastmod = fileModTime(path.join('states', f));
  return url(`states/${slug}`, lastmod, 'weekly', '0.7');
});

// === City pages ===
const cityFiles = pagesIn('cities');
const cityUrls = cityFiles.map(f => {
  const slug = f.replace('.html', '');
  const lastmod = fileModTime(path.join('cities', f));
  return url(`cities/${slug}`, lastmod, 'weekly', '0.7');
});

// === Condition pages ===
const conditionFiles = pagesIn('conditions');
const conditionUrls = conditionFiles.map(f => {
  const slug = f.replace('.html', '');
  const lastmod = fileModTime(path.join('conditions', f));
  return url(`conditions/${slug}`, lastmod, 'weekly', '0.7');
});

// === Guide pages ===
const guideFiles = pagesIn('guides').filter(f => !f.includes('/') && f !== 'categories');
const guideUrls = guideFiles.map(f => {
  const slug = f.replace('.html', '');
  const lastmod = fileModTime(path.join('guides', f));
  return url(`guides/${slug}`, lastmod, 'weekly', '0.7');
});

// === Guide category pages ===
const guideCatFiles = pagesIn(path.join('guides', 'categories'));
const guideCatUrls = guideCatFiles.map(f => {
  const slug = f.replace('.html', '');
  const lastmod = fileModTime(path.join('guides', 'categories', f));
  return url(`guides/categories/${slug}`, lastmod, 'weekly', '0.6');
});

// === Generate split sitemaps ===
const sitemapsDir = path.join(ROOT, 'sitemaps');
if (!fs.existsSync(sitemapsDir)) fs.mkdirSync(sitemapsDir, { recursive: true });

const splitSitemaps = [
  { name: 'sitemaps/pages.xml', urls: topLevelUrls },
  { name: 'sitemaps/states.xml', urls: stateUrls },
  { name: 'sitemaps/cities.xml', urls: cityUrls },
  { name: 'sitemaps/conditions.xml', urls: conditionUrls },
  { name: 'sitemaps/guides.xml', urls: [...guideUrls, ...guideCatUrls] }
];

splitSitemaps.forEach(({ name, urls }) => {
  const filePath = path.join(ROOT, name);
  fs.writeFileSync(filePath, sitemapXml(urls), 'utf8');
  console.log(`  Generated: ${name} (${urls.length} URLs)`);
});

// === Generate sitemap index ===
const index = sitemapIndex(splitSitemaps.map(s => s.name));
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), index, 'utf8');
console.log(`\n  Generated: sitemap.xml (index of ${splitSitemaps.length} sitemaps)`);

// === Summary ===
const total = topLevelUrls.length + stateUrls.length + cityUrls.length + conditionUrls.length + guideUrls.length + guideCatUrls.length;
console.log(`\nDone! Total URLs: ${total}`);
console.log(`  Pages:       ${topLevelUrls.length}`);
console.log(`  States:      ${stateUrls.length}`);
console.log(`  Cities:      ${cityUrls.length}`);
console.log(`  Conditions:  ${conditionUrls.length}`);
console.log(`  Guides:      ${guideUrls.length + guideCatUrls.length}`);
