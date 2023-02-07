package com.luv2code.ecommerce.service;

import com.luv2code.ecommerce.dto.Purchase;
import com.luv2code.ecommerce.dto.PurchaseResponse;
// create package for implementation   example  lu2code.eccomerce.service.impl and that package will have implementation of interfaces
public interface CheckoutService {
    PurchaseResponse placeOrder(Purchase purchase);
}
