const fs = require('fs');
const path = require('path');

function findHtmlFiles(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') {
        results = results.concat(findHtmlFiles(fullPath));
      }
    } else if (entry.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

const issues = [];
function report(type, file, msg) {
  issues.push({ type, file, msg });
  console.log(`  [${type}] ${file}: ${msg}`);
}

// Scan all HTML files
const htmlFiles = findHtmlFiles('.');
console.log(`Scanning ${htmlFiles.length} HTML files...\n`);

// Track stats
const metaDescs = {};
const titles = {};
const canonicalUrls = {};

htmlFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lower = content.toLowerCase();

  // Check for <title>
  const titleMatch = content.match(/<title>([^<]*)<\/title>/i);
  if (titleMatch) {
    const t = titleMatch[1].trim();
    if (!titles[t]) titles[t] = [];
    titles[t].push(file);
  } else {
    report('CRITICAL', file, 'Missing <title> tag');
  }

  // Check meta description
  const descMatch = content.match(/<meta\s+name=["']description["']\s+content="([^"]*)"/i);
  if (descMatch) {
    const d = descMatch[1];
    if (d.length > 160) report('WARN', file, `Meta description too long (${d.length} chars): "${d.slice(0,80)}..."`);
    if (d.length < 50) report('WARN', file, `Meta description too short (${d.length} chars): "${d}"`);
    if (!metaDescs[d]) metaDescs[d] = [];
    metaDescs[d].push(file);
  } else {
    report('CRITICAL', file, 'Missing meta description');
  }

  // Check canonical
  const canonMatch = content.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i);
  if (!canonMatch) {
    report('CRITICAL', file, 'Missing canonical link');
  } else {
    const url = canonMatch[1];
    if (!canonicalUrls[url]) canonicalUrls[url] = [];
    canonicalUrls[url].push(file);
  }

  // Check OG tags
  if (!content.match(/<meta\s+property=["']og:title["']/i)) report('WARN', file, 'Missing og:title');
  if (!content.match(/<meta\s+property=["']og:description["']/i)) report('WARN', file, 'Missing og:description');
  if (!content.match(/<meta\s+property=["']og:url["']/i)) report('WARN', file, 'Missing og:url');
  if (!content.match(/<meta\s+property=["']og:type["']/i)) report('WARN', file, 'Missing og:type');
  if (!content.match(/<meta\s+property=["']og:image["']/i)) report('WARN', file, 'Missing og:image');

  // Check Twitter Cards
  if (!content.match(/<meta\s+name=["']twitter:card["']/i)) report('WARN', file, 'Missing twitter:card');
  if (!content.match(/<meta\s+name=["']twitter:title["']/i)) report('WARN', file, 'Missing twitter:title');

  // Check hreflang
  if (!content.match(/<link\s+rel=["']alternate["']\s+hreflang=["']en["']/i) &&
      !content.match(/<link\s+rel=["']alternate["']\s+hreflang=["']en-US["']/i)) {
    report('WARN', file, 'Missing hreflang');
  }

  // Check robots
  if (!content.match(/<meta\s+name=["']robots["']/i)) report('WARN', file, 'Missing robots meta');
  if (!content.match(/lang=["']en["']/i) && !content.match(/lang=["']en-US["']/i)) {
    report('WARN', file, 'Missing lang attribute on <html>');
  }

  // Check JSON-LD
  const jsonlds = content.match(/<script\s+type=["']application\/ld\+json["']>/g);
  if (!jsonlds) {
    report('WARN', file, 'No JSON-LD structured data found');
  } else {
    // Check for required schema types
    if (!content.match(/"@type":\s*"Organization"/) && !content.match(/"@type":"Organization"/)) report('WARN', file, 'Missing Organization schema');
    if (!content.match(/"@type":\s*"BreadcrumbList"/) && !content.match(/"@type":"BreadcrumbList"/)) report('WARN', file, 'Missing BreadcrumbList schema');
  }

  // Check for disallowed index
  if (content.match(/noindex/i)) report('WARN', file, 'Has noindex directive');

  // Check skip link
  if (!content.match(/class=["']skip-link["']/i)) report('WARN', file, 'Missing skip-to-content link');

  // Check viewport
  if (!content.match(/name=["']viewport["']/i)) report('CRITICAL', file, 'Missing viewport meta tag');

  // Check for h1
  const h1s = content.match(/<h1[^>]*>/gi);
  if (!h1s) {
    report('WARN', file, 'Missing <h1> tag');
  } else if (h1s.length > 1) {
    report('WARN', file, `Multiple <h1> tags (${h1s.length})`);
  }

  // Check heading hierarchy
  const h2s = content.match(/<h2[^>]*>/gi) || [];
  const h3s = content.match(/<h3[^>]*>/gi) || [];
  if (h1s && h1s.length === 1 && h2s.length === 0 && file.includes('/guides/')) {
    report('WARN', file, 'Has h1 but no h2 headings');
  }

  // Check JSON-LD syntax validity
  if (jsonlds) {
    const ldMatches = content.match(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi);
    if (ldMatches) {
      ldMatches.forEach(ld => {
        try {
          const json = ld.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
          JSON.parse(json);
        } catch(e) {
          report('CRITICAL', file, `Invalid JSON-LD: ${e.message.slice(0,100)}`);
        }
      });
    }
  }

  // Check for broken relative links
  const linkMatches = content.match(/href=["']([^"']*)["']/g);
  if (linkMatches) {
    const dir = path.dirname(file);
    linkMatches.forEach(lm => {
      const href = lm.match(/href=["']([^"']*)["']/)[1];
      if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (href.endsWith('.html') || href.endsWith('.css') || href.endsWith('.js') || href.endsWith('.xml') || href.endsWith('.svg')) {
        const resolved = path.resolve(dir, href);
        if (!fs.existsSync(resolved)) {
          // Check if it exists with different path
          if (href.startsWith('./') || href.startsWith('../')) {
            report('WARN', file, `Broken link: "${href}" -> ${resolved}`);
          }
        }
      }
    });
  }

  // Check for alt attributes on images
  const imgMatches = content.match(/<img[^>]+>/gi);
  if (imgMatches) {
    imgMatches.forEach(img => {
      if (!img.match(/alt=/i)) {
        report('WARN', file, `Image missing alt attribute: ${img.slice(0,80)}`);
      }
    });
  }
});

console.log('\n=== DUPLICATE ANALYSIS ===');

// Duplicate meta descriptions
Object.keys(metaDescs).forEach(desc => {
  if (metaDescs[desc].length > 1) {
    // Only report if not the same file
    const unique = [...new Set(metaDescs[desc])];
    if (unique.length > 1) {
      report('DUPLICATE', unique.join(', '), `Duplicate meta description: "${desc.slice(0,80)}..."`);
    }
  }
});

// Duplicate titles
Object.keys(titles).forEach(t => {
  if (titles[t].length > 1) {
    const unique = [...new Set(titles[t])];
    if (unique.length > 1) {
      report('DUPLICATE', unique.join(', '), `Duplicate title: "${t.slice(0,80)}..."`);
    }
  }
});

// Duplicate canonicals
Object.keys(canonicalUrls).forEach(url => {
  if (canonicalUrls[url].length > 1) {
    const unique = [...new Set(canonicalUrls[url])];
    if (unique.length > 1) {
      report('DUPLICATE', unique.join(', '), `Multiple pages with same canonical: ${url}`);
    }
  }
});

console.log(`\n=== SUMMARY ===`);
console.log(`Total issues found: ${issues.length}`);
const counts = {};
issues.forEach(i => {
  if (!counts[i.type]) counts[i.type] = 0;
  counts[i.type]++;
});
Object.keys(counts).sort().forEach(k => console.log(`  ${k}: ${counts[k]}`));

// Write full report
const reportFile = 'seo-audit-report.json';
fs.writeFileSync(reportFile, JSON.stringify(issues, null, 2));
console.log(`\nFull report written to ${reportFile}`);
