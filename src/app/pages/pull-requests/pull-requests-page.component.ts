import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { PullRequestRecord } from '../../models';
import { AzureDevopsService } from '../../services/azure-devops.service';

type PullRequestSortColumn = 'repository' | 'author' | 'createdAt';

@Component({
  selector: 'app-pull-requests-page',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './pull-requests-page.component.html',
  styleUrls: ['./pull-requests-page.component.css']
})
export class PullRequestsPageComponent {
  constructor(private readonly azureDevopsService: AzureDevopsService) {
    const snapshot = this.azureDevopsService.getOpenPullRequestsSnapshot();
    if (snapshot) {
      this.pullRequests = snapshot.pullRequests;
      this.generatedAt = snapshot.generatedAt;
      this.hasLoadedPullRequests = true;
      this.applySort();
    }
  }
  protected pullRequests: PullRequestRecord[] = [];
  protected hasLoadedPullRequests = false;
  protected inProgress = false;
  protected errorMessage = '';
  protected generatedAt = '';
  protected sortColumn: PullRequestSortColumn = 'createdAt';
  protected sortDirection: 'asc' | 'desc' = 'asc';

  protected async loadOpenPullRequests(): Promise<void> {
    this.inProgress = true;
    this.errorMessage = '';
    try {
      const payload = await this.azureDevopsService.loadOpenPullRequests();
      this.pullRequests = payload.pullRequests;
      this.generatedAt = payload.generatedAt;
      this.hasLoadedPullRequests = true;
      this.applySort();
    } catch (error) {
      this.pullRequests = [];
      this.generatedAt = '';
      this.hasLoadedPullRequests = false;
      this.errorMessage = error instanceof Error ? error.message : 'Falha inesperada ao carregar Pull Requests.';
    } finally { this.inProgress = false; }
  }

  protected sortBy(column: PullRequestSortColumn): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = column === 'createdAt' ? 'desc' : 'asc';
    }

    this.applySort();
  }

  protected sortIndicator(column: PullRequestSortColumn): string {
    if (this.sortColumn !== column) {
      return '';
    }

    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  private applySort(): void {
    const direction = this.sortDirection === 'asc' ? 1 : -1;

    this.pullRequests = [...this.pullRequests].sort((left, right) => {
      if (this.sortColumn === 'createdAt') {
        const leftDate = left.createdAt?.getTime() ?? 0;
        const rightDate = right.createdAt?.getTime() ?? 0;
        return (leftDate - rightDate) * direction;
      }

      return left[this.sortColumn].localeCompare(right[this.sortColumn], 'pt-BR', {
        sensitivity: 'base'
      }) * direction;
    });
  }
}
