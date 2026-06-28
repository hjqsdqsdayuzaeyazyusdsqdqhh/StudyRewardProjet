import type { ClinicalTrialsGovResponse, ClinicalTrialsGovStudy } from '../types';

const BASE_URL = 'https://clinicaltrials.gov/api/v2';

export interface FetchStudiesParams {
  query?: string;
  status?: string;
  pageSize?: number;
  pageToken?: string;
}

export async function fetchStudies(
  params: FetchStudiesParams = {}
): Promise<ClinicalTrialsGovResponse> {
  const searchParams = new URLSearchParams();

  if (params.query) {
    searchParams.set('query.term', params.query);
  }

  if (params.status) {
    searchParams.set('filter.overallStatus', params.status);
  } else {
    searchParams.set('filter.overallStatus', 'RECRUITING');
  }

  searchParams.set('pageSize', String(params.pageSize || 100));
  searchParams.set('format', 'json');

  if (params.pageToken) {
    searchParams.set('pageToken', params.pageToken);
  }

  const url = `${BASE_URL}/studies?${searchParams.toString()}`;

  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`ClinicalTrials.gov API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<ClinicalTrialsGovResponse>;
}

export async function fetchStudyById(nctId: string): Promise<ClinicalTrialsGovStudy | null> {
  const url = `${BASE_URL}/studies/${nctId}?format=json`;

  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`ClinicalTrials.gov API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data as ClinicalTrialsGovStudy;
}

export async function* paginateStudies(
  params: Omit<FetchStudiesParams, 'pageToken'> & { maxPages?: number }
): AsyncGenerator<ClinicalTrialsGovStudy[], void, undefined> {
  let pageToken: string | undefined;
  let pagesFetched = 0;
  const maxPages = params.maxPages || 10;

  do {
    const response = await fetchStudies({ ...params, pageToken });
    pagesFetched++;

    yield response.studies;

    pageToken = response.nextPageToken;

    if (pagesFetched >= maxPages) break;
  } while (pageToken);
}
