import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BackendConfig, CommitRecord, SummaryCard } from '../../models';
import { AzureDevopsService, BackendRequestError } from '../../services/azure-devops.service';
import { buildConfiguredAuthorsDisplay } from '../../utils/author-display.utils';
import { applyCommitFilters, buildAuthorOptions, buildBranchOptions, buildRepositoryOptions } from '../../utils/filter.utils';
import { sortCommitRecords } from '../../utils/sort.utils';
import { buildSummaryCards, groupCounts } from '../../utils/summary.utils';

@Component({
  selector: 'app-commits-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './commits-page.component.html',
  styleUrls: ['./commits-page.component.css']
})
export class CommitsPageComponent implements OnInit {
  constructor(private readonly azureDevopsService: AzureDevopsService) {}

  protected records: CommitRecord[] = [];
  protected filteredRecords: CommitRecord[] = [];
  protected hasFetchedCommits = false;
  protected searchTerm = '';
  protected selectedAuthor = 'Todos';
  protected selectedRepository = 'Todos';
  protected selectedBranch = 'Todos';
  protected statusMessage = 'Conectando ao backend ...';
  protected errorMessage = '';
  protected sortColumn: keyof CommitRecord = 'date';
  protected sortDirection: 'asc' | 'desc' = 'desc';
  protected inProgress = false;
  protected progressMessage = 'Aguardando execucao.';
  protected logLines: string[] = [];
  protected backendConfig: BackendConfig | null = null;
  protected daysAgo = 1;
  protected lastStartedAt = '';
  protected lastFinishedAt = '';
  protected lastGeneratedAt = '';

  async ngOnInit(): Promise<void> { await this.loadConfig(); }
  protected get summaryCards(): SummaryCard[] { return buildSummaryCards(this.filteredRecords); }
  protected get authors(): string[] { return buildAuthorOptions(this.records); }
  protected get repositories(): string[] { return buildRepositoryOptions(this.records, this.backendConfig); }
  protected get branches(): string[] { return buildBranchOptions(this.records); }
  protected get configuredAuthorsDisplay(): string { return buildConfiguredAuthorsDisplay(this.backendConfig, this.records); }
  protected get topRepositories(): Array<{ name: string; total: number }> { return groupCounts(this.filteredRecords.map((record) => record.repository)).slice(0, 5); }

  protected async reloadConfig(): Promise<void> { await this.loadConfig(); }

  protected async loadLastCommits(): Promise<void> {
    this.inProgress = true;
    this.errorMessage = '';
    this.progressMessage = 'Carregando ultima consulta do backend ...';
    this.statusMessage = 'Lendo ultimo resultado salvo...';
    try {
      const payload = await this.azureDevopsService.loadLastCommits();
      this.hasFetchedCommits = true;
      this.records = payload.commits;
      this.logLines = payload.logs;
      this.lastStartedAt = payload.startedAt;
      this.lastFinishedAt = payload.finishedAt;
      this.lastGeneratedAt = payload.generatedAt;
      this.clearFilters();
      this.progressMessage = 'Ultima consulta carregada.';
      this.statusMessage = payload.totalCommits > 0 ? `${payload.totalCommits} commit(s) carregado(s) da ultima consulta.` : 'Ultima consulta carregada sem commits.';
    } catch (error) {
      if (error instanceof BackendRequestError && error.statusCode === 404) { this.clearLoadedCommits(); }
      this.errorMessage = this.formatError(error);
      this.statusMessage = 'Nao foi possivel carregar a ultima consulta.';
      this.progressMessage = 'Sem resultado salvo no backend.';
    } finally { this.inProgress = false; }
  }

  protected exportCsv(): void { window.open(this.azureDevopsService.buildExportUrl(this.daysAgo), '_blank'); }

  protected applyFilters(): void {
    this.filteredRecords = sortCommitRecords(applyCommitFilters(this.records, {
      searchTerm: this.searchTerm, author: this.selectedAuthor, repository: this.selectedRepository, branch: this.selectedBranch
    }), this.sortColumn, this.sortDirection);
  }

  protected clearFilters(): void {
    this.searchTerm = ''; this.selectedAuthor = 'Todos'; this.selectedRepository = 'Todos'; this.selectedBranch = 'Todos'; this.applyFilters();
  }

  protected sortBy(column: keyof CommitRecord): void {
    if (this.sortColumn === column) this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    else { this.sortColumn = column; this.sortDirection = column === 'date' ? 'desc' : 'asc'; }
    this.applyFilters();
  }

  protected trackByCommit(_: number, record: CommitRecord): string { return record.id; }

  private clearLoadedCommits(): void {
    this.records = []; this.filteredRecords = []; this.hasFetchedCommits = false; this.logLines = [];
    this.lastStartedAt = ''; this.lastFinishedAt = ''; this.lastGeneratedAt = ''; this.clearFilters();
  }

  private async loadConfig(): Promise<void> {
    this.errorMessage = ''; this.statusMessage = 'Carregando configuracao do backend...';
    try {
      const config = await this.azureDevopsService.loadConfig();
      this.backendConfig = config; this.daysAgo = config.daysAgo; this.applyFilters();
      this.statusMessage = 'Backend disponivel.'; this.progressMessage = 'Aguardando consulta.';
    } catch (error) {
      this.errorMessage = this.formatError(error); this.statusMessage = 'Nao foi possivel conectar no backend.'; this.progressMessage = 'Backend indisponivel.';
    }
  }

  private formatError(error: unknown): string { return error instanceof Error ? error.message : 'Falha inesperada.'; }
}
