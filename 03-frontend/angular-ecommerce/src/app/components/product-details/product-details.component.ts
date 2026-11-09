import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { CartItem } from '../../common/cart-item';
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
  quantityInCart = 0;
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
      this.updateQuantityInCart();
    });
  }

  addToCart() {
    this.cartService.addToCart(new CartItem(this.product));
    this.updateQuantityInCart();

    this.justAdded = true;
    clearTimeout(this.justAddedTimer);
    this.justAddedTimer = setTimeout(() => (this.justAdded = false), 1500);
  }

  private updateQuantityInCart() {
    const item = this.cartService.cartItems.find((x) => x.id === this.product?.id);
    this.quantityInCart = item?.quantity ?? 0;
  }
}
