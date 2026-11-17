import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Product } from '../../common/product';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { PriceComponent } from '../price/price.component';

@Component({
  selector: 'app-product-details',
  imports: [RouterLink, PriceComponent],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ProductDetailsComponent implements OnInit {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private route = inject(ActivatedRoute);

  product!: Product;
  justAdded = false;
  private justAddedTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.route.paramMap.subscribe(() => {
      this.handleProductDetails();
    });
  }

  handleProductDetails() {
    const theProductId = +this.route.snapshot.paramMap.get('id')!;

    this.productService.getProduct(theProductId).subscribe((data) => {
      this.product = data;
    });
  }

  addToCart() {
    this.cartService.addToCart(this.product);

    this.justAdded = true;
    clearTimeout(this.justAddedTimer);
    this.justAddedTimer = setTimeout(() => (this.justAdded = false), 1500);
  }

  /** how many of this product are already in the cart */
  get quantityInCart(): number {
    return this.cartService.quantityOf(this.product?.id);
  }
}
