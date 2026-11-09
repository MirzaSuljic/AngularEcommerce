package com.luv2code.ecommerce.service;

import com.luv2code.ecommerce.dto.Purchase;
import com.luv2code.ecommerce.dto.PurchaseResponse;
import com.luv2code.ecommerce.entity.User;

public interface CheckoutService {

    /**
     * @param buyer the logged in user, or null for guests (used for the member discount)
     */
    PurchaseResponse placeOrder(Purchase purchase, User buyer);
}
