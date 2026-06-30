const fs = require('fs');
const path = require('path');

const states = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'states.json'), 'utf8'));
const cities = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'cities.json'), 'utf8'));

const html = fs.readFileSync(path.join(__dirname, '..', 'states.html'), 'utf8');
const HEAD_MARKER = '<head>';
const BODY_MARKER = '<body data-page="states">';
const MAIN_START = '<section class="page-header"';
const MAIN_END = '</body>';

function escapeHTML(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Derive head template (just the <head> contents)
const headStart = html.indexOf('<head>');
const headEnd = html.indexOf('</head>');
const headTemplate = html.substring(headStart + '<head>'.length, headEnd);

// Everything from <body> to end
const bodyStart = html.indexOf('<body');
const bodyEnd = html.indexOf('</body>') + '</body>'.length;
const bodyTemplate = html.substring(bodyStart, bodyEnd);

// Breadcrumb and header template (between <body> and <section class="page-header")
const pageHeaderStart = html.indexOf('<section class="page-header"');
const preHeader = html.substring(bodyStart, pageHeaderStart);

// After page-header section up to <footer
const pageHeaderSection = html.substring(pageHeaderStart, html.indexOf('<section class="section">', pageHeaderStart));

// After states content up to footer start
const statesSectionStart = html.indexOf('<section class="section">', pageHeaderStart);
const footerStart = html.indexOf('<footer class="footer">', statesSectionStart);
const statesSection = html.substring(statesSectionStart, footerStart);

const footerSection = html.substring(footerStart, bodyEnd);

const outDir = path.join(__dirname, '..', 'states');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

states.forEach(st => {
  const slug = st.slug;
  const name = st.name;
  const abbr = st.abbr;
  const lower = name.toLowerCase();

  // Cities in this state
  const stateCities = cities.filter(c => c.state === name);
  const cityLinks = stateCities.slice(0, 6).map(c =>
    '<a href="https://studyreward.online/clinical-trials.html?city=' + escapeHTML(c.slug) + '" class="city-card">' +
      '<h4>' + escapeHTML(c.name) + '</h4>' +
      '<div class="city-state">' + escapeHTML(c.state) + '</div>' +
      '<div class="city-count">View studies &rarr;</div></a>'
  ).join('');

  // Build head
  const head = headTemplate
    .replace(/<title>.*?<\/title>/, '<title>Paid Clinical Trials in ' + escapeHTML(name) + ' (2026) | StudyReward</title>')
    .replace(/<meta name="description"[^>]*>/, '<meta name="description" content="Find paid clinical trials recruiting in ' + escapeHTML(name) + '. Browse medical research studies with compensation in ' + escapeHTML(name) + ' and discover clinical research opportunities near you.">')
    .replace(/<link rel="canonical"[^>]*>/, '<link rel="canonical" href="https://studyreward.online/states/' + slug + '">')
    .replace(/<meta property="og:url"[^>]*>/, '<meta property="og:url" content="https://studyreward.online/states/' + slug + '">')
    .replace(/<meta property="og:title"[^>]*>/, '<meta property="og:title" content="Paid Clinical Trials in ' + escapeHTML(name) + ' (2026) | StudyReward">')
    .replace(/<meta property="og:description"[^>]*>/, '<meta property="og:description" content="Find paid clinical trials recruiting in ' + escapeHTML(name) + '.">')
    .replace(/<meta name="twitter:title"[^>]*>/, '<meta name="twitter:title" content="Paid Clinical Trials in ' + escapeHTML(name) + ' (2026) | StudyReward">')
    .replace(/<meta name="twitter:description"[^>]*>/, '<meta name="twitter:description" content="Find paid clinical trials recruiting in ' + escapeHTML(name) + '.">')
    .replace(/href="(?!(?:https?:\/\/|\/\/|\.\.\/|#))([^"]+)"/g, 'href="../$1"')
    .replace(/src="(?!(?:https?:\/\/|\/\/|\.\.\/))([^"]+)"/g, 'src="../$1"');

  // Breadcrumb
  const breadcrumb = '<div class="breadcrumbs"><div class="container"><a href="../index.html">Home</a><span class="sep">/</span><a href="../states.html">States</a><span class="sep">/</span><span class="current">' + escapeHTML(name) + '</span></div></div>';

  // Page header
  const pageHeader = '<section class="page-header" id="main-content"><div class="container"><h1>Clinical Trials in ' + escapeHTML(name) + '</h1><p>Discover recruiting clinical trials in ' + escapeHTML(name) + ' (' + abbr + '). Browse medical research studies, compare compensation, and find opportunities near you.</p></div></section>';

  // Stats banner
  const statsBanner = '<div class="stats-banner"><div class="container"><div class="stats-grid"><div class="stat-item"><div class="stat-number" id="state-results-count">Loading...</div><div class="stat-label">Active Studies</div></div><div class="stat-item"><div class="stat-number">' + stateCities.length + '+</div><div class="stat-label">Cities</div></div><div class="stat-item"><div class="stat-number">' + escapeHTML(name) + '</div><div class="stat-label">State</div></div></div></div></div>';

  // Studies section
  const studiesSection = '<section class="section" id="state-studies-section"><div class="container"><h2>Active Clinical Trials in ' + escapeHTML(name) + '</h2><p>Showing live studies from ClinicalTrials.gov. Data refreshes daily.</p>' +
    '<div id="state-study-controls" style="margin-bottom:16px">' +
      '<input type="text" id="state-studies-search" placeholder="Search studies in ' + escapeHTML(name) + '..." aria-label="Search studies" style="width:100%;max-width:400px;padding:10px 14px;border:1px solid var(--gray-200);border-radius:var(--radius);font-size:.9rem;outline:none;font-family:inherit">' +
    '</div>' +
    '<div class="studies-grid" id="state-studies-list"><div class="loading"><span class="spinner"></span>Loading studies...</div></div>' +
    '<div id="state-pagination"></div></div></section>';

  // Cities section
  const citiesSection = stateCities.length ? '<section class="section"><div class="container"><h2>Cities in ' + escapeHTML(name) + ' with Clinical Trials</h2><div class="cities-grid" style="margin-top:16px">' + cityLinks + '</div></div></section>' : '';

  // FAQ section
  const faqSection = '<section class="section"><div class="container"><h2>Frequently Asked Questions About Clinical Trials in ' + escapeHTML(name) + '</h2><div class="faq-list" style="margin-top:16px">' +
    '<div class="faq-item open"><button class="faq-question">How do I find paid clinical trials in ' + escapeHTML(name) + '?<span class="faq-icon">&#9660;</span></button><div class="faq-answer" style="max-height:200px"><div class="faq-answer-inner">You can browse active studies on this page, search by condition or keyword, or visit ClinicalTrials.gov directly and filter by location ' + escapeHTML(name) + '.</div></div></div>' +
    '<div class="faq-item"><button class="faq-question">Are clinical trials in ' + escapeHTML(name) + ' compensated?<span class="faq-icon">&#9660;</span></button><div class="faq-answer" style="max-height:0"><div class="faq-answer-inner">Many clinical trials offer compensation for time and travel. The amount varies by study length, complexity, and sponsor. Check each study listing for details.</div></div></div>' +
    '<div class="faq-item"><button class="faq-question">How do I apply for a clinical trial in ' + escapeHTML(name) + '?<span class="faq-icon">&#9660;</span></button><div class="faq-answer" style="max-height:0"><div class="faq-answer-inner">Each study listing includes a link to the official ClinicalTrials.gov page where you can find contact information and enrollment details. You apply directly through the study coordinator.</div></div></div>' +
    '<div class="faq-item"><button class="faq-question">What types of clinical trials are available in ' + escapeHTML(name) + '?<span class="faq-icon">&#9660;</span></button><div class="faq-answer" style="max-height:0"><div class="faq-answer-inner">Studies cover various conditions and phases, from vaccine trials to chronic disease management. Use the search box above to filter by medical condition or keyword.</div></div></div>' +
  '</div></div></section>';

  // JSON-LD schemas
  const jsonld = '<script type="application/ld+json">' +
    JSON.stringify({"@context":"https://schema.org","@type":"CollectionPage","name":"Clinical Trials in " + name,"description":"Find paid clinical trials in " + name + ". Browse medical research studies recruiting in " + name + ".","url":"https://studyreward.online/states/" + slug}) +
    '</script>' +
    '<script type="application/ld+json">' +
    JSON.stringify({"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
      {"@type":"ListItem","position":1,"name":"Home","item":"https://studyreward.online/"},
      {"@type":"ListItem","position":2,"name":"States","item":"https://studyreward.online/states.html"},
      {"@type":"ListItem","position":3,"name":name,"item":"https://studyreward.online/states/" + slug}
    ]}) +
    '</script>';

  const finalHtml = '<!DOCTYPE html>\n<html lang="en">\n<head>\n' + head + '\n' + jsonld +
    '\n</head>\n<body data-page="state" data-state="' + escapeHTML(name) + '" data-state-abbr="' + abbr + '">\n\n' +
    '  <a href="#main-content" class="skip-link">Skip to main content</a>\n\n' +
    '  <header class="header">\n    <div class="container">\n' +
    '      <a href="../index.html" class="logo"><span class="logo-icon">SR</span>StudyReward</a>\n' +
    '      <div class="header-search"><input type="text" placeholder="Search trials..."><span class="hs-icon">&#128269;</span></div>\n' +
    '      <nav class="nav" role="navigation" aria-label="Main">\n' +
    '        <a href="../index.html">Home</a>\n' +
    '        <a href="../clinical-trials.html">Trials</a>\n' +
    '        <a href="../states.html" class="active" aria-current="page">States</a>\n' +
    '        <a href="../cities.html">Cities</a>\n' +
    '        <a href="../guides.html">Guides</a>\n' +
    '        <a href="../about.html">About</a>\n' +
    '        <a href="../contact.html">Contact</a>\n' +
    '      </nav>\n' +
    '      <button class="mobile-toggle" aria-label="Toggle menu"><span></span><span></span><span></span></button>\n' +
    '    </div>\n' +
    '    <div class="mobile-nav">\n' +
    '      <div class="mobile-search"><input type="text" placeholder="Search trials..."></div>\n' +
    '      <a href="../index.html">Home</a>\n' +
    '      <a href="../clinical-trials.html">Clinical Trials</a>\n' +
    '      <a href="../states.html" class="active" aria-current="page">' + escapeHTML(name) + '</a>\n' +
    '      <a href="../cities.html">Browse by City</a>\n' +
    '      <a href="../guides.html">Guides</a>\n' +
    '      <a href="../about.html">About</a>\n' +
    '      <a href="../contact.html">Contact</a>\n' +
    '    </div>\n  </header>\n\n' +
    breadcrumb + '\n\n' +
    pageHeader + '\n\n' +
    statsBanner + '\n\n' +
    studiesSection + '\n\n' +
    citiesSection + '\n\n' +
    faqSection + '\n\n' +
    footerSection.replace(/href="(?!http)(?!\/\/)([^"]+)"/g, (m, p1) => {
      if (p1.startsWith('../')) return m;
      if (p1.startsWith('#')) return m;
      return 'href="../' + p1 + '"';
    }).replace(/src="(?!http)(?!\/\/)([^"]+)"/g, (m, p1) => {
      if (p1.startsWith('../')) return m;
      return 'src="../' + p1 + '"';
    }) +
    '\n  <button class="back-to-top" aria-label="Back to top">&uarr;</button>\n\n' +
    '  <script src="../js/main.js" defer></script>\n' +
    '  <script src="../js/state.js" defer></script>\n' +
    '</body>\n</html>';

  const filePath = path.join(outDir, slug + '.html');
  fs.writeFileSync(filePath, finalHtml, 'utf8');
  console.log('Generated states/' + slug + '.html');
});

console.log('Done. Generated ' + states.length + ' state pages.');
