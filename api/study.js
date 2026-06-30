const SITE = 'https://studyreward.online';
const API_BASE = 'https://clinicaltrials.gov/api/v2/studies';

const FMT = { month:'short',year:'numeric' };
function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-US', FMT);
}
function fmtPhase(p) {
  if (!p) return 'N/A';
  const m = { PHASE1:'Phase 1',PHASE2:'Phase 2',PHASE3:'Phase 3',PHASE4:'Phase 4',
    'PHASE1|PHASE2':'Phase 1/2','PHASE2|PHASE3':'Phase 2/3','NA':'N/A' };
  return m[p] || p.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
}
function fmtStatus(s) {
  if (!s) return 'Unknown';
  return s.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
}
function escape(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function nz(v, fallback='') { return (v && v !== 'N/A') ? v : fallback; }

function renderError(title, msg) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${escape(title)} | StudyReward</title><link rel="icon" type="image/svg+xml" href="../assets/favicon.svg"><link rel="stylesheet" href="../css/style.css"></head><body><a href="#main" class="skip-link">Skip to main content</a>
<header class="header"><div class="container"><a href="../index.html" class="logo"><span class="logo-icon">SR</span>StudyReward</a><nav class="nav" role="navigation" aria-label="Main"><a href="../index.html">Home</a><a href="../clinical-trials.html">Trials</a><a href="../states.html">States</a><a href="../cities.html">Cities</a><a href="../conditions.html">Conditions</a><a href="../guides.html">Guides</a></nav><button class="mobile-toggle" aria-label="Toggle menu"><span></span><span></span><span></span></button></div></header>
<main id="main"><div class="container page-404"><div class="code">!</div><h1>${escape(title)}</h1><p>${escape(msg || 'The requested page could not be loaded.')}</p><a href="../index.html" class="btn btn-primary">Go Home</a></div></main>
<footer class="footer"><div class="container"><div class="footer-grid"><div class="footer-brand"><a href="../index.html" class="logo"><span class="logo-icon">SR</span>StudyReward</a><p>Helping you find paid clinical trials across the United States.</p></div></div><div class="footer-bottom"><span>&copy; 2026 StudyReward. All rights reserved.</span></div></div></footer></body></html>`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { nctId } = req.query;
  if (!nctId || !/^NCT\d{8}$/i.test(nctId)) {
    return res.status(400).send(renderError('Invalid Study ID', 'Please provide a valid NCT identifier.'));
  }

  try {
    const resp = await fetch(`${API_BASE}/${nctId.toUpperCase()}?format=json`);
    if (!resp.ok) {
      if (resp.status === 404) return res.status(404).send(renderError('Study Not Found', 'This clinical trial could not be found. It may not exist or have been removed.'));
      const txt = await resp.text().catch(()=>'');
      return res.status(502).send(renderError('Service Unavailable', 'The clinical trial data service is temporarily unavailable.'));
    }

    const data = await resp.json();
    const s = data.study;
    if (!s || !s.protocolSection) return res.status(404).send(renderError('Study Not Found'));

    const p = s.protocolSection;
    const idMod = p.identificationModule || {};
    const stMod = p.statusModule || {};
    const scMod = p.sponsorCollaboratorsModule || {};
    const descMod = p.descriptionModule || {};
    const condMod = p.conditionsModule || {};
    const dsgnMod = p.designModule || {};
    const eligMod = p.eligibilityModule || {};
    const clMod = p.contactsLocationsModule || {};
    const derMod = (s.derivedSection || {}).miscellaneousModule || {};

    const nctIdVal = idMod.nctId || nctId.toUpperCase();
    const briefTitle = idMod.briefTitle || 'Untitled Study';
    const officialTitle = idMod.officialTitle || '';
    const briefSummary = descMod.briefSummary || '';
    const detailedDescription = descMod.detailedDescription || '';
    const overallStatus = stMod.overallStatus || 'UNKNOWN';
    const conditions = condMod.conditions || [];
    const studyType = dsgnMod.studyType || '';
    const phases = dsgnMod.phases || [];
    const enrollmentInfo = dsgnMod.enrollmentInfo || {};
    const leadSponsor = (scMod.leadSponsor || {}).name || 'Unknown';
    const collaborators = scMod.collaborators || [];
    const startDate = stMod.startDateStruct ? stMod.startDateStruct.date : '';
    const primaryCompletionDate = stMod.primaryCompletionDateStruct ? stMod.primaryCompletionDateStruct.date : '';
    const completionDate = stMod.completionDateStruct ? stMod.completionDateStruct.date : '';
    const lastUpdate = derMod.lastUpdatePostDate || '';
    const eligibilityCriteria = eligMod.eligibilityCriteria || '';
    const healthyVolunteers = eligMod.healthyVolunteers;
    const gender = eligMod.gender || '';
    const minAge = eligMod.minimumAge || '';
    const maxAge = eligMod.maximumAge || '';
    const locations = clMod.locations || [];
    const centralContacts = clMod.centralContacts || [];
    const overallOfficials = clMod.overallOfficials || [];

    const conditionsStr = conditions.length ? conditions.join(', ') : 'N/A';
    const condSlug = conditions.length ? conditions[0].toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') : '';
    const phaseStr = phases.map(fmtPhase).join(', ') || 'N/A';
    const enrollmentCount = enrollmentInfo.count || '';
    const enrollmentType = enrollmentInfo.type ? enrollmentInfo.type.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) : '';

    const firstLoc = locations[0] || {};
    const firstState = firstLoc.state || '';
    const firstCity = firstLoc.city || '';
    const stateSlug = firstState.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');

    // Parse eligibility criteria
    let inclusionCriteria = '';
    let exclusionCriteria = '';
    if (eligibilityCriteria) {
      const inclMatch = eligibilityCriteria.match(/Inclusion Criteria\s*:([\s\S]*?)(?=Exclusion Criteria\s*:|$)/i);
      const exclMatch = eligibilityCriteria.match(/Exclusion Criteria\s*:([\s\S]*)$/i);
      if (inclMatch) inclusionCriteria = inclMatch[1].trim();
      if (exclMatch) exclusionCriteria = exclMatch[1].trim();
      if (!inclMatch && !exclMatch) {
        inclusionCriteria = eligibilityCriteria;
      }
    }

    const pageTitle = `${briefTitle} | ${conditionsStr} Clinical Trial | StudyReward`;
    const pageDesc = `View eligibility, locations, sponsor information and recruitment status for this ${conditionsStr.toLowerCase()} clinical trial (${nctIdVal}).`;
    const canonical = `${SITE}/study/${nctIdVal}`;

    const jsonLd = [
      {
        "@context":"https://schema.org",
        "@type":["MedicalStudy","ClinicalTrial"],
        "@id": canonical,
        "name": briefTitle,
        "description": briefSummary.slice(0,300),
        "url": canonical,
        "status": `https://schema.org/${overallStatus === 'RECRUITING' ? 'ActiveNotRecruiting' : overallStatus === 'COMPLETED' ? 'Completed' : overallStatus === 'ACTIVE_NOT_RECRUITING' ? 'ActiveNotRecruiting' : overallStatus === 'ENROLLING_BY_INVITATION' ? 'ActiveNotRecruiting' : 'Unknown'}`,
        "sponsor": {
          "@type":"Organization",
          "name": leadSponsor
        },
        "studyLocation": locations.map(l => ({
          "@type":"MedicalClinic",
          "name": l.facility || '',
          "address": {
            "@type":"PostalAddress",
            "addressLocality": l.city || '',
            "addressRegion": l.state || '',
            "addressCountry": l.country || 'US'
          }
        })),
        "healthCondition": conditions.map(c => ({
          "@type":"MedicalCondition",
          "name": c
        })),
        "phase": phases.length ? phases.map(p => fmtPhase(p)).join(', ') : undefined
      },
      {
        "@context":"https://schema.org","@type":"BreadcrumbList",
        "itemListElement":[
          {"@type":"ListItem","position":1,"name":"Home","item":`${SITE}/`},
          {"@type":"ListItem","position":2,"name":"Clinical Trials","item":`${SITE}/clinical-trials.html`},
          {"@type":"ListItem","position":3,"name":nctIdVal,"item":canonical}
        ]
      },
      {
        "@context":"https://schema.org","@type":"FAQPage",
        "mainEntity":[
          {"@type":"Question","name":"What is this clinical trial about?","acceptedAnswer":{"@type":"Answer","text":briefSummary.slice(0,500)}},
          {"@type":"Question","name":"Who can participate in this study?","acceptedAnswer":{"@type":"Answer","text":`This study seeks participants${minAge ? ` aged ${minAge}` : ''}${maxAge ? ` to ${maxAge}` : ''}${gender ? `, ${gender.toLowerCase()}` : ''}${healthyVolunteers ? '. Healthy volunteers are accepted' : ''}. Specific inclusion and exclusion criteria apply.`}},
          {"@type":"Question","name":"Where is this study located?","acceptedAnswer":{"@type":"Answer","text":locations.length ? `The study is available at ${locations.length} location(s) including ${firstLoc.facility || firstLoc.city || ''} in ${firstCity ? firstCity + ', ' : ''}${firstState}.` : 'Contact the research team for location details.'}},
          {"@type":"Question","name":"How do I contact the research team?","acceptedAnswer":{"@type":"Answer","text":centralContacts.length ? `Contact ${centralContacts[0].name || 'the research team'} at ${centralContacts[0].phone || ''} or ${centralContacts[0].email || ''}` : 'Use the contact information listed in the Locations section or visit ClinicalTrials.gov for more details.'}}
        ]
      }
    ];

    const tocItems = [];
    if (briefSummary || officialTitle) tocItems.push('study-information');
    if (eligibilityCriteria) tocItems.push('eligibility');
    if (locations.length) tocItems.push('locations');
    if (centralContacts.length || overallOfficials.length) tocItems.push('contacts');
    tocItems.push('timeline');
    tocItems.push('related-studies');
    tocItems.push('faq');

    function tocLabel(id) {
      const m = {
        'study-information':'Study Information','eligibility':'Eligibility',
        'locations':'Locations','contacts':'Contacts',
        'timeline':'Timeline','related-studies':'Related Studies','faq':'FAQ'
      };
      return m[id] || id;
    }

    function renderTOC() {
      return tocItems.map(id => `<a href="#${id}" class="toc-item">${tocLabel(id)}</a>`).join('');
    }

    function renderLocations() {
      if (!locations.length) return '';
      let html = '<div class="sd-section" id="locations"><h2>Study Locations</h2><div class="study-locations">';
      locations.forEach(l => {
        const addr = [l.facility, l.city, l.state, l.zip].filter(Boolean).join(', ');
        const mapsUrl = addr ? `https://www.google.com/maps/search/${encodeURIComponent(addr)}` : '';
        html += `<div class="loc-card"><div class="loc-header"><span class="badge badge-${(l.status||'unknown').toLowerCase().replace(/[^a-z]/g,'')}">${fmtStatus(l.status)}</span></div>
          <div class="loc-name">${escape(l.facility || 'Facility')}</div>
          <div class="loc-addr">${escape([l.city, l.state, l.zip].filter(Boolean).join(', '))}</div>
          <div class="loc-country">${escape(l.country || 'United States')}</div>
          ${mapsUrl ? `<a href="${mapsUrl}" class="btn-link" target="_blank" rel="noopener">View on Google Maps &rarr;</a>` : ''}
        </div>`;
      });
      html += '</div></div>';
      return html;
    }

    function renderContacts() {
      const hasContacts = centralContacts.length || overallOfficials.length;
      if (!hasContacts) return '';
      let html = '<div class="sd-section" id="contacts"><h2>Study Contacts</h2>';
      if (overallOfficials.length) {
        html += '<div class="contacts-list">';
        overallOfficials.forEach(o => {
          if (!o.name) return;
          html += `<div class="contact-card"><strong>${escape(o.name)}</strong>`;
          if (o.role) html += `<br><span class="contact-role">${o.role.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</span>`;
          if (o.affiliation) html += `<br><span class="contact-affil">${escape(o.affiliation)}</span>`;
          html += '</div>';
        });
        html += '</div>';
      }
      if (centralContacts.length) {
        html += '<div class="contacts-list" style="margin-top:12px">';
        centralContacts.forEach(c => {
          if (!c.name && !c.phone && !c.email) return;
          html += '<div class="contact-card">';
          if (c.name) html += `<strong>${escape(c.name)}</strong><br>`;
          if (c.phone) html += `<span class="contact-phone">&#128222; ${escape(c.phone)}</span><br>`;
          if (c.email) html += `<a href="mailto:${escape(c.email)}" class="contact-email">${escape(c.email)}</a>`;
          html += '</div>';
        });
        html += '</div>';
      }
      html += '</div>';
      return html;
    }

    function renderTimeline() {
      const items = [
        {label:'Study Start', date: startDate, icon:'&#128197;'},
        {label:'Recruiting', date: overallStatus === 'RECRUITING' ? 'Ongoing' : (stMod.startDateStruct ? stMod.startDateStruct.date : ''), icon:'&#128200;'},
        {label:'Primary Completion', date: primaryCompletionDate, icon:'&#127919;'},
        {label:'Study Completion', date: completionDate, icon:'&#128226;'}
      ];
      return `<div class="sd-section" id="timeline"><h2>Study Timeline</h2><div class="study-timeline">${items.map((it,i) => `<div class="tl-item${i===0?' active':''}"><div class="tl-dot"></div><div class="tl-content"><div class="tl-label">${it.label}</div><div class="tl-date">${fmtDate(it.date) || 'TBD'}</div></div></div>`).join('')}</div></div>`;
    }

    function renderEligibility() {
      let html = '<div class="sd-section" id="eligibility"><h2>Eligibility Criteria</h2><div class="elig-summary"><div class="elig-item"><strong>Age:</strong> ' + escape(nz(minAge,'Not Specified'));
      if (maxAge) html += ' - ' + escape(maxAge);
      html += '</div><div class="elig-item"><strong>Gender:</strong> ' + escape(nz(gender,'All')) + '</div>';
      html += '<div class="elig-item"><strong>Healthy Volunteers:</strong> ' + (healthyVolunteers ? 'Accepted' : 'Not Accepted') + '</div></div>';
      if (inclusionCriteria) {
        html += `<div class="elig-collapse"><button class="elig-toggle" aria-expanded="true" aria-controls="inclusion-criteria">Inclusion Criteria <span class="elig-icon">&#9660;</span></button>
          <div id="inclusion-criteria" class="elig-content open"><ul>${inclusionCriteria.split('\n').filter(l=>l.trim()).map(l=>`<li>${escape(l.replace(/^[-*•]\s*/,''))}</li>`).join('')}</ul></div></div>`;
      }
      if (exclusionCriteria) {
        html += `<div class="elig-collapse"><button class="elig-toggle" aria-expanded="true" aria-controls="exclusion-criteria">Exclusion Criteria <span class="elig-icon">&#9660;</span></button>
          <div id="exclusion-criteria" class="elig-content open"><ul>${exclusionCriteria.split('\n').filter(l=>l.trim()).map(l=>`<li>${escape(l.replace(/^[-*•]\s*/,''))}</li>`).join('')}</ul></div></div>`;
      }
      html += '</div>';
      return html;
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${escape(pageTitle)}</title>
<meta name="description" content="${escape(pageDesc)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${canonical}">
<link rel="icon" type="image/svg+xml" href="../assets/favicon.svg">
<link rel="apple-touch-icon" href="../assets/apple-touch-icon.svg">

<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
<meta property="og:title" content="${escape(pageTitle)}">
<meta property="og:description" content="${escape(pageDesc)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escape(pageTitle)}">
<meta name="twitter:description" content="${escape(pageDesc)}">
<meta property="og:image" content="${SITE}/og-image.svg">
<meta property="og:site_name" content="StudyReward">

<script type="application/ld+json">${JSON.stringify(jsonLd[0])}</script>
<script type="application/ld+json">${JSON.stringify(jsonLd[1])}</script>
<script type="application/ld+json">${JSON.stringify(jsonLd[2])}</script>

<link rel="stylesheet" href="../css/style.css">
</head>
<body data-page="study" data-study-id="${escape(nctIdVal)}" data-condition="${escape(condSlug)}" data-condition-name="${escape(conditionsStr)}" data-state="${escape(stateSlug)}" data-city="${escape(firstCity)}" data-sponsor="${escape(leadSponsor)}">

<a href="#main-content" class="skip-link">Skip to main content</a>

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
      <a href="../guides.html">Guides</a>
      <a href="../about.html">About</a>
      <a href="../contact.html">Contact</a>
    </nav>
    <button class="mobile-toggle" aria-label="Toggle menu"><span></span><span></span><span></span></button>
  </div>
  <div class="mobile-nav">
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
</header>

<div class="breadcrumbs">
  <div class="container">
    <a href="../index.html">Home</a><span class="sep">/</span>
    <a href="../clinical-trials.html">Clinical Trials</a><span class="sep">/</span>
    <span class="current">${escape(nctIdVal)}</span>
  </div>
</div>

<section class="study-hero" id="main-content">
  <div class="container">
    <div class="sh-top">
      <span class="badge badge-${overallStatus.toLowerCase().replace(/[^a-z]/g,'')}">${escape(fmtStatus(overallStatus))}</span>
      <span class="sh-condition">${conditions.length ? conditions.map(c => `<a href="../conditions/${c.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')}.html" class="sh-cond-link">${escape(c)}</a>`).join(', ') : ''}</span>
    </div>
    <h1>${escape(briefTitle)}</h1>
    <div class="sh-meta">
      <div class="sh-meta-item"><span class="sh-meta-label">Phase</span><span class="sh-meta-value">${escape(phaseStr)}</span></div>
      <div class="sh-meta-item"><span class="sh-meta-label">Sponsor</span><span class="sh-meta-value">${escape(leadSponsor)}</span></div>
      <div class="sh-meta-item"><span class="sh-meta-label">NCT ID</span><span class="sh-meta-value" id="nct-id-value">${escape(nctIdVal)}</span></div>
    </div>
    <div class="sh-actions">
      <button class="btn btn-sm btn-outline" id="copy-nct-btn" aria-label="Copy NCT ID to clipboard">&#128203; Copy ID</button>
      <button class="btn btn-sm btn-outline" id="share-study-btn" aria-label="Share this study">&#128257; Share</button>
      <button class="btn btn-sm btn-outline" id="print-study-btn" aria-label="Print this page">&#128424; Print</button>
    </div>
  </div>
</section>

<div class="container">
  <div class="study-layout">
    <main class="study-main">
      ${(briefSummary || officialTitle) ? `<div class="sd-section" id="study-information"><h2>Study Information</h2>
        ${officialTitle ? `<div class="si-item"><h3>Official Title</h3><p>${escape(officialTitle)}</p></div>` : ''}
        ${briefSummary ? `<div class="si-item"><h3>Brief Summary</h3><p>${escape(briefSummary)}</p></div>` : ''}
        ${detailedDescription ? `<div class="si-item"><h3>Detailed Description</h3><p>${escape(detailedDescription)}</p></div>` : ''}
        <div class="si-grid">
          <div class="si-item"><h3>Study Type</h3><p>${escape(studyType.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) || 'N/A')}</p></div>
          <div class="si-item"><h3>Phase</h3><p>${escape(phaseStr)}</p></div>
          <div class="si-item"><h3>Status</h3><p>${escape(fmtStatus(overallStatus))}</p></div>
          <div class="si-item"><h3>Enrollment</h3><p>${enrollmentCount ? escape(enrollmentCount + (enrollmentType ? ' (' + enrollmentType + ')' : '')) : 'N/A'}</p></div>
          <div class="si-item"><h3>Sponsor</h3><p>${escape(leadSponsor)}</p></div>
          ${collaborators.length ? `<div class="si-item"><h3>Collaborators</h3><p>${collaborators.map(c => escape(c.name || '')).join(', ')}</p></div>` : ''}
          <div class="si-item"><h3>Start Date</h3><p>${fmtDate(startDate) || 'N/A'}</p></div>
          <div class="si-item"><h3>Completion Date</h3><p>${fmtDate(completionDate) || 'N/A'}</p></div>
          <div class="si-item"><h3>Last Update</h3><p>${fmtDate(lastUpdate) || 'N/A'}</p></div>
        </div>
      </div>` : ''}

      ${eligibilityCriteria ? renderEligibility() : ''}

      ${renderLocations()}

      ${renderContacts()}

      ${renderTimeline()}

      <div class="sd-section" id="related-studies"><h2>Related Studies</h2><div id="related-studies-list"><div class="loading"><span class="spinner"></span>Loading related studies...</div></div></div>

      <div class="sd-section" id="faq"><h2>Frequently Asked Questions</h2><div class="faq-list">
        <div class="faq-item open"><button class="faq-question">What is this clinical trial about?<span class="faq-icon">&#9660;</span></button><div class="faq-answer" style="max-height:200px"><div class="faq-answer-inner">${escape(briefSummary.slice(0,500))}</div></div></div>
        <div class="faq-item"><button class="faq-question">Who can participate?<span class="faq-icon">&#9660;</span></button><div class="faq-answer" style="max-height:0"><div class="faq-answer-inner">This study seeks participants${minAge ? ` aged ${escape(minAge)}` : ''}${maxAge ? ` to ${escape(maxAge)}` : ''}${gender ? `, ${escape(gender.toLowerCase())}` : ''}${healthyVolunteers ? '. Healthy volunteers are accepted' : ''}. Specific inclusion and exclusion criteria apply. Review the full eligibility section above for details.</div></div></div>
        <div class="faq-item"><button class="faq-question">Where is the study located?<span class="faq-icon">&#9660;</span></button><div class="faq-answer" style="max-height:0"><div class="faq-answer-inner">${locations.length ? `The study has ${locations.length} location(s) including ${escape(firstLoc.facility || firstLoc.city || 'various sites')}.` : 'Contact the research team for location details.'}</div></div></div>
        <div class="faq-item"><button class="faq-question">How do I contact the research team?<span class="faq-icon">&#9660;</span></button><div class="faq-answer" style="max-height:0"><div class="faq-answer-inner">${centralContacts.length ? `Contact ${escape(centralContacts[0].name || 'the research team')} at ${escape(centralContacts[0].phone || '')} or <a href="mailto:${escape(centralContacts[0].email || '')}">${escape(centralContacts[0].email || '')}</a>.` : 'For more information, visit the official listing on ClinicalTrials.gov using the NCT ID provided above.'}</div></div></div>
      </div></div>
    </main>

    <aside class="study-sidebar" role="complementary" aria-label="Study tools and related content">
      <div class="sidebar-card toc-card">
        <h3>On This Page</h3>
        <nav class="toc-nav" aria-label="Table of contents">${renderTOC()}</nav>
      </div>
      <div class="sidebar-card">
        <h3>Study ID</h3>
        <div class="study-id-card"><code id="sidebar-nct-id">${escape(nctIdVal)}</code><button class="btn btn-sm" id="sidebar-copy-btn" aria-label="Copy">Copy</button></div>
      </div>
      <div class="sidebar-card">
        <h3>Related Guides</h3>
        <div class="sidebar-links">
          <a href="../guides.html">Clinical Trial Guide</a>
          <a href="../guides.html">Eligibility Guide</a>
          <a href="../guides.html">How Clinical Trials Work</a>
          <a href="../guides.html">Clinical Trial Safety</a>
        </div>
      </div>
      <div class="sidebar-card">
        <h3>Quick Links</h3>
        <div class="sidebar-links">
          <a href="../clinical-trials.html">All Clinical Trials</a>
          ${firstState ? `<a href="../states/${stateSlug}.html">${escape(firstState)} Studies</a>` : ''}
          ${firstCity ? `<a href="../cities/${firstCity.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')}.html">${escape(firstCity)} Studies</a>` : ''}
          ${condSlug ? `<a href="../conditions/${condSlug}.html">${escape(conditionsStr)} Studies</a>` : ''}
        </div>
      </div>
    </aside>
  </div>
</div>

<footer class="footer">
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
        <h4>Conditions</h4>
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
</footer>

<script src="../js/study.js"></script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600');
    res.status(200).send(html);
  } catch (err) {
    res.status(502).send(renderError('Failed to load study', err.message));
  }
}
