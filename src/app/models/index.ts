export interface CommitRecord {
  id: string;
  author: string;
  email: string;
  repository: string;
  branch: string;
  date: Date | null;
  rawDate: string;
  message: string;
  commitId: string;
}

export interface SummaryCard {
  label: string;
  value: string;
}

export interface RepositoryTarget {
  project: string;
  repo: string;
}

export interface ConfiguredAuthor {
  name: string;
  email: string;
}

export interface BackendConfig {
  orgUrl: string;
  daysAgo: number;
  insecureTls: boolean;
  repositories: RepositoryTarget[];
  authors?: ConfiguredAuthor[];
  authorEmails: string[];
}

export interface BackendCommitRecord {
  id: string;
  author: string;
  email: string;
  repository: string;
  branch: string;
  date: string | null;
  rawDate: string;
  message: string;
  commitId: string;
}

export interface BackendCommitsResponse {
  startedAt: string;
  finishedAt: string;
  generatedAt: string;
  totalCommits: number;
  logs: string[];
  commits: BackendCommitRecord[];
}

export interface PullRequestRecord {
  id: number;
  title: string;
  status: string;
  repository: string;
  project: string;
  author: string;
  email: string;
  sourceBranch: string;
  targetBranch: string;
  reviewers: string[];
  createdAt: Date | null;
  url: string;
}

export interface BackendPullRequestRecord extends Omit<PullRequestRecord, 'createdAt'> {
  createdAt: string | null;
}

export interface BackendPullRequestsResponse {
  generatedAt: string;
  totalPullRequests: number;
  pullRequests: BackendPullRequestRecord[];
}
