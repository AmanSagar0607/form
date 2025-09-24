import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./app.component').then(m => m.AppComponent),
    children: [
      // Add your feature routes here
      // { path: 'some-path', loadComponent: () => import('./some/some.component').then(m => m.SomeComponent) },
    ]
  }
];
