package com.luv2code.ecommerce.dto;

import java.math.BigDecimal;

/**
 * @param subtotal       sum of the items at catalog prices
 * @param memberDiscount amount taken off for logged in members (0 for guests)
 * @param totalPrice     what the customer pays
 */
public record PurchaseResponse(String orderTrackingNumber, BigDecimal subtotal, BigDecimal memberDiscount,
                               BigDecimal totalPrice) {
}
