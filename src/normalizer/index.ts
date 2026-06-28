import type { ClinicalTrialsGovStudy } from '../types';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 200);
}

function parseAge(age: string | undefined): string {
  if (!age || age === 'N/A') return '';
  return age.replace(/\s+/g, ' ').trim();
}

function formatAgeRange(min: string | undefined, max: string | undefined): string {
  const minAge = parseAge(min);
  const maxAge = parseAge(max);
  if (minAge && maxAge) return `${minAge}-${maxAge}`;
  if (minAge) return `${minAge}+`;
  if (maxAge) return `0-${maxAge}`;
  return '';
}

function extractConditions(study: ClinicalTrialsGovStudy): string {
  const conditions = study.protocolSection.conditionsModule?.conditions;
  return conditions?.join(', ') || '';
}

function extractInterventions(study: ClinicalTrialsGovStudy): string {
  const interventions = study.protocolSection.armsInterventionsModule?.interventions;
  return interventions?.map(i => i.name || '').filter(Boolean).join(', ') || '';
}

function extractFirstLocation(study: ClinicalTrialsGovStudy): {
  facility: string;
  city: string;
  state: string;
  zip: string;
  country: string;
} {
  const locations = study.protocolSection.contactsLocationsModule?.locations;
  if (!locations || locations.length === 0) {
    return { facility: '', city: '', state: '', zip: '', country: '' };
  }
  const loc = locations[0];
  return {
    facility: loc?.facility || '',
    city: loc?.city || '',
    state: loc?.state || '',
    zip: loc?.zip || '',
    country: loc?.country || '',
  };
}

function extractSponsor(study: ClinicalTrialsGovStudy): string {
  return study.protocolSection.sponsorCollaboratorsModule?.leadSponsor?.name || '';
}

function extractEligibility(study: ClinicalTrialsGovStudy): string {
  const criteria = study.protocolSection.eligibilityModule?.eligibilityCriteria;
  if (!criteria) return '';
  const cleaned = criteria.replace(/<[^>]+>/g, '').trim();
  return cleaned.length > 1000 ? cleaned.substring(0, 997) + '...' : cleaned;
}

export interface NormalizedStudyData {
  nctId: string;
  title: string;
  summary: string;
  status: string;
  studyType: string;
  phase: string;
  conditions: string;
  interventions: string;
  sponsor: string;
  eligibility: string;
  gender: string;
  minimumAge: string;
  maximumAge: string;
  healthyVolunteers: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  lastUpdated: string;
  url: string;
  slug: string;
  ageRange: string;
  category: string;
}

export function normalizeStudy(study: ClinicalTrialsGovStudy): NormalizedStudyData {
  const id = study.protocolSection.identificationModule;
  const desc = study.protocolSection.descriptionModule;
  const status = study.protocolSection.statusModule;
  const design = study.protocolSection.designModule;
  const elig = study.protocolSection.eligibilityModule;

  const location = extractFirstLocation(study);
  const conditions = extractConditions(study);
  const firstCondition = conditions.split(', ')[0] || 'General';

  const minAge = elig?.minimumAge;
  const maxAge = elig?.maximumAge;

  return {
    nctId: id.nctId,
    title: id.briefTitle || id.officialTitle || '',
    summary: desc?.briefSummary || '',
    status: status?.overallStatus || '',
    studyType: design?.studyType || '',
    phase: (design?.phases && design.phases.length > 0) ? design.phases[0] : 'N/A',
    conditions,
    interventions: extractInterventions(study),
    sponsor: extractSponsor(study),
    eligibility: extractEligibility(study),
    gender: elig?.gender || '',
    minimumAge: parseAge(minAge),
    maximumAge: parseAge(maxAge),
    healthyVolunteers: elig?.healthyVolunteers ? 'true' : 'false',
    city: location.city,
    state: location.state,
    zip: location.zip,
    country: location.country,
    lastUpdated: status?.lastUpdatePostDate || '',
    url: `https://clinicaltrials.gov/study/${id.nctId}`,
    slug: slugify(id.briefTitle || id.officialTitle || id.nctId),
    ageRange: formatAgeRange(minAge, maxAge),
    category: firstCondition,
  };
}
