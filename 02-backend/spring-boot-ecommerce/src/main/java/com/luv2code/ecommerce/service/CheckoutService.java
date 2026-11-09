package com.luv2code.ecommerce.service;

import com.luv2code.ecommerce.dto.Purchase;
import com.luv2code.ecommerce.dto.PurchaseResponse;

public interface CheckoutService {

    /**
     * @param discountPercent member discount of the logged in buyer (0 for guests and admins)
     */
    PurchaseResponse placeOrder(Purchase purchase, int discountPercent);
}
