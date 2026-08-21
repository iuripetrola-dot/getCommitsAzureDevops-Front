import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { BackendCommitRecord, BackendCommitsResponse, BackendConfig, CommitRecord } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AzureDevopsService {
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/$/, '');

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
      throw new Error(errorPayload.message || `Backend retornou HTTP ${response.status}.`);
    }

    return parsed as T;
  }
}
