const fs = require('fs');
const path = require('path');

const SITE = 'https://studyreward.online';

function escape(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

const guides = JSON.parse(fs.readFileSync(path.join(__dirname,'..','data','guides.json'),'utf8'));
const conditions = JSON.parse(fs.readFileSync(path.join(__dirname,'..','data','conditions.json'),'utf8'));
const cities = JSON.parse(fs.readFileSync(path.join(__dirname,'..','data','cities.json'),'utf8'));

const condMap = {};
conditions.forEach(c => { condMap[c.slug] = c; });

const catIcons = {
  'Getting Started': '&#128214;','Financial': '&#128176;','Safety': '&#128737;',
  'Education': '&#127891;','Legal': '&#9878;','Patient Experience': '&#128104;&#8205;&#128105;&#8205;&#128103;&#8205;&#128102;',
  'Condition-Specific': '&#128137;','Childrens Health': '&#128118;',
  default: '&#128196;'
};

function categoryIcon(cat) { return catIcons[cat] || catIcons.default; }

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
}

function renderHeader(navActive) {
  return `<a href="#main-content" class="skip-link">Skip to main content</a>
<header class="header">
  <div class="container">
    <a href="../index.html" class="logo"><span class="logo-icon">SR</span>StudyReward</a>
    <div class="header-search"><input type="text" placeholder="Search trials..."><span class="hs-icon">&#128269;</span></div>
    <nav class="nav" role="navigation" aria-label="Main">
      <a href="../index.html">Home</a>
      <a href="../clinical-trials.html">Trials</a>
      <a href="../states.html">States</a>
      <a href="../cities.html">Cities</a>
      <a href="../conditions.html">Conditions</a>
      <a href="../guides.html"${navActive === 'guides' ? ' class="active" aria-current="page"' : ''}>Guides</a>
      <a href="../about.html">About</a>
      <a href="../contact.html">Contact</a>
    </nav>
    <button class="mobile-toggle" aria-label="Toggle menu"><span></span><span></span><span></span></button>
  </div>
  <div class="mobile-nav" role="navigation" aria-label="Mobile navigation">
    <div class="mobile-search"><input type="text" placeholder="Search trials..."></div>
    <a href="../index.html">Home</a>
    <a href="../clinical-trials.html">Clinical Trials</a>
    <a href="../states.html">Browse by State</a>
    <a href="../cities.html">Browse by City</a>
    <a href="../conditions.html">Conditions</a>
    <a href="../guides.html">Guides</a>
    <a href="../about.html">About</a>
    <a href="../contact.html">Contact</a>
  </div>
</header>`;
}

function renderFooter() {
  return `<footer class="footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a href="../index.html" class="logo"><span class="logo-icon">SR</span>StudyReward</a>
        <p>Helping you find paid clinical trials across the United States.</p>
      </div>
      <div>
        <h4>Quick Links</h4>
        <div class="footer-links">
          <a href="../clinical-trials.html">Clinical Trials</a>
          <a href="../states.html">Browse by State</a>
          <a href="../cities.html">Browse by City</a>
          <a href="../guides.html">Guides</a>
        </div>
      </div>
      <div>
        <h4>Resources</h4>
        <div class="footer-links">
          <a href="../about.html">About</a>
          <a href="../contact.html">Contact</a>
          <a href="../privacy.html">Privacy Policy</a>
        </div>
      </div>
      <div>
        <h4>Top Conditions</h4>
        <div class="footer-links">
          <a href="../conditions/diabetes.html">Diabetes</a>
          <a href="../conditions/cancer.html">Cancer</a>
          <a href="../conditions/heart-disease.html">Heart Disease</a>
          <a href="../conditions.html">View All</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; 2026 StudyReward. All rights reserved.</span>
      <div class="footer-bottom-links">
        <a href="../privacy.html">Privacy</a>
        <a href="../terms.html">Terms</a>
      </div>
      <div class="footer-disclaimer">This site provides information about clinical trials for educational purposes only. It is not medical advice. Always consult a healthcare provider before participating in any clinical trial.</div>
    </div>
  </div>
</footer>`;
}

function renderBreadcrumb(items) {
  let html = '<div class="breadcrumbs"><div class="container">';
  items.forEach((item, i) => {
    if (i > 0) html += '<span class="sep">/</span>';
    if (item.url) {
      html += `<a href="${item.url}">${escape(item.label)}</a>`;
    } else {
      html += `<span class="current">${escape(item.label)}</span>`;
    }
  });
  html += '</div></div>';
  return html;
}

