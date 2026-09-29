import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.css'
})
export class Shell {
  private authService = inject(AuthService);
  private router = inject(Router);

  user = this.authService.getUser();
  role = this.user?.role ?? 'admin';

  mobileOpen = false;

  navItems: NavItem[] = this.buildNav();

  initials(): string {
    const name = this.user?.name ?? 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  private buildNav(): NavItem[] {
    const adminItems: NavItem[] = [
      { label: 'Dashboard', route: '/app/dashboard', icon: 'grid' },
      { label: 'Students', route: '/app/students', icon: 'users' },
      { label: 'Faculty', route: '/app/faculties', icon: 'teacher' },
      { label: 'Subjects', route: '/app/subjects', icon: 'book' },
      { label: 'Attendance', route: '/app/attendance', icon: 'calendar' },
      { label: 'Marks', route: '/app/marks', icon: 'clipboard' },
      { label: 'Results', route: '/app/results', icon: 'award' },
      { label: 'Reports', route: '/app/reports', icon: 'report' }
    ];

    const facultyItems: NavItem[] = [
      { label: 'Dashboard', route: '/app/f-dashboard', icon: 'grid' },
      { label: 'Students', route: '/app/students', icon: 'users' },
      { label: 'Attendance', route: '/app/attendance', icon: 'calendar' },
      { label: 'Marks', route: '/app/marks', icon: 'clipboard' },
      { label: 'Results', route: '/app/results', icon: 'award' }
    ];

    return this.role === 'admin' ? adminItems : facultyItems;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}