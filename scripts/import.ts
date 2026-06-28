import { importStudies } from '../src/services/import.service';

async function main() {
  const query = process.argv[2] || undefined;
  const maxPages = parseInt(process.argv[3] || '5', 10);
  const pageSize = parseInt(process.argv[4] || '100', 10);

  console.log(`Importing studies from ClinicalTrials.gov...`);
  if (query) console.log(`Query: ${query}`);
  console.log(`Max pages: ${maxPages}, Page size: ${pageSize}`);

  const result = await importStudies({ query, maxPages, pageSize });

  console.log('\n=== Import Summary ===');
  console.log(`Total processed: ${result.total}`);
  console.log(`Imported: ${result.imported}`);
  console.log(`Skipped (duplicates): ${result.skipped}`);
  console.log(`Failed: ${result.failed}`);
  if (result.errors.length > 0) {
    console.log('\nErrors:');
    result.errors.forEach(e => console.log(`  - ${e}`));
  }
}

main().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