function generateGuidePage(guide) {
  const title = `${escape(guide.title)} | StudyReward`;
  const desc = escape(guide.excerpt.slice(0, 160));
  const canonical = `${SITE}/guides/${guide.slug}`;
  const catSlug = slugify(guide.category);

  // Build TOC
  const tocItems = guide.sections.map((s, i) => ({ id: `section-${i}`, label: s.heading }));
  tocItems.push({ id: 'key-takeaways', label: 'Key Takeaways' });
  if (guide.faq && guide.faq.length) tocItems.push({ id: 'guide-faq', label: 'Frequently Asked Questions' });

  // Related conditions
  const relatedConds = (guide.relatedConditions || []).map(slug => condMap[slug]).filter(Boolean);
  const relatedGuides = (guide.relatedGuides || []).map(id => guides.find(g => g.id === id)).filter(Boolean);

  // JSON-LD
  const articleLD = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": guide.title,
    "description": guide.excerpt,
    "author": { "@type": "Person", "name": guide.author },
    "datePublished": guide.date,
    "dateModified": guide.date,
    "publisher": { "@type": "Organization", "name": "StudyReward", "url": SITE },
    "mainEntityOfPage": { "@type": "WebPage", "@id": canonical }
  };

  const breadcrumbLD = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE}/` },
      { "@type": "ListItem", "position": 2, "name": "Guides", "item": `${SITE}/guides.html` },
      { "@type": "ListItem", "position": 3, "name": guide.title, "item": canonical }
    ]
  };

  const faqLD = guide.faq && guide.faq.length ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": guide.faq.map(f => ({
      "@type": "Question", "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a }
    }))
  } : null;

  const orgLD = {"@context":"https://schema.org","@type":"Organization","name":"StudyReward","url":"https://studyreward.online","logo":"https://studyreward.online/assets/favicon.svg","description":"Find paid clinical trials near you and earn rewards while advancing medical research."};
  const siteLD = {"@context":"https://schema.org","@type":"WebSite","name":"StudyReward","url":"https://studyreward.online","potentialAction":{"@type":"SearchAction","target":{"@type":"EntryPoint","urlTemplate":"https://studyreward.online/clinical-trials.html?q={search_term_string}"},"query-input":"required name=search_term_string"}};

  return `<!DOCTYPE html>
<html lang="en-US">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="en" href="${canonical}">
<link rel="icon" type="image/svg+xml" href="../assets/favicon.svg">
<link rel="apple-touch-icon" href="../assets/apple-touch-icon.svg">

<meta property="og:type" content="article">
<meta property="og:url" content="${canonical}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${SITE}/og-image.svg">
<meta property="og:image" content="${SITE}/og-image.svg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:site_name" content="StudyReward">

<!-- Google Analytics (replace G-XXXXXXXXXX with your GA4 ID) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"><\/script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-XXXXXXXXXX');<\/script>

<!-- Clarity (replace with your Clarity ID) -->
<script>(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,'clarity','script','YOUR_CLARITY_ID');<\/script>

<script type="application/ld+json">${JSON.stringify(orgLD)}</script>
<script type="application/ld+json">${JSON.stringify(siteLD)}</script>
<link rel="preconnect" href="https://www.googletagmanager.com">
<link rel="preconnect" href="https://www.clarity.ms">
<link rel="dns-prefetch" href="https://clinicaltrials.gov">

<script type="application/ld+json">${JSON.stringify(articleLD)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumbLD)}</script>
${faqLD ? `<script type="application/ld+json">${JSON.stringify(faqLD)}</script>` : ''}

<link rel="stylesheet" href="../css/style.css">
</head>
<body data-page="guide" data-guide-slug="${escape(guide.slug)}" data-guide-category="${escape(guide.category)}">

${renderHeader('guides')}

${renderBreadcrumb([
  { label: 'Home', url: '../index.html' },
  { label: 'Guides', url: '../guides.html' },
  { label: guide.title }
])}

