const fs = require('fs');
const path = require('path');

const cities = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'cities.json'), 'utf8'));
const states = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'states.json'), 'utf8'));

const stateAbbr = {};
states.forEach(s => { stateAbbr[s.name] = s.abbr; });
const stateSlug = {};
states.forEach(s => { stateSlug[s.name] = s.slug; });

function escapeHTML(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const outDir = path.join(__dirname, '..', 'cities');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

cities.forEach(city => {
  const name = city.name;
  const state = city.state;
  const slug = city.slug;
  const abbr = stateAbbr[state] || '';
  const stSlug = stateSlug[state] || '';

  // Nearby cities (same state, limit 6, exclude self)
  const nearby = cities.filter(c => c.state === state && c.slug !== slug).slice(0, 6);
  const nearbyHtml = nearby.length ? nearby.map(c =>
    '<a href="../cities/' + c.slug + '.html" class="city-card">' +
      '<h4>' + escapeHTML(c.name) + '</h4>' +
      '<div class="city-state">' + escapeHTML(c.state) + '</div>' +
      '<div class="city-count">View studies &rarr;</div></a>'
  ).join('') : '';

  const title = 'Paid Clinical Trials in ' + escapeHTML(name) + ', ' + escapeHTML(state) + ' (2026)';
  const metaDesc = 'Find paid clinical trials recruiting in ' + escapeHTML(name) + ', ' + escapeHTML(state) + '. Browse medical studies, compensation opportunities and research programs in ' + escapeHTML(name) + '.';
  const canonical = 'https://studyreward.online/cities/' + slug;

  const page = '<!DOCTYPE html>\n<html lang="en-US">\n<head>\n' +
    '<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>' + title + '</title>\n' +
    '<meta name="description" content="' + metaDesc + '">\n' +
    '<meta name="robots" content="index, follow">\n' +
    '<link rel="canonical" href="' + canonical + '">\n' +
    '<link rel="alternate" hreflang="en" href="' + canonical + '">\n' +
    '<link rel="icon" type="image/svg+xml" href="../assets/favicon.svg">\n' +
    '<link rel="apple-touch-icon" href="../assets/apple-touch-icon.svg">\n\n' +

    '<meta property="og:type" content="website">\n' +
    '<meta property="og:url" content="' + canonical + '">\n' +
    '<meta property="og:title" content="' + title + '">\n' +
    '<meta property="og:description" content="' + metaDesc + '">\n' +
    '<meta name="twitter:card" content="summary_large_image">\n' +
    '<meta name="twitter:title" content="' + title + '">\n' +
    '<meta name="twitter:description" content="' + metaDesc + '">\n' +
    '<meta property="og:image" content="https://studyreward.online/og-image.svg">\n' +
    '<meta property="og:site_name" content="StudyReward">\n\n' +

    '<!-- Google Analytics (replace G-XXXXXXXXXX with your GA4 ID) -->\n' +
    '<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"><\/script>\n' +
    '<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag(\'js\',new Date());gtag(\'config\',\'G-XXXXXXXXXX\');<\/script>\n\n' +
    '<!-- Clarity (replace with your Clarity ID) -->\n' +
    '<script>(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src=\'https://www.clarity.ms/tag/\'+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,\'clarity\',\'script\',\'YOUR_CLARITY_ID\');<\/script>\n\n' +

    '<script type="application/ld+json">' +
    JSON.stringify({"@context":"https://schema.org","@type":"CollectionPage","name":"Clinical Trials in " + name + ", " + state,"description":metaDesc,"url":canonical}) +
    '</script>\n' +
    '<script type="application/ld+json">' +
    JSON.stringify({"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
      {"@type":"ListItem","position":1,"name":"Home","item":"https://studyreward.online/"},
      {"@type":"ListItem","position":2,"name":"States","item":"https://studyreward.online/states.html"},
      {"@type":"ListItem","position":3,"name":state,"item":"https://studyreward.online/states/" + stSlug},
      {"@type":"ListItem","position":4,"name":name,"item":canonical}
    ]}) +
    '</script>\n' +
    '<script type="application/ld+json">' +
    JSON.stringify({"@context":"https://schema.org","@type":"FAQPage","mainEntity":[
      {"@type":"Question","name":"How can I join a clinical trial in " + name + "?","acceptedAnswer":{"@type":"Answer","text":"You can browse active studies on this page. Each study has a link to ClinicalTrials.gov where you can find contact information and apply directly through the study coordinator."}},
      {"@type":"Question","name":"How much do clinical trials pay in " + name + "?","acceptedAnswer":{"@type":"Answer","text":"Compensation varies by study duration, complexity, and sponsor. Many trials offer $50-$200 per visit, with total compensation ranging from a few hundred to several thousand dollars."}},
      {"@type":"Question","name":"Who can participate in clinical trials in " + name + "?","acceptedAnswer":{"@type":"Answer","text":"Eligibility depends on the specific study. Factors include age, gender, medical history, and current health status. Each study listing includes detailed eligibility criteria."}}
    ]}) +
    '</script>\n\n' +

    '<link rel="stylesheet" href="../css/style.css">\n' +
    '<link rel="icon" type="image/svg+xml" href="../assets/favicon.svg">\n' +
    '<link rel="apple-touch-icon" href="../assets/apple-touch-icon.svg">\n' +
    '</head>\n' +
    '<body data-page="city" data-city="' + slug + '" data-city-name="' + escapeHTML(name) + '" data-state="' + escapeHTML(state) + '">\n\n' +

    '<a href="#main-content" class="skip-link">Skip to main content</a>\n\n' +

    '<header class="header">\n  <div class="container">\n' +
    '    <a href="../index.html" class="logo"><span class="logo-icon">SR</span>StudyReward</a>\n' +
    '    <div class="header-search"><input type="text" placeholder="Search trials..."><span class="hs-icon">&#128269;</span></div>\n' +
    '    <nav class="nav" role="navigation" aria-label="Main">\n' +
    '      <a href="../index.html">Home</a>\n' +
    '      <a href="../clinical-trials.html">Trials</a>\n' +
    '      <a href="../states.html">States</a>\n' +
    '      <a href="../cities.html" class="active" aria-current="page">Cities</a>\n' +
    '      <a href="../guides.html">Guides</a>\n' +
    '      <a href="../about.html">About</a>\n' +
    '      <a href="../contact.html">Contact</a>\n' +
    '    </nav>\n' +
    '    <button class="mobile-toggle" aria-label="Toggle menu"><span></span><span></span><span></span></button>\n' +
    '  </div>\n' +
    '  <div class="mobile-nav">\n' +
    '    <div class="mobile-search"><input type="text" placeholder="Search trials..."></div>\n' +
    '    <a href="../index.html">Home</a>\n' +
    '    <a href="../clinical-trials.html">Clinical Trials</a>\n' +
    '    <a href="../states.html">Browse by State</a>\n' +
    '    <a href="../cities.html" class="active" aria-current="page">' + escapeHTML(name) + '</a>\n' +
    '    <a href="../guides.html">Guides</a>\n' +
    '    <a href="../about.html">About</a>\n' +
    '    <a href="../contact.html">Contact</a>\n' +
    '  </div>\n</header>\n\n' +

    '<div class="breadcrumbs">\n  <div class="container">\n' +
    '    <a href="../index.html">Home</a><span class="sep">/</span>' +
    '    <a href="../states.html">States</a><span class="sep">/</span>' +
    '    <a href="../states/' + stSlug + '.html">' + escapeHTML(state) + '</a><span class="sep">/</span>' +
    '    <span class="current">' + escapeHTML(name) + '</span>\n  </div>\n</div>\n\n' +

    '<section class="page-header" id="main-content">\n  <div class="container">\n' +
    '    <h1>Paid Clinical Trials in ' + escapeHTML(name) + '</h1>\n' +
    '    <p>Discover recruiting clinical trials in ' + escapeHTML(name) + ', ' + escapeHTML(state) + ' (' + abbr + '). Browse medical research studies, compare opportunities, and find paid clinical trials near you.</p>\n' +
    '  </div>\n</section>\n\n' +

    '<div class="stats-banner">\n  <div class="container">\n' +
    '    <div class="stats-grid">\n' +
    '      <div class="stat-item"><div class="stat-number" id="city-results-count">Loading...</div><div class="stat-label">Active Studies</div></div>\n' +
    '      <div class="stat-item"><div class="stat-number">' + escapeHTML(name) + '</div><div class="stat-label">City</div></div>\n' +
    '      <div class="stat-item"><div class="stat-number">' + escapeHTML(state) + '</div><div class="stat-label">State</div></div>\n' +
    '    </div>\n  </div>\n</div>\n\n' +

    '<section class="section" id="city-studies-section">\n  <div class="container">\n' +
    '    <h2>Active Clinical Trials in ' + escapeHTML(name) + '</h2>\n' +
    '    <p>Showing live studies from ClinicalTrials.gov. Data refreshes daily.</p>\n' +
    '    <div class="studies-grid" id="city-studies-list"><div class="loading"><span class="spinner"></span>Loading studies...</div></div>\n' +
    '    <div id="city-pagination"></div>\n  </div>\n</section>\n\n' +

    (nearbyHtml ? '<section class="section">\n  <div class="container">\n' +
    '    <h2>Nearby Cities with Clinical Trials</h2>\n' +
    '    <div class="cities-grid" style="margin-top:16px">' + nearbyHtml + '</div>\n  </div>\n</section>\n\n' : '') +

    '<section class="section">\n  <div class="container">\n' +
    '    <h2>Frequently Asked Questions About Clinical Trials in ' + escapeHTML(name) + '</h2>\n' +
    '    <div class="faq-list" style="margin-top:16px">\n' +
    '      <div class="faq-item open"><button class="faq-question">How can I join a clinical trial in ' + escapeHTML(name) + '?<span class="faq-icon">&#9660;</span></button><div class="faq-answer" style="max-height:200px"><div class="faq-answer-inner">You can browse active studies on this page. Each study has a link to ClinicalTrials.gov where you can find contact information and apply directly through the study coordinator.</div></div></div>\n' +
    '      <div class="faq-item"><button class="faq-question">How much do clinical trials pay in ' + escapeHTML(name) + '?<span class="faq-icon">&#9660;</span></button><div class="faq-answer" style="max-height:0"><div class="faq-answer-inner">Compensation varies by study duration, complexity, and sponsor. Many trials offer $50-$200 per visit, with total compensation ranging from a few hundred to several thousand dollars.</div></div></div>\n' +
    '      <div class="faq-item"><button class="faq-question">Who can participate in clinical trials in ' + escapeHTML(name) + '?<span class="faq-icon">&#9660;</span></button><div class="faq-answer" style="max-height:0"><div class="faq-answer-inner">Eligibility depends on the specific study. Factors include age, gender, medical history, and current health status. Each study listing includes detailed eligibility criteria.</div></div></div>\n' +
    '    </div>\n  </div>\n</section>\n\n' +

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
    '<script src="../js/city.js" defer></script>\n' +
    '</body>\n</html>';

  const filePath = path.join(outDir, slug + '.html');
  fs.writeFileSync(filePath, page, 'utf8');
  console.log('Generated cities/' + slug + '.html');
});

console.log('Done. Generated ' + cities.length + ' city pages.');
