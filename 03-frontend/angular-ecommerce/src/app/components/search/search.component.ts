import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrl: './search.component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class SearchComponent {
  private router = inject(Router);

  doSearch(value: string) {
    const keyword = value.trim();
    if (keyword) {
      this.router.navigateByUrl(`/search/${encodeURIComponent(keyword)}`);
    }
  }
}
