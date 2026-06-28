import { prisma } from '../lib/prisma';
import { paginateStudies } from '../api-client/clinicaltrials';
import { normalizeStudy, type NormalizedStudyData } from '../normalizer';
import type { ImportResult } from '../types';
import {
  findOrCreateState,
  findOrCreateCity,
  findOrCreateCategory,
  findOrCreateCompany,
  findOrCreateStudyType,
} from './study.service';

function isValidStudy(data: NormalizedStudyData): boolean {
  return data.nctId.length > 0 && data.title.length > 0;
}

async function importSingleStudy(data: NormalizedStudyData): Promise<'imported' | 'skipped'> {
  const existing = await prisma.study.findUnique({ where: { nctId: data.nctId } });
  if (existing) return 'skipped';

  await prisma.study.create({ data });

  await Promise.allSettled([
    findOrCreateState(data.state),
    findOrCreateCategory(data.category),
    findOrCreateCompany(data.sponsor),
    findOrCreateStudyType(data.studyType),
  ]);

  if (data.city && data.state) {
    await findOrCreateCity(data.city, data.state);
  }

  return 'imported';
}

export async function importStudies(params: {
  query?: string;
  maxPages?: number;
  pageSize?: number;
} = {}): Promise<ImportResult> {
  const result: ImportResult = {
    total: 0,
    imported: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  try {
    for await (const studies of paginateStudies({
      query: params.query,
      pageSize: params.pageSize || 100,
      maxPages: params.maxPages || 10,
    })) {
      for (const raw of studies) {
        result.total++;
        try {
          const normalized = normalizeStudy(raw);
          if (!isValidStudy(normalized)) {
            result.skipped++;
            continue;
          }
          const status = await importSingleStudy(normalized);
          if (status === 'imported') result.imported++;
          else result.skipped++;
        } catch (err) {
          result.failed++;
          result.errors.push(`Study ${raw.protocolSection.identificationModule.nctId}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }
  } catch (err) {
    result.errors.push(`Import error: ${err instanceof Error ? err.message : String(err)}`);
  }

  return result;
}