<section class="guide-hero" id="main-content">
  <div class="container">
    <div class="gh-top">
      <span class="gh-category">${categoryIcon(guide.category)} ${escape(guide.category)}</span>
      <span class="gh-readtime">${guide.readTime}</span>
    </div>
    <h1>${escape(guide.title)}</h1>
    <p class="gh-excerpt">${escape(guide.excerpt)}</p>
    <div class="gh-meta">
      <span class="gh-author">By ${escape(guide.author)}</span>
      <span class="gh-date">${formatDate(guide.date)}</span>
    </div>
    <div class="gh-actions">
      <button class="btn btn-sm btn-outline" id="copy-guide-link" aria-label="Copy guide link">&#128203; Copy Link</button>
      <button class="btn btn-sm btn-outline" id="share-guide-btn" aria-label="Share this guide">&#128257; Share</button>
      <button class="btn btn-sm btn-outline" id="print-guide-btn" aria-label="Print this guide">&#128424; Print</button>
    </div>
  </div>
</section>

<div class="guide-progress-bar" id="guide-progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>

<div class="container">
  <div class="study-layout">
    <main class="study-main">
      <div class="sd-section" id="guide-intro">
        <p class="guide-intro-text">${escape(guide.excerpt)}</p>
      </div>

      ${guide.sections.map((section, i) => `
      <div class="sd-section guide-section" id="section-${i}">
        <h2>${escape(section.heading)}</h2>
        <p>${escape(section.content)}</p>
      </div>
      `).join('')}

      <div class="sd-section" id="key-takeaways">
        <h2>Key Takeaways</h2>
        <ul class="takeaways-list">
          ${guide.takeaways.map(t => `<li>${escape(t)}</li>`).join('')}
        </ul>
      </div>

      ${guide.faq && guide.faq.length ? `
      <div class="sd-section" id="guide-faq">
        <h2>Frequently Asked Questions</h2>
        <div class="faq-list">
          ${guide.faq.map((f, i) => `
          <div class="faq-item${i === 0 ? ' open' : ''}">
            <button class="faq-question">${escape(f.q)}<span class="faq-icon">&#9660;</span></button>
            <div class="faq-answer" style="max-height:${i === 0 ? '200px' : '0'}">
              <div class="faq-answer-inner">${escape(f.a)}</div>
            </div>
          </div>
          `).join('')}
        </div>
      </div>` : ''}

      ${relatedGuides.length ? `
      <div class="sd-section">
        <h2>Related Guides</h2>
        <div class="guides-grid">
          ${relatedGuides.map(g => `
          <div class="guide-card card">
            <div class="gc-top">
              <span class="guide-category">${escape(g.category)}</span>
              <span class="guide-readtime">${g.readTime}</span>
            </div>
            <h3><a href="../guides/${g.slug}.html">${escape(g.title)}</a></h3>
            <p>${escape(g.excerpt)}</p>
            <div class="guide-footer">
              <span class="guide-author">By ${escape(g.author)}</span>
              <a href="../guides/${g.slug}.html" class="guide-cta">Read Guide &rarr;</a>
            </div>
          </div>
          `).join('')}
        </div>
      </div>` : ''}

      ${relatedConds.length ? `
      <div class="sd-section">
        <h2>Related Conditions</h2>
        <div class="conditions-grid" style="max-width:600px">
          ${relatedConds.map(c => `
          <a href="../conditions/${c.slug}.html" class="condition-card">
            <div class="cond-icon">${c.icon || '🔬'}</div>
            <h4>${escape(c.name)}</h4>
            <div class="cond-desc">${escape((c.description || '').slice(0,120))}</div>
            <div class="cond-link">View Studies &rarr;</div>
          </a>
          `).join('')}
        </div>
      </div>` : ''}

      <div class="sd-section medical-disclaimer" style="margin-top:16px">
        <h2 style="border:none;padding:0;margin-bottom:8px;font-size:1rem">Medical Disclaimer</h2>
        <p>This guide is for informational purposes only and does not constitute medical advice. Always consult with a qualified healthcare provider before making decisions about clinical trial participation or any medical treatment. StudyReward does not provide medical recommendations or endorse specific clinical trials.</p>
      </div>
    </main>

    <aside class="study-sidebar guide-sidebar" role="complementary" aria-label="Guide navigation">
      <div class="sidebar-card toc-card" id="guide-toc-card">
        <h3>In This Guide</h3>
        <nav class="toc-nav" aria-label="Table of contents">
          ${tocItems.map(item => `<a href="#${item.id}" class="toc-item">${escape(item.label)}</a>`).join('')}
        </nav>
      </div>
      <div class="sidebar-card">
        <h3>About the Author</h3>
        <div class="author-card">
          <div class="author-name">${escape(guide.author)}</div>
          <div class="author-role">StudyReward Editorial Team</div>
        </div>
      </div>
      <div class="sidebar-card">
        <h3>Quick Links</h3>
        <div class="sidebar-links">
          <a href="../clinical-trials.html">Find Clinical Trials</a>
          <a href="../states.html">Browse by State</a>
          <a href="../cities.html">Browse by City</a>
          <a href="../conditions.html">Browse Conditions</a>
        </div>
      </div>
    </aside>
  </div>
