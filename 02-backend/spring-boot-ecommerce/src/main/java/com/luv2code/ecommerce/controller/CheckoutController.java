package com.luv2code.ecommerce.controller;

import com.luv2code.ecommerce.dto.Purchase;
import com.luv2code.ecommerce.dto.PurchaseResponse;
import com.luv2code.ecommerce.entity.User;
import com.luv2code.ecommerce.service.CheckoutService;
import com.luv2code.ecommerce.service.UserService;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin("http://localhost:4200")
@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {

    private final CheckoutService checkoutService;
    private final UserService userService;

    public CheckoutController(CheckoutService checkoutService, UserService userService) {
        this.checkoutService = checkoutService;
        this.userService = userService;
    }

    // guests can buy too; with a valid JWT the buyer's member discount (set by an admin) is applied
    @PostMapping("/purchase")
    public PurchaseResponse placeOrder(@RequestBody Purchase purchase, Authentication authentication) {
        int discountPercent = 0;
        if (authentication != null && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken)) {
            User user = userService.getUser(authentication.getName());
            if (user != null) {
                discountPercent = user.getEffectiveDiscountPercent();
            }
        }

        return checkoutService.placeOrder(purchase, discountPercent);
    }
}
