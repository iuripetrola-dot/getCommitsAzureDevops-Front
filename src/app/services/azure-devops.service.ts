import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import {
  BackendCommitRecord,
  BackendCommitsResponse,
  BackendConfig,
  BackendPullRequestRecord,
  BackendPullRequestsResponse,
  CommitRecord,
  PullRequestRecord
} from '../models';

export class BackendRequestError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
  }
}

export interface OpenPullRequestsResult {
  generatedAt: string;
  totalPullRequests: number;
  pullRequests: PullRequestRecord[];
}

@Injectable({
  providedIn: 'root'
})
export class AzureDevopsService {
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/$/, '');
  private openPullRequestsSnapshot: OpenPullRequestsResult | null = null;

  async loadConfig(): Promise<BackendConfig> {
    const response = await fetch(`${this.apiBaseUrl}/config`);
    return this.parseJsonResponse<BackendConfig>(response);
  }

  async fetchCommits(
    daysAgo: number
  ): Promise<{
    startedAt: string;
    finishedAt: string;
    generatedAt: string;
    totalCommits: number;
    logs: string[];
    commits: CommitRecord[];
  }> {
    const response = await fetch(`${this.apiBaseUrl}/commits?daysAgo=${encodeURIComponent(String(daysAgo))}`);
    const payload = await this.parseJsonResponse<BackendCommitsResponse>(response);

    return {
      startedAt: payload.startedAt,
      finishedAt: payload.finishedAt,
      generatedAt: payload.generatedAt,
      totalCommits: payload.totalCommits,
      logs: payload.logs,
      commits: payload.commits.map((commit) => this.mapCommitRecord(commit))
    };
  }

  async loadLastCommits(): Promise<{
    startedAt: string;
    finishedAt: string;
    generatedAt: string;
    totalCommits: number;
    logs: string[];
    commits: CommitRecord[];
  }> {
    const response = await fetch(`${this.apiBaseUrl}/commits/last`);
    const payload = await this.parseJsonResponse<BackendCommitsResponse>(response);

    return {
      startedAt: payload.startedAt,
      finishedAt: payload.finishedAt,
      generatedAt: payload.generatedAt,
      totalCommits: payload.totalCommits,
      logs: payload.logs,
      commits: payload.commits.map((commit) => this.mapCommitRecord(commit))
    };
  }

  async loadOpenPullRequests(): Promise<OpenPullRequestsResult> {
    const response = await fetch(`${this.apiBaseUrl}/pull-requests/open`);
    const payload = await this.parseJsonResponse<BackendPullRequestsResponse>(response);

    this.openPullRequestsSnapshot = {
      generatedAt: payload.generatedAt,
      totalPullRequests: payload.totalPullRequests,
      pullRequests: payload.pullRequests.map((pullRequest) => this.mapPullRequestRecord(pullRequest))
    };

    return this.openPullRequestsSnapshot;
  }

  getOpenPullRequestsSnapshot(): OpenPullRequestsResult | null {
    return this.openPullRequestsSnapshot;
  }

  buildExportUrl(daysAgo: number): string {
    return `${this.apiBaseUrl}/commits/export?daysAgo=${encodeURIComponent(String(daysAgo))}`;
  }

  private mapCommitRecord(commit: BackendCommitRecord): CommitRecord {
    return {
      id: commit.id,
      author: commit.author,
      email: commit.email,
      repository: commit.repository,
      branch: commit.branch,
      date: commit.date ? new Date(commit.date) : null,
      rawDate: commit.rawDate,
      message: commit.message,
      commitId: commit.commitId
    };
  }

  private mapPullRequestRecord(pullRequest: BackendPullRequestRecord): PullRequestRecord {
    return {
      ...pullRequest,
      reviewers: Array.isArray(pullRequest.reviewers) ? pullRequest.reviewers : [],
      createdAt: pullRequest.createdAt ? new Date(pullRequest.createdAt) : null
    };
  }

  private async parseJsonResponse<T>(response: Response): Promise<T> {
    const payload = await response.text();
    let parsed: unknown;

    try {
      parsed = payload ? JSON.parse(payload) : {};
    } catch {
      throw new Error('Resposta invalida do backend.');
    }

    if (!response.ok) {
      const errorPayload = parsed as { message?: string };
      throw new BackendRequestError(response.status, errorPayload.message || `Backend retornou HTTP ${response.status}.`);
    }

    return parsed as T;
  }
}
