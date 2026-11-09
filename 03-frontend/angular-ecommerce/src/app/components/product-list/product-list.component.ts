import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { take } from 'rxjs/operators';

import { CartItem } from '../../common/cart-item';
import { Product } from '../../common/product';
import { CartService } from '../../services/cart.service';
import { GetResponseProducts, ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-list',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './product-list-grid.component.html',
  styleUrl: './product-list.component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private route = inject(ActivatedRoute);

  readonly pageSizeOptions = [4, 8, 12, 24];

  products: Product[] = [];
  loading = true;
  currentCategoryId = 1;
  previousCategoryId = 1;
  currentCategoryName = '';
  searchMode = false;

  thePageNumber = 1;
  thePageSize = 8;
  theTotalElements = 0;
  theTotalPages = 0;

  previousKeyword = '';
  keyword = '';

  // id of the product whose "Add to cart" button shows the confirmation
  justAddedId: string | null = null;
  private justAddedTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.route.paramMap.subscribe(() => {
      this.listProducts();
    });
  }

  get heading(): string {
    return this.searchMode ? `“${this.keyword}”` : this.currentCategoryName;
  }

  get pages(): number[] {
    // show at most 5 page numbers around the current page
    const total = this.theTotalPages;
    const start = Math.max(1, Math.min(this.thePageNumber - 2, total - 4));
    const end = Math.min(total, start + 4);
    const pages: number[] = [];
    for (let p = start; p <= end; p++) {
      pages.push(p);
    }
    return pages;
  }

  listProducts() {
    this.searchMode = this.route.snapshot.paramMap.has('keyword');

    if (this.searchMode) {
      this.handleSearchProducts();
    } else {
      this.handleListProducts();
    }
  }

  handleSearchProducts() {
    this.keyword = this.route.snapshot.paramMap.get('keyword')!;

    if (this.previousKeyword !== this.keyword) {
      this.thePageNumber = 1;
    }
    this.previousKeyword = this.keyword;

    this.loading = true;
    this.productService
      .searchProductListPaginate(this.thePageNumber - 1, this.thePageSize, this.keyword)
      .subscribe(this.processResult());
  }

  handleListProducts() {
    const hasCategoryId: boolean = this.route.snapshot.paramMap.has('id');

    if (hasCategoryId) {
      this.currentCategoryId = +this.route.snapshot.paramMap.get('id')!;
    } else {
      this.currentCategoryId = 1;
    }

    if (this.previousCategoryId !== this.currentCategoryId) {
      this.thePageNumber = 1;
    }

    this.previousCategoryId = this.currentCategoryId;

    this.productService.getProductCategories().pipe(take(1)).subscribe((categories) => {
      const category = categories.find((c) => c.id === this.currentCategoryId);
      this.currentCategoryName = category?.categoryName ?? '';
    });

    this.loading = true;
    this.productService
      .getProductListPaginate(this.thePageNumber - 1, this.thePageSize, this.currentCategoryId)
      .subscribe(this.processResult());
  }

  processResult() {
    return (data: GetResponseProducts) => {
      this.products = data._embedded?.products ?? [];
      this.thePageNumber = data.page.number + 1;
      this.thePageSize = data.page.size;
      this.theTotalElements = data.page.totalElements;
      this.theTotalPages = data.page.totalPages;
      this.loading = false;
    };
  }

  goToPage(page: number) {
    if (page < 1 || page > this.theTotalPages || page === this.thePageNumber) {
      return;
    }
    this.thePageNumber = page;
    this.listProducts();
  }

  updatePageSize(pageSize: string) {
    this.thePageSize = +pageSize;
    this.thePageNumber = 1;
    this.listProducts();
  }

  addToCart(theProduct: Product) {
    this.cartService.addToCart(new CartItem(theProduct));

    this.justAddedId = theProduct.id;
    clearTimeout(this.justAddedTimer);
    this.justAddedTimer = setTimeout(() => (this.justAddedId = null), 1500);
  }
}
