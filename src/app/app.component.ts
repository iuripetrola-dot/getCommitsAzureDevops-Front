import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AzureDevopsService } from './services/azure-devops.service';
import { BackendConfig, CommitRecord, SummaryCard } from './models';
import { buildConfiguredAuthorsDisplay } from './utils/author-display.utils';
import {
  applyCommitFilters,
  buildAuthorOptions,
  buildBranchOptions,
  buildRepositoryOptions
} from './utils/filter.utils';
import { sortCommitRecords } from './utils/sort.utils';
import { buildSummaryCards, groupCounts } from './utils/summary.utils';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
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

  async ngOnInit(): Promise<void> {
    await this.loadConfig();
  }

  protected get summaryCards(): SummaryCard[] {
    return buildSummaryCards(this.filteredRecords);
  }

  protected get authors(): string[] {
    return buildAuthorOptions(this.records, this.backendConfig);
  }

  protected get repositories(): string[] {
    return buildRepositoryOptions(this.records, this.backendConfig);
  }

  protected get branches(): string[] {
    return buildBranchOptions(this.records);
  }

  protected get configuredAuthorsDisplay(): string {
    return buildConfiguredAuthorsDisplay(this.backendConfig, this.records);
  }

  protected get topRepositories(): Array<{ name: string; total: number }> {
    return groupCounts(this.filteredRecords.map((record) => record.repository)).slice(0, 5);
  }

  protected get topAuthors(): Array<{ name: string; total: number }> {
    return groupCounts(this.filteredRecords.map((record) => record.author)).slice(0, 5);
  }

  protected async reloadConfig(): Promise<void> {
    await this.loadConfig();
  }

  protected async fetchCommits(): Promise<void> {
    const requestStartedAt = new Date().toISOString();
    this.inProgress = true;
    this.errorMessage = '';
    this.progressMessage = 'Consultando api Devops ...';
    this.statusMessage = 'Buscando commits...';
    this.logLines = [];
    this.lastStartedAt = requestStartedAt;
    this.lastFinishedAt = '';

    try {
      const payload = await this.azureDevopsService.fetchCommits(this.daysAgo);
      this.hasFetchedCommits = true;
      this.records = payload.commits;
      this.logLines = payload.logs;
      this.lastStartedAt = payload.startedAt;
      this.lastFinishedAt = payload.finishedAt;
      this.lastGeneratedAt = payload.generatedAt;
      this.progressMessage = 'Coleta concluida.';
      this.clearFilters();
      this.statusMessage =
        payload.totalCommits > 0
          ? `${payload.totalCommits} commit(s) carregado(s).`
          : 'Consulta concluida sem commits para os filtros informados.';
    } catch (error) {
      this.hasFetchedCommits = true;
      this.lastFinishedAt = new Date().toISOString();
      this.errorMessage = this.formatError(error);
      this.statusMessage = 'Falha ao consultar o backend.';
      this.progressMessage = 'Execucao interrompida.';
    } finally {
      this.inProgress = false;
    }
  }

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
      this.statusMessage =
        payload.totalCommits > 0
          ? `${payload.totalCommits} commit(s) carregado(s) da ultima consulta.`
          : 'Ultima consulta carregada sem commits.';
    } catch (error) {
      this.errorMessage = this.formatError(error);
      this.statusMessage = 'Nao foi possivel carregar a ultima consulta.';
      this.progressMessage = 'Sem resultado salvo no backend.';
    } finally {
      this.inProgress = false;
    }
  }

  protected exportCsv(): void {
    window.open(this.azureDevopsService.buildExportUrl(this.daysAgo), '_blank');
  }

  protected applyFilters(): void {
    this.filteredRecords = applyCommitFilters(this.records, {
      searchTerm: this.searchTerm,
      author: this.selectedAuthor,
      repository: this.selectedRepository,
      branch: this.selectedBranch
    });
    this.filteredRecords = sortCommitRecords(this.filteredRecords, this.sortColumn, this.sortDirection);
  }

  protected clearFilters(): void {
    this.searchTerm = '';
    this.selectedAuthor = 'Todos';
    this.selectedRepository = 'Todos';
    this.selectedBranch = 'Todos';
    this.applyFilters();
  }

  protected sortBy(column: keyof CommitRecord): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = column === 'date' ? 'desc' : 'asc';
    }

    this.sortRecords();
  }

  protected trackByCommit(_: number, record: CommitRecord): string {
    return record.id;
  }

  private async loadConfig(): Promise<void> {
    this.errorMessage = '';
    this.statusMessage = 'Carregando configuracao do backend...';

    try {
      const config = await this.azureDevopsService.loadConfig();
      this.backendConfig = config;
      this.daysAgo = config.daysAgo;
      this.applyFilters();
      this.statusMessage = 'Backend disponivel.';
      this.progressMessage = 'Aguardando consulta.';
    } catch (error) {
      this.errorMessage = this.formatError(error);
      this.statusMessage = 'Nao foi possivel conectar no backend.';
      this.progressMessage = 'Backend indisponivel.';
    }
  }

  private sortRecords(): void {
    this.filteredRecords = sortCommitRecords(this.filteredRecords, this.sortColumn, this.sortDirection);
  }

  private formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return 'Falha inesperada.';
  }
}
