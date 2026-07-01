const fs = require('fs');
const path = require('path');

const conditions = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'conditions.json'), 'utf8'));
const states = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'states.json'), 'utf8'));
const cities = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'cities.json'), 'utf8'));

const stateAbbr = {};
states.forEach(s => { stateAbbr[s.name] = s.abbr; });
const stateSlug = {};
states.forEach(s => { stateSlug[s.name] = s.slug; });

function escapeHTML(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const outDir = path.join(__dirname, '..', 'conditions');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

conditions.forEach(cond => {
  const name = cond.name;
  const slug = cond.slug;
  const icon = cond.icon || '🔬';
  const title = 'Paid ' + name + ' Clinical Trials (2026)';
  const metaDesc = 'Browse recruiting ' + name.toLowerCase() + ' clinical trials across the United States. Find eligibility information, locations and research opportunities.';

  const relatedCondHtml = (cond.relatedConditions || []).map(r => {
    const rs = slugify(r);
    return '<a href="conditions/' + rs + '.html" class="condition-card">' +
      '<h4>' + escapeHTML(r) + '</h4>' +
      '<div class="cond-link">View Studies &rarr;</div></a>';
  }).join('');

  const relatedStateHtml = (cond.relatedStates || []).map(st => {
    const s = states.find(x => x.name === st);
    if (!s) return '';
    return '<a href="states/' + s.slug + '.html" class="state-card">' +
      '<span class="state-name">' + escapeHTML(st) + ' (' + s.abbr + ')</span>' +
      '<span class="state-count">View studies &rarr;</span></a>';
  }).join('');

  // Find cities in related states
  const relatedCities = cities.filter(c => (cond.relatedStates || []).includes(c.state)).slice(0, 8);
  const relatedCityHtml = relatedCities.map(c =>
    '<a href="cities/' + c.slug + '.html" class="city-card">' +
      '<h4>' + escapeHTML(c.name) + '</h4>' +
      '<div class="city-state">' + escapeHTML(c.state) + '</div>' +
      '<div class="city-count">View studies &rarr;</div></a>'
  ).join('');

  const faqHtml = (cond.faq || []).map((f, i) =>
    '<div class="faq-item' + (i === 0 ? ' open' : '') + '">' +
      '<button class="faq-question">' + escapeHTML(f.q) + '<span class="faq-icon">&#9660;</span></button>' +
      '<div class="faq-answer" style="max-height:' + (i === 0 ? '200px' : '0') + '">' +
        '<div class="faq-answer-inner">' + escapeHTML(f.a) + '</div></div></div>'
  ).join('');

  const page = '<!DOCTYPE html>\n<html lang="en-US">\n<head>\n' +
    '<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>' + title + '</title>\n' +
    '<meta name="description" content="' + metaDesc + '">\n' +
    '<meta name="robots" content="index, follow">\n' +
    '<link rel="canonical" href="https://studyreward.online/conditions/' + slug + '">\n' +
    '<link rel="alternate" hreflang="en" href="https://studyreward.online/conditions/' + slug + '">\n' +
    '<link rel="icon" type="image/svg+xml" href="../assets/favicon.svg">\n' +
    '<link rel="apple-touch-icon" href="../assets/apple-touch-icon.svg">\n\n' +

    '<meta property="og:type" content="website">\n' +
    '<meta property="og:url" content="https://studyreward.online/conditions/' + slug + '">\n' +
    '<meta property="og:title" content="' + title + '">\n' +
    '<meta property="og:description" content="' + metaDesc + '">\n' +
    '<meta name="twitter:card" content="summary_large_image">\n' +
    '<meta name="twitter:title" content="' + title + '">\n' +
    '<meta name="twitter:description" content="' + metaDesc + '">\n' +
    '<meta name="twitter:image" content="https://studyreward.online/og-image.svg">\n' +
    '<meta property="og:image" content="https://studyreward.online/og-image.svg">\n' +
    '<meta property="og:image:width" content="1200">\n' +
    '<meta property="og:image:height" content="630">\n' +
    '<meta property="og:site_name" content="StudyReward">\n\n' +

    '<!-- Google Analytics (replace G-XXXXXXXXXX with your GA4 ID) -->\n' +
    '<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"><\/script>\n' +
    '<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag(\'js\',new Date());gtag(\'config\',\'G-XXXXXXXXXX\');<\/script>\n\n' +
    '<!-- Clarity (replace with your Clarity ID) -->\n' +
    '<script>(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src=\'https://www.clarity.ms/tag/\'+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,\'clarity\',\'script\',\'YOUR_CLARITY_ID\');<\/script>\n' +
    '<script type="application/ld+json">' +
    JSON.stringify({"@context":"https://schema.org","@type":"Organization","name":"StudyReward","url":"https://studyreward.online","logo":"https://studyreward.online/assets/favicon.svg","description":"Find paid clinical trials near you and earn rewards while advancing medical research."}) +
    '</script>\n' +
    '<script type="application/ld+json">' +
    JSON.stringify({"@context":"https://schema.org","@type":"WebSite","name":"StudyReward","url":"https://studyreward.online","potentialAction":{"@type":"SearchAction","target":{"@type":"EntryPoint","urlTemplate":"https://studyreward.online/clinical-trials.html?q={search_term_string}"},"query-input":"required name=search_term_string"}}) +
    '</script>\n' +
    '<link rel="preconnect" href="https://www.googletagmanager.com">\n' +
    '<link rel="preconnect" href="https://www.clarity.ms">\n' +
    '<link rel="dns-prefetch" href="https://clinicaltrials.gov">\n\n' +

    '<script type="application/ld+json">' +
    JSON.stringify({"@context":"https://schema.org","@type":"CollectionPage","name":title,"description":metaDesc,"url":"https://studyreward.online/conditions/" + slug}) +
    '</script>\n' +
    '<script type="application/ld+json">' +
    JSON.stringify({"@context":"https://schema.org","@type":"MedicalCondition","name":name,"description":cond.description,"symptoms":cond.symptoms,"riskFactor":cond.riskFactors,"treatment":cond.treatment}) +
    '</script>\n' +
    '<script type="application/ld+json">' +
    JSON.stringify({"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
      {"@type":"ListItem","position":1,"name":"Home","item":"https://studyreward.online/"},
      {"@type":"ListItem","position":2,"name":"Conditions","item":"https://studyreward.online/conditions"},
      {"@type":"ListItem","position":3,"name":name,"item":"https://studyreward.online/conditions/" + slug}
    ]}) +
    '</script>\n' +
    '<script type="application/ld+json">' +
    JSON.stringify({"@context":"https://schema.org","@type":"FAQPage","mainEntity":(cond.faq || []).map(f => ({
      "@type":"Question","name":f.q,"acceptedAnswer":{"@type":"Answer","text":f.a}
    }))}) +
    '</script>\n\n' +

    '<link rel="stylesheet" href="../css/style.css">\n' +
    '</head>\n' +
    '<body data-page="condition" data-condition="' + slug + '" data-condition-name="' + escapeHTML(name) + '">\n\n' +

    '<a href="#main-content" class="skip-link">Skip to main content</a>\n\n' +

    '<header class="header">\n  <div class="container">\n' +
    '    <a href="../index.html" class="logo"><span class="logo-icon">SR</span>StudyReward</a>\n' +
    '    <div class="header-search"><input type="text" placeholder="Search trials..."><span class="hs-icon">&#128269;</span></div>\n' +
    '    <nav class="nav" role="navigation" aria-label="Main">\n' +
    '      <a href="../index.html">Home</a>\n' +
    '      <a href="../clinical-trials.html">Trials</a>\n' +
    '      <a href="../states.html">States</a>\n' +
    '      <a href="../cities.html">Cities</a>\n' +
    '      <a href="../conditions.html" class="active" aria-current="page">Conditions</a>\n' +
    '      <a href="../guides.html">Guides</a>\n' +
    '      <a href="../about.html">About</a>\n' +
    '      <a href="../contact.html">Contact</a>\n' +
    '    </nav>\n' +
    '    <button class="mobile-toggle" aria-label="Toggle menu"><span></span><span></span><span></span></button>\n' +
    '  </div>\n' +
    '  <div class="mobile-nav" role="navigation" aria-label="Mobile navigation">\n' +
    '    <div class="mobile-search"><input type="text" placeholder="Search trials..."></div>\n' +
    '    <a href="../index.html">Home</a>\n' +
    '    <a href="../clinical-trials.html">Clinical Trials</a>\n' +
    '    <a href="../states.html">Browse by State</a>\n' +
    '    <a href="../cities.html">Browse by City</a>\n' +
    '    <a href="../conditions.html" class="active" aria-current="page">' + escapeHTML(name) + '</a>\n' +
    '    <a href="../guides.html">Guides</a>\n' +
    '    <a href="../about.html">About</a>\n' +
    '    <a href="../contact.html">Contact</a>\n' +
    '  </div>\n</header>\n\n' +

    '<div class="breadcrumbs">\n  <div class="container">\n' +
    '    <a href="../index.html">Home</a><span class="sep">/</span>' +
    '    <a href="../conditions.html">Conditions</a><span class="sep">/</span>' +
    '    <span class="current">' + escapeHTML(name) + '</span>\n  </div>\n</div>\n\n' +

    '<section class="page-header" id="main-content">\n  <div class="container">\n' +
    '    <h1>' + icon + ' Paid ' + escapeHTML(name) + ' Clinical Trials</h1>\n' +
    '    <p>Browse recruiting ' + escapeHTML(name.toLowerCase()) + ' clinical trials across the United States. Find eligibility information, locations and research opportunities near you.</p>\n' +
    '  </div>\n</section>\n\n' +

    '<div class="stats-banner">\n  <div class="container">\n' +
    '    <div class="stats-grid">\n' +
    '      <div class="stat-item"><div class="stat-number" id="condition-results-count">Loading...</div><div class="stat-label">Active Studies</div></div>\n' +
    '      <div class="stat-item"><div class="stat-number">' + escapeHTML(name) + '</div><div class="stat-label">Condition</div></div>\n' +
    '    </div>\n  </div>\n</div>\n\n' +

    '<section class="section" id="condition-studies-section">\n  <div class="container">\n' +
    '    <h2>Active Clinical Trials for ' + escapeHTML(name) + '</h2>\n' +
    '    <p>Showing live studies from ClinicalTrials.gov. Data refreshes daily.</p>\n' +
    '    <div class="studies-grid" id="condition-studies-list"><div class="loading"><span class="spinner"></span>Loading studies...</div></div>\n' +
    '    <div id="condition-pagination"></div>\n  </div>\n</section>\n\n' +

    '<section class="section medical-disclaimer">\n  <div class="container">\n' +
    '    <p><strong>Disclaimer:</strong> This content is for educational purposes and is not medical advice. Always consult a qualified healthcare provider for medical guidance.</p>\n' +
    '  </div>\n</section>\n\n' +

    '<section class="section section-gray">\n  <div class="container">\n' +
    '    <h2>About ' + escapeHTML(name) + '</h2>\n' +
    '    <p>' + escapeHTML(cond.description) + '</p>\n' +
    '  </div>\n</section>\n\n' +

    '<section class="section">\n  <div class="container">\n' +
    '    <div class="cond-detail-grid">\n' +
    '      <div class="cond-detail-card">\n<h3>Common Symptoms</h3>\n<p>' + escapeHTML(cond.symptoms || '') + '</p>\n</div>\n' +
    '      <div class="cond-detail-card">\n<h3>Risk Factors</h3>\n<p>' + escapeHTML(cond.riskFactors || '') + '</p>\n</div>\n' +
    '      <div class="cond-detail-card">\n<h3>Treatment Overview</h3>\n<p>' + escapeHTML(cond.treatment || '') + '</p>\n</div>\n' +
    '      <div class="cond-detail-card">\n<h3>Why Participate?</h3>\n<p>' + escapeHTML(cond.whyParticipate || 'Participating in clinical trials helps advance medical research and provides access to cutting-edge treatments.') + '</p>\n</div>\n' +
    '    </div>\n  </div>\n</section>\n\n' +

    (relatedCondHtml ? '<section class="section">\n  <div class="container">\n' +
    '    <h2>Related Conditions</h2>\n' +
    '    <div class="conditions-grid" style="margin-top:16px">' + relatedCondHtml + '</div>\n  </div>\n</section>\n\n' : '') +

    (relatedStateHtml ? '<section class="section section-gray">\n  <div class="container">\n' +
    '    <h2>States with ' + escapeHTML(name) + ' Clinical Trials</h2>\n' +
    '    <div class="states-grid" style="margin-top:16px">' + relatedStateHtml + '</div>\n  </div>\n</section>\n\n' : '') +

    (relatedCityHtml ? '<section class="section">\n  <div class="container">\n' +
    '    <h2>Cities with ' + escapeHTML(name) + ' Clinical Trials</h2>\n' +
    '    <div class="cities-grid" style="margin-top:16px">' + relatedCityHtml + '</div>\n  </div>\n</section>\n\n' : '') +

    '<section class="section section-gray">\n  <div class="container">\n' +
    '    <h2>Frequently Asked Questions About ' + escapeHTML(name) + ' Clinical Trials</h2>\n' +
    '    <div class="faq-list" style="margin-top:16px">' + faqHtml + '</div>\n  </div>\n</section>\n\n' +

    '<footer class="footer">\n  <div class="container">\n' +
    '    <div class="footer-grid">\n' +
    '      <div class="footer-brand">\n' +
    '        <a href="../index.html" class="logo"><span class="logo-icon">SR</span>StudyReward</a>\n' +
    '        <p>Helping you find paid clinical trials across the United States.</p>\n' +
    '      </div>\n' +
    '      <div>\n<h4>Quick Links</h4>\n<div class="footer-links">\n' +
    '        <a href="../clinical-trials.html">Clinical Trials</a>\n' +
    '        <a href="../states.html">Browse by State</a>\n' +
    '        <a href="../cities.html">Browse by City</a>\n' +
    '        <a href="../conditions.html">Conditions</a>\n' +
    '        <a href="../guides.html">Guides</a>\n' +
    '      </div></div>\n' +
    '      <div>\n<h4>Categories</h4>\n<div class="footer-links">\n' +
    '        <a href="../clinical-trials.html?q=cardiology">Cardiology</a>\n' +
    '        <a href="../clinical-trials.html?q=neurology">Neurology</a>\n' +
    '        <a href="../clinical-trials.html?q=oncology">Oncology</a>\n' +
    '        <a href="../clinical-trials.html?q=mental">Mental Health</a>\n' +
    '      </div></div>\n' +
    '      <div>\n<h4>Company</h4>\n<div class="footer-links">\n' +
    '        <a href="../about.html">About Us</a>\n' +
    '        <a href="../contact.html">Contact</a>\n' +
    '        <a href="../privacy-policy.html">Privacy Policy</a>\n' +
    '        <a href="../terms-of-service.html">Terms of Service</a>\n' +
    '      </div></div>\n' +
    '    </div>\n' +
    '    <div class="footer-bottom">\n' +
    '      <span>&copy; 2026 StudyReward. All rights reserved.</span>\n' +
    '      <div class="footer-bottom-links">\n' +
    '        <a href="../privacy-policy.html">Privacy</a>\n' +
    '        <a href="../terms-of-service.html">Terms</a>\n' +
    '      </div>\n' +
    '      <div class="footer-disclaimer">StudyReward is a clinical trial directory for informational purposes only. We do not conduct trials or guarantee compensation. Always consult a healthcare professional.</div>\n' +
    '    </div>\n  </div>\n</footer>\n\n' +

    '<button class="back-to-top" aria-label="Back to top">&uarr;</button>\n\n' +
    '<script src="../js/main.js" defer></script>\n' +
    '<script src="../js/condition.js" defer></script>\n' +
    '</body>\n</html>';

  const filePath = path.join(outDir, slug + '.html');
  fs.writeFileSync(filePath, page, 'utf8');
  console.log('Generated conditions/' + slug + '.html');
});

console.log('Done. Generated ' + conditions.length + ' condition pages.');
