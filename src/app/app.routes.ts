import { Routes } from '@angular/router';
import { CommitsPageComponent } from './pages/commits/commits-page.component';
import { PullRequestsPageComponent } from './pages/pull-requests/pull-requests-page.component';

export const routes: Routes = [
  { path: '', component: CommitsPageComponent, pathMatch: 'full' },
  { path: 'pull-requests', component: PullRequestsPageComponent },
  { path: '**', redirectTo: '' }
];
