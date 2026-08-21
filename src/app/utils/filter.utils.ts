import { BackendConfig, CommitRecord } from '../models';

export function buildOptions(values: string[]): string[] {
  return ['Todos', ...Array.from(new Set(values.filter(Boolean))).sort((left, right) => left.localeCompare(right))];
}

export function buildAuthorOptions(records: CommitRecord[], backendConfig: BackendConfig | null): string[] {
  const configuredAuthors = Array.isArray(backendConfig?.authors)
    ? backendConfig.authors.map((author) => author.name?.trim() || author.email)
    : backendConfig?.authorEmails ?? [];

  return buildOptions([...configuredAuthors, ...records.map((record) => record.author)]);
}

export function buildRepositoryOptions(records: CommitRecord[], backendConfig: BackendConfig | null): string[] {
  const configuredRepositories = backendConfig?.repositories.map((repository) => repository.repo) ?? [];

  return buildOptions([...configuredRepositories, ...records.map((record) => record.repository)]);
}

export function buildBranchOptions(records: CommitRecord[]): string[] {
  return buildOptions(records.map((record) => record.branch));
}

export function applyCommitFilters(
  records: CommitRecord[],
  filters: {
    searchTerm: string;
    author: string;
    repository: string;
    branch: string;
  }
): CommitRecord[] {
  const search = filters.searchTerm.trim().toLowerCase();

  return records
    .filter((record) => filters.author === 'Todos' || record.author === filters.author)
    .filter((record) => filters.repository === 'Todos' || record.repository === filters.repository)
    .filter((record) => filters.branch === 'Todos' || record.branch === filters.branch)
    .filter((record) => {
      if (!search) {
        return true;
      }

      const haystack = [
        record.author,
        record.email,
        record.repository,
        record.branch,
        record.rawDate,
        record.message,
        record.commitId
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(search);
    });
}
