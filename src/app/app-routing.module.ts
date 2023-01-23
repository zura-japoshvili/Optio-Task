import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminPanelComponent } from './features/admin-panel/admin-panel.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'admin-panel',
    pathMatch: 'full'
  },
  { path: 'admin-panel', component: AdminPanelComponent },
  { path: '**', component: AdminPanelComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
