export class Product {
  /** sale discount in percent for everyone (0 = no sale) */
  salePercent?: number;
  /** false when an admin switched member discounts off for this product */
  memberDiscountEnabled?: boolean;

  constructor(
    public id: string,
    public sku: string,
    public name: string,
    public description: string,
    public unitPrice: number,
    public imageUrl: string,
    public active: boolean,
    public unitsInStock: number,
    public dateCreated: Date,
    public lastUpdated: Date
  ) {}
}
