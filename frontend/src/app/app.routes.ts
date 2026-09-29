import { Routes } from '@angular/router';

import { Login } from './components/login/login';
import { Shell } from './components/shell/shell';
import { AdminDashboard } from './components/admin-dashboard/admin-dashboard';
import { FacultyDashboard } from './components/faculty-dashboard/faculty-dashboard';
import { StudentsComponent } from './components/students/students';
import { AddStudentComponent } from './components/add-student/add-student';
import { EditStudentComponent } from './components/edit-student/edit-student';
import { FacultiesComponent } from './components/faculties/faculties';
import { SubjectsComponent } from './components/subjects/subjects';
import { AttendanceComponent } from './components/attendance/attendance';
import { MarksComponent } from './components/marks/marks';
import { ResultsComponent } from './components/results/results';
import { ReportsComponent } from './components/reports/reports';
import { TemplatesComponent } from './components/templates/templates';

import { authGuard } from './guards/auth-guard';
import { roleGuard } from './guards/role-guard';

export const routes: Routes = [
  {
    path: '',
    component: Login
  },
  {
    path: 'app',
    component: Shell,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        component: AdminDashboard,
        canActivate: [roleGuard('admin')]
      },
      {
        path: 'f-dashboard',
        component: FacultyDashboard,
        canActivate: [roleGuard('faculty')]
      },
      {
        path: 'students',
        component: StudentsComponent
      },
      {
        path: 'students/new',
        component: AddStudentComponent,
        canActivate: [roleGuard('admin')]
      },
      {
        path: 'students/edit/:id',
        component: EditStudentComponent,
        canActivate: [roleGuard('admin')]
      },
      {
        path: 'faculties',
        component: FacultiesComponent,
        canActivate: [roleGuard('admin')]
      },
      {
        path: 'subjects',
        component: SubjectsComponent,
        canActivate: [roleGuard('admin')]
      },
      {
        path: 'attendance',
        component: AttendanceComponent
      },
      {
        path: 'marks',
        component: MarksComponent
      },
      {
        path: 'results',
        component: ResultsComponent
      },
      {
        path: 'reports',
        component: ReportsComponent
      },
      {
        path: 'templates',
        component: TemplatesComponent,
        canActivate: [roleGuard('admin')]
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];