import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { PullRequestRecord } from '../../models';
import { AzureDevopsService } from '../../services/azure-devops.service';

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
    }
  }
  protected pullRequests: PullRequestRecord[] = [];
  protected hasLoadedPullRequests = false;
  protected inProgress = false;
  protected errorMessage = '';
  protected generatedAt = '';

  protected async loadOpenPullRequests(): Promise<void> {
    this.inProgress = true;
    this.errorMessage = '';
    try {
      const payload = await this.azureDevopsService.loadOpenPullRequests();
      this.pullRequests = payload.pullRequests;
      this.generatedAt = payload.generatedAt;
      this.hasLoadedPullRequests = true;
    } catch (error) {
      this.pullRequests = [];
      this.generatedAt = '';
      this.hasLoadedPullRequests = false;
      this.errorMessage = error instanceof Error ? error.message : 'Falha inesperada ao carregar Pull Requests.';
    } finally { this.inProgress = false; }
  }
}
