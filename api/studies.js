const fs = require('fs');
const path = require('path');

const STATE_ABBR = {
  alabama:'AL',alaska:'AK',arizona:'AZ',arkansas:'AR',california:'CA',colorado:'CO',
  connecticut:'CT',delaware:'DE',florida:'FL',georgia:'GA',hawaii:'HI',idaho:'ID',
  illinois:'IL',indiana:'IN',iowa:'IA',kansas:'KS',kentucky:'KY',louisiana:'LA',
  maine:'ME',maryland:'MD',massachusetts:'MA',michigan:'MI',minnesota:'MN',
  mississippi:'MS',missouri:'MO',montana:'MT',nebraska:'NE',nevada:'NV',
  'new-hampshire':'NH','new-jersey':'NJ','new-mexico':'NM','new-york':'NY',
  'north-carolina':'NC','north-dakota':'ND',ohio:'OH',oklahoma:'OK',oregon:'OR',
  pennsylvania:'PA','rhode-island':'RI','south-carolina':'SC','south-dakota':'SD',
  tennessee:'TN',texas:'TX',utah:'UT',vermont:'VT',virginia:'VA',washington:'WA',
  'west-virginia':'WV',wisconsin:'WI',wyoming:'WY'
};

const STATE_NAME = {};
Object.keys(STATE_ABBR).forEach(k => {
  STATE_NAME[STATE_ABBR[k]] = k.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
});

let citiesCache = null;
function loadCities() {
  if (citiesCache) return citiesCache;
  try {
    const p = path.join(__dirname, '..', 'data', 'cities.json');
    citiesCache = JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch { citiesCache = []; }
  return citiesCache;
}

function resolveCity(slug) {
  const cities = loadCities();
  return cities.find(c => c.slug === slug) || null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { state, city, condition, pageSize = '20', pageToken = '' } = req.query;

  const base = 'https://clinicaltrials.gov/api/v2/studies';
  const params = new URLSearchParams({
    format: 'json',
    pageSize: String(Math.min(parseInt(pageSize) || 20, 100)),
    'filter.overallStatus': 'RECRUITING'
  });
  if (pageToken) params.set('pageToken', pageToken);

  if (condition) {
    const name = condition.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    params.set('query.cond', name);
  }
  if (city) {
    const cityInfo = resolveCity(city.toLowerCase().replace(/[^a-z0-9-]/g, ''));
    if (!cityInfo) return res.status(404).json({ error: 'Unknown city: ' + city });
    const stateSlug = cityInfo.state.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const abbr = STATE_ABBR[stateSlug];
    if (!abbr) return res.status(404).json({ error: 'Unknown state for city' });
    params.set('query.locs', 'US:' + abbr + ':' + cityInfo.name);
  } else if (state) {
    const slug = state.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const abbr = STATE_ABBR[slug];
    if (!abbr) return res.status(404).json({ error: 'Unknown state: ' + state });
    params.set('query.locs', 'US:' + abbr);
  }
  if (!condition && !state && !city) {
    return res.status(400).json({ error: 'Missing condition, state, or city parameter' });
  }

  try {
    const resp = await fetch(base + '?' + params.toString());
    if (!resp.ok) {
      const text = await resp.text();
      return res.status(502).json({ error: 'ClinicalTrials.gov API error', detail: text.slice(0,500) });
    }
    const data = await resp.json();

    const mapped = (data.studies || []).map(s => {
      const p = s.protocolSection || {};
      const id = (p.identificationModule || {}).nctId || '';
      const locs = (p.contactsLocationsModule || {}).locations || [];
      const loc = locs[0] || {};
      const dsgn = p.designModule || {};
      return {
        id,
        title: (p.identificationModule || {}).briefTitle || 'Untitled Study',
        status: (p.statusModule || {}).overallStatus || 'Unknown',
        sponsor: ((p.sponsorCollaboratorsModule || {}).leadSponsor || {}).name || 'Unknown',
        phase: (dsgn.phases || ['N/A'])[0] || 'N/A',
        studyType: dsgn.studyType || 'N/A',
        city: loc.city || '',
        state: loc.state || '',
        facility: loc.facility || '',
        summary: (p.descriptionModule || {}).briefSummary || '',
        postedDate: ((s.derivedSection || {}).miscellaneousModule || {}).lastUpdatePostDate || ''
      };
    });

    res.json({
      studies: mapped,
      totalCount: data.totalCount || mapped.length,
      nextPageToken: data.nextPageToken || ''
    });
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch studies', detail: err.message });
  }
}
