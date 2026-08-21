import { CommitRecord, SummaryCard } from '../models';

export function buildSummaryCards(records: CommitRecord[]): SummaryCard[] {
  const commits = records.length;
  const repositories = new Set(records.map((record) => record.repository).filter(Boolean)).size;
  const authors = new Set(records.map((record) => record.author).filter(Boolean)).size;
  const latestCommit = records
    .filter((record) => record.date)
    .sort((left, right) => (right.date?.getTime() ?? 0) - (left.date?.getTime() ?? 0))[0];

  return [
    { label: 'Commits filtrados', value: String(commits) },
    { label: 'Repositorios', value: String(repositories) },
    { label: 'Usuarios', value: String(authors) },
    { label: 'Ultimo commit', value: latestCommit?.rawDate || '-' }
  ];
}

export function groupCounts(values: string[]): Array<{ name: string; total: number }> {
  const counts = values
    .filter(Boolean)
    .reduce<Map<string, number>>((accumulator, value) => {
      accumulator.set(value, (accumulator.get(value) ?? 0) + 1);
      return accumulator;
    }, new Map<string, number>());

  return Array.from(counts.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((left, right) => right.total - left.total || left.name.localeCompare(right.name));
}