</div>

${renderFooter()}

<script src="../js/guide.js"></script>
</body>
</html>`;
}

// Generate all guide pages
const outDir = path.join(__dirname, '..', 'guides');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

guides.forEach(guide => {
  const html = generateGuidePage(guide);
  const filePath = path.join(outDir, `${guide.slug}.html`);
  // Convert LF to CRLF for Windows compatibility
  fs.writeFileSync(filePath, html.replace(/\n/g, '\r\n'), 'utf8');
  console.log(`  Generated: guides/${guide.slug}.html`);
});

// Generate category listing pages
const categories = {};
guides.forEach(g => {
  if (!categories[g.category]) categories[g.category] = [];
  categories[g.category].push(g);
});

const catDir = path.join(outDir, 'categories');
if (!fs.existsSync(catDir)) fs.mkdirSync(catDir, { recursive: true });

Object.keys(categories).forEach(catName => {
  const catSlug = slugify(catName);
  const catGuides = categories[catName];
  const title = `${escape(catName)} Guides | StudyReward`;
  const desc = `Browse our collection of ${escape(catName.toLowerCase())} guides about clinical trials and medical research participation.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${SITE}/guides/categories/${catSlug}">
<link rel="alternate" hreflang="en" href="${SITE}/guides/categories/${catSlug}">
<link rel="icon" type="image/svg+xml" href="../../assets/favicon.svg">

<meta property="og:type" content="website">
<meta property="og:url" content="${SITE}/guides/categories/${catSlug}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${SITE}/og-image.svg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:site_name" content="StudyReward">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${SITE}/og-image.svg">

<!-- Google Analytics (replace G-XXXXXXXXXX with your GA4 ID) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"><\/script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-XXXXXXXXXX');<\/script>

<!-- Clarity (replace with your Clarity ID) -->
<script>(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,'clarity','script','YOUR_CLARITY_ID');<\/script>

<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"StudyReward","url":"https://studyreward.online","logo":"https://studyreward.online/assets/favicon.svg","description":"Find paid clinical trials near you and earn rewards while advancing medical research."}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"StudyReward","url":"https://studyreward.online","potentialAction":{"@type":"SearchAction","target":{"@type":"EntryPoint","urlTemplate":"https://studyreward.online/clinical-trials.html?q={search_term_string}"},"query-input":"required name=search_term_string"}}</script>
<link rel="preconnect" href="https://www.googletagmanager.com">
<link rel="preconnect" href="https://www.clarity.ms">
<link rel="dns-prefetch" href="https://clinicaltrials.gov">

<link rel="stylesheet" href="../../css/style.css">
</head>
<body data-page="guides">

${renderHeader('guides')}
${renderBreadcrumb([
  { label: 'Home', url: '../../index.html' },
  { label: 'Guides', url: '../../guides.html' },
  { label: `${catName} Guides` }
])}

<section class="page-header" id="main-content">
  <div class="container">
    <h1>${categoryIcon(catName)} ${escape(catName)} Guides</h1>
    <p>${desc}</p>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="guides-grid">
      ${catGuides.map(g => `
      <div class="guide-card card">
        <div class="gc-top">
          <span class="guide-category">${escape(g.category)}</span>
          <span class="guide-readtime">${g.readTime}</span>
        </div>
        <h3><a href="../${g.slug}.html">${escape(g.title)}</a></h3>
        <p>${escape(g.excerpt)}</p>
        <div class="guide-footer">
          <span class="guide-author">By ${escape(g.author)}</span>
          <a href="../${g.slug}.html" class="guide-cta">Read Guide &rarr;</a>
        </div>
      </div>
      `).join('')}
    </div>
  </div>
</section>

${renderFooter()}
</body>
</html>`;

  const filePath = path.join(catDir, `${catSlug}.html`);
  fs.writeFileSync(filePath, html.replace(/\n/g, '\r\n'), 'utf8');
  console.log(`  Generated: guides/categories/${catSlug}.html`);
});

console.log(`\nDone! Generated ${guides.length} guide pages and ${Object.keys(categories).length} category pages.`);
