import { BackendConfig, CommitRecord } from '../models';

export function buildConfiguredAuthorsDisplay(backendConfig: BackendConfig | null, records: CommitRecord[]): string {
  if (!backendConfig) {
    return '';
  }

  if (Array.isArray(backendConfig.authors) && backendConfig.authors.length) {
    return backendConfig.authors
      .map((author) => (author.name?.trim() ? `${author.name.trim()} - ${author.email}` : author.email))
      .join('\n');
  }

  const authorByEmail = records.reduce<Map<string, string>>((accumulator, record) => {
    const email = record.email.trim().toLowerCase();
    const author = record.author.trim();

    if (!email || !author || author.toLowerCase() === email) {
      return accumulator;
    }

    if (!accumulator.has(email)) {
      accumulator.set(email, author);
    }

    return accumulator;
  }, new Map<string, string>());

  return backendConfig.authorEmails
    .map((email) => {
      const normalizedEmail = email.trim().toLowerCase();
      const authorName = authorByEmail.get(normalizedEmail);

      return authorName ? `${authorName} - ${email}` : email;
    })
    .join('\n');
}
