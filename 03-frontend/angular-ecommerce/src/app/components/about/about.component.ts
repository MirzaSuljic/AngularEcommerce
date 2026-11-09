import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  imports: [RouterLink],
  templateUrl: './about.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AboutComponent {
  readonly stack = [
    { name: 'Angular 22', role: 'Standalone components, signals-ready, Tailwind CSS v4' },
    { name: 'Spring Boot 4', role: 'REST API, Spring Data REST, Spring Security with JWT' },
    { name: 'MySQL / H2', role: 'MySQL in production, H2 in memory for local development' },
  ];
}
