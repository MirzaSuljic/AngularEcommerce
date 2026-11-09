import { Product } from './product';
export class CartItem {
  id: string;
  name: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  salePercent: number;
  memberDiscountEnabled: boolean;

  constructor(product: Product) {
    this.id = product.id;
    this.name = product.name;
    this.imageUrl = product.imageUrl;
    this.unitPrice = product.unitPrice;
    this.quantity = 1;
    this.salePercent = product.salePercent ?? 0;
    this.memberDiscountEnabled = product.memberDiscountEnabled !== false;
  }
}
