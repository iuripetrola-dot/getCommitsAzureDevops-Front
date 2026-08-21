import { CommitRecord } from '../models';

export function sortCommitRecords(
  records: CommitRecord[],
  sortColumn: keyof CommitRecord,
  sortDirection: 'asc' | 'desc'
): CommitRecord[] {
  const direction = sortDirection === 'asc' ? 1 : -1;

  return [...records].sort((left, right) => {
    const leftValue = sortValue(left, sortColumn);
    const rightValue = sortValue(right, sortColumn);

    if (leftValue < rightValue) {
      return -1 * direction;
    }

    if (leftValue > rightValue) {
      return 1 * direction;
    }

    return 0;
  });
}

function sortValue(record: CommitRecord, column: keyof CommitRecord): number | string {
  if (column === 'date') {
    return record.date?.getTime() ?? 0;
  }

  const value = record[column];
  return typeof value === 'string' ? value.toLowerCase() : '';
}
