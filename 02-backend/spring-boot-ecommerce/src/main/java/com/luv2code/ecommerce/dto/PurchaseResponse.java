package com.luv2code.ecommerce.dto;

import java.math.BigDecimal;

/**
 * @param subtotal   sum of the items at regular catalog prices
 * @param discount   amount saved through sales and the member discount
 * @param totalPrice what the customer pays
 */
public record PurchaseResponse(String orderTrackingNumber, BigDecimal subtotal, BigDecimal discount,
                               BigDecimal totalPrice) {
}
