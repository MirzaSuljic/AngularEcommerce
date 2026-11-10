import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { Product } from '../common/product';
import { ProductCategory } from '../common/product-category';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private http = inject(HttpClient);

  private baseUrl = `${environment.apiUrl}/products`;
  private categoryUrl = `${environment.apiUrl}/product-category`;

  getProductList(theCategoryId: number): Observable<Product[]> {
    const searchUrl = `${this.baseUrl}/search/findByCategoryId?id=${theCategoryId}`;
    return this.getProducts(searchUrl);
  }

  // categories are loaded once and shared by the menu, the product list and the admin panel;
  // reloadCategories() refreshes everyone after an admin adds a category
  private categoriesSubject = new BehaviorSubject<ProductCategory[] | null>(null);

  getProductCategories(): Observable<ProductCategory[]> {
    if (this.categoriesSubject.value === null) {
      this.reloadCategories();
    }
    return this.categoriesSubject.pipe(filter((c): c is ProductCategory[] => c !== null));
  }

  // product count per category for the sidebar ({ total, categories: [{ id, count }] })
  private countsSubject = new BehaviorSubject<CategoryCounts | null>(null);

  getCategoryCounts(): Observable<CategoryCounts> {
    if (this.countsSubject.value === null) {
      this.reloadCounts();
    }
    return this.countsSubject.pipe(filter((c): c is CategoryCounts => c !== null));
  }

  /** Call after products or categories were added or deleted. */
  reloadCounts() {
    this.http
      .get<CategoryCounts>(`${environment.apiUrl}/catalog/category-counts`)
      .subscribe((counts) => this.countsSubject.next(counts));
  }

  reloadCategories() {
    this.reloadCounts();
    this.http
      .get<GetResponseProductCategory>(this.categoryUrl)
      .pipe(map((response) => response._embedded?.productCategory ?? []))
      .subscribe((categories) => this.categoriesSubject.next(categories));
  }

  searchProducts(theKeyword: string): Observable<Product[]> {
    const searchUrl = `${this.baseUrl}/search/findByNameContaining?name=${theKeyword}`;
    return this.getProducts(searchUrl);
  }

  getProductListPaginate(
    thePage: number,
    thePageSize: number,
    theCategoryId: number
  ): Observable<GetResponseProducts> {
    const searchUrl =
      `${this.baseUrl}/search/findByCategoryId?id=${theCategoryId}` +
      `&page=${thePage}&size=${thePageSize}`;
    return this.http.get<GetResponseProducts>(searchUrl);
  }

  /** Every product, a page at a time, sorted by name ("All products" in the shop). */
  getAllProductsPaginate(thePage: number, thePageSize: number): Observable<GetResponseProducts> {
    return this.http.get<GetResponseProducts>(
      `${this.baseUrl}?page=${thePage}&size=${thePageSize}&sort=name`
    );
  }

  searchProductListPaginate(
    thePage: number,
    thePageSize: number,
    theKeyword: string
  ): Observable<GetResponseProducts> {
    const searchUrl =
      `${this.baseUrl}/search/findByNameContaining?name=${theKeyword}` +
      `&page=${thePage}&size=${thePageSize}`;
    return this.http.get<GetResponseProducts>(searchUrl);
  }

  /** Every product (for admin pickers). */
  getAllProducts(): Observable<Product[]> {
    return this.getProducts(`${this.baseUrl}?size=1000&sort=name`);
  }

  getProduct(theProductId: number): Observable<Product> {
    const productUrl = `${this.baseUrl}/${theProductId}`;
    return this.http.get<Product>(productUrl);
  }

  private getProducts(searchUrl: string): Observable<Product[]> {
    return this.http
      .get<GetResponseProducts>(searchUrl)
      .pipe(map((response) => response._embedded?.products ?? []));
  }
}

export interface GetResponseProducts {
  // Spring Data REST leaves out "_embedded" when a page is empty
  _embedded?: {
    products: Product[];
  };

  page: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

export interface CategoryCounts {
  total: number;
  categories: { id: number; count: number }[];
}

interface GetResponseProductCategory {
  _embedded?: {
    productCategory: ProductCategory[];
  };
}
