package com.luv2code.ecommerce.service;

import com.luv2code.ecommerce.dao.CustomerRepository;
import com.luv2code.ecommerce.dao.ProductRepository;
import com.luv2code.ecommerce.dto.Purchase;
import com.luv2code.ecommerce.dto.PurchaseResponse;
import com.luv2code.ecommerce.entity.Customer;
import com.luv2code.ecommerce.entity.Order;
import com.luv2code.ecommerce.entity.OrderItem;
import com.luv2code.ecommerce.entity.Product;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Set;
import java.util.UUID;

@Service
public class CheckoutServiceImpl implements CheckoutService {

    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;

    public CheckoutServiceImpl(CustomerRepository customerRepository, ProductRepository productRepository) {
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
    }

    @Override
    @Transactional
    public PurchaseResponse placeOrder(Purchase purchase, int discountPercent) {
        Order order = purchase.order();
        Set<OrderItem> orderItems = purchase.orderItems();
        if (order == null || orderItems == null || orderItems.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The order has no items");
        }

        // prices always come from the catalog, never from the browser
        BigDecimal subtotal = BigDecimal.ZERO;
        int totalQuantity = 0;
        for (OrderItem item : orderItems) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Product " + item.getProductId() + " does not exist"));
            if (item.getQuantity() < 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity must be at least 1");
            }
            item.setUnitPrice(product.getUnitPrice());
            item.setImageUrl(product.getImageUrl());
            subtotal = subtotal.add(product.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
            totalQuantity += item.getQuantity();
            order.add(item);
        }

        BigDecimal discount = subtotal.multiply(BigDecimal.valueOf(discountPercent))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal total = subtotal.subtract(discount).setScale(2, RoundingMode.HALF_UP);

        String orderTrackingNumber = generateOrderTrackingNumber();
        order.setOrderTrackingNumber(orderTrackingNumber);
        order.setTotalQuantity(totalQuantity);
        order.setTotalPrice(total);
        order.setStatus(discountPercent > 0 ? "PLACED (member discount " + discountPercent + "%)" : "PLACED");

        order.setBillingAddress(purchase.billingAddress());
        order.setShippingAddress(purchase.shippingAddress());

        Customer customer = purchase.customer();
        customer.add(order);

        customerRepository.save(customer);

        return new PurchaseResponse(orderTrackingNumber, subtotal.setScale(2, RoundingMode.HALF_UP), discount, total);
    }

    private String generateOrderTrackingNumber() {
        return UUID.randomUUID().toString();
    }
}
