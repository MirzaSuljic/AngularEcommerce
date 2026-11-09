package com.luv2code.ecommerce.service;

import com.luv2code.ecommerce.entity.Product;
import com.luv2code.ecommerce.entity.User;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * The single place where the price a customer pays is decided.
 * A product can be on sale for everyone, and a member can have a personal discount
 * (for all products or selected ones). An admin can switch member discounts off per product.
 * When both apply they stack: the member discount is taken off the sale price
 * (e.g. 50% sale + 10% member: $20.00 -> $10.00 -> $9.00).
 */
public final class Pricing {

    private Pricing() {
    }

    /** The member's discount for this product in percent (0 for guests, admins or when switched off). */
    public static int memberPercent(Product product, User buyer) {
        return buyer == null || !product.isMemberDiscountEnabled() ? 0 : buyer.memberDiscountFor(product.getId());
    }

    /** Unit price after the sale and then the member discount, each step rounded to cents. */
    public static BigDecimal unitPrice(Product product, User buyer) {
        BigDecimal salePrice = applyPercent(product.getUnitPrice(), product.getSalePercent());
        return applyPercent(salePrice, memberPercent(product, buyer));
    }

    private static BigDecimal applyPercent(BigDecimal price, int percent) {
        if (percent <= 0) {
            return price.setScale(2, RoundingMode.HALF_UP);
        }
        return price.multiply(BigDecimal.valueOf(100 - percent))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }
}
