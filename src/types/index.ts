export interface StudyResponse {
  id: number;
  nctId: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
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
  reward: string;
  ageRange: string;
  postedDate: string;
  category: string;
}

export interface StudiesQueryParams {
  q?: string;
  category?: string;
  state?: string;
  city?: string;
  studyType?: string;
  status?: string;
  page?: number;
  perPage?: number;
  sort?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  failed: number;
  errors: string[];
}

export interface ClinicalTrialsGovStudy {
  protocolSection: {
    identificationModule: {
      nctId: string;
      briefTitle: string;
      officialTitle?: string;
    };
    descriptionModule?: {
      briefSummary?: string;
    };
    statusModule?: {
      overallStatus?: string;
      lastUpdatePostDate?: string;
    };
    designModule?: {
      studyType?: string;
      phases?: string[];
    };
    conditionsModule?: {
      conditions?: string[];
    };
    armsInterventionsModule?: {
      interventions?: Array<{
        name?: string;
        type?: string;
      }>;
    };
    sponsorCollaboratorsModule?: {
      leadSponsor?: {
        name?: string;
      };
    };
    eligibilityModule?: {
      eligibilityCriteria?: string;
      gender?: string;
      minimumAge?: string;
      maximumAge?: string;
      healthyVolunteers?: boolean;
    };
    contactsLocationsModule?: {
      locations?: Array<{
        facility?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
      }>;
    };
  };
}

export interface ClinicalTrialsGovResponse {
  studies: ClinicalTrialsGovStudy[];
  nextPageToken?: string;
  totalCount?: number;
}
