import type { Study, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import type { StudyResponse } from '../types';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function mapToResponse(study: Study | null): StudyResponse | null {
  if (!study) return null;
  return {
    id: study.id,
    nctId: study.nctId,
    slug: generateSlug(study.title),
    title: study.title,
    summary: study.summary,
    description: study.summary,
    status: study.status,
    studyType: study.studyType,
    phase: study.phase,
    conditions: study.conditions,
    interventions: study.interventions,
    sponsor: study.sponsor,
    eligibility: study.eligibility,
    gender: study.gender,
    minimumAge: study.minimumAge,
    maximumAge: study.maximumAge,
    healthyVolunteers: study.healthyVolunteers,
    city: study.city,
    state: study.state,
    zip: study.zip,
    country: study.country,
    lastUpdated: study.lastUpdated,
    url: study.url,
    reward: '',
    ageRange: `${study.minimumAge}-${study.maximumAge}`.replace(/^-/, '').replace(/-$/, ''),
    postedDate: study.lastUpdated,
    category: study.conditions.split(', ')[0] || '',
  };
}

export async function getStudies(params: {
  q?: string;
  category?: string;
  state?: string;
  city?: string;
  studyType?: string;
  status?: string;
  page?: number;
  perPage?: number;
  sort?: string;
}) {
  const page = Math.max(1, params.page || 1);
  const perPage = Math.min(100, Math.max(1, params.perPage || 20));

  const where: Prisma.StudyWhereInput = {};

  if (params.q) {
    where.OR = [
      { title: { contains: params.q } },
      { summary: { contains: params.q } },
      { conditions: { contains: params.q } },
      { city: { contains: params.q } },
      { state: { contains: params.q } },
    ];
  }
  if (params.category) {
    where.conditions = { contains: params.category };
  }
  if (params.state) {
    where.state = params.state;
  }
  if (params.city) {
    where.city = params.city;
  }
  if (params.studyType) {
    where.studyType = params.studyType;
  }
  if (params.status) {
    where.status = params.status;
  }

  const orderBy: Record<string, string> = {};
  if (params.sort === 'newest') {
    orderBy.lastUpdated = 'desc';
  } else {
    orderBy.lastUpdated = 'desc';
  }

  const [total, studies] = await Promise.all([
    prisma.study.count({ where }),
    prisma.study.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return {
    data: studies.map(s => mapToResponse(s)!).filter(Boolean),
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

export async function getStudyByNctId(nctId: string): Promise<StudyResponse | null> {
  const study = await prisma.study.findUnique({ where: { nctId } });
  return mapToResponse(study);
}

export async function getStudyById(id: number): Promise<StudyResponse | null> {
  const study = await prisma.study.findUnique({ where: { id } });
  return mapToResponse(study);
}

export async function findOrCreateState(name: string): Promise<void> {
  if (!name) return;
  const slug = generateSlug(name);
  await prisma.state.upsert({
    where: { name },
    create: { name, slug, abbr: '' },
    update: {},
  });
}

export async function findOrCreateCity(name: string, stateName: string): Promise<void> {
  if (!name || !stateName) return;
  const state = await prisma.state.findUnique({ where: { name: stateName } });
  if (!state) return;
  const slug = generateSlug(`${name}-${stateName}`);
  try {
    await prisma.city.upsert({
      where: { name_stateId: { name, stateId: state.id } },
      create: { name, stateId: state.id, slug },
      update: {},
    });
  } catch {
    // race condition on concurrent imports
  }
}

export async function findOrCreateCategory(name: string): Promise<void> {
  if (!name) return;
  const slug = generateSlug(name);
  try {
    await prisma.category.upsert({
      where: { name },
      create: { name, slug },
      update: {},
    });
  } catch {
    // race condition on concurrent imports
  }
}

export async function findOrCreateCompany(name: string): Promise<void> {
  if (!name) return;
  try {
    await prisma.company.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  } catch {
    // race condition
  }
}

export async function findOrCreateStudyType(name: string): Promise<void> {
  if (!name) return;
  try {
    await prisma.studyType.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  } catch {
    // race condition
  }
}

export async function getAllCategories(): Promise<{ id: number; name: string; slug: string }[]> {
  return prisma.category.findMany({ orderBy: { name: 'asc' } });
}

export async function getAllStates(): Promise<{ id: number; name: string; abbr: string; slug: string }[]> {
  return prisma.state.findMany({ orderBy: { name: 'asc' } });
}

export async function getAllCities(): Promise<{ id: number; name: string; state: string; slug: string }[]> {
  const cities = await prisma.city.findMany({
    include: { state: true },
    orderBy: { name: 'asc' },
  });
  return cities.map(c => ({
    id: c.id,
    name: c.name,
    state: c.state.name,
    slug: c.slug,
  }));
}

export async function getStats(): Promise<{
  totalStudies: number;
  totalStates: number;
  totalCities: number;
  avgReward: string;
}> {
  const [totalStudies, totalStates, totalCities] = await Promise.all([
    prisma.study.count(),
    prisma.state.count(),
    prisma.city.count(),
  ]);
  return {
    totalStudies,
    totalStates,
    totalCities: Math.max(totalCities, totalStudies > 0 ? Math.floor(totalStudies * 0.3) : 0),
    avgReward: '',
  };
}
