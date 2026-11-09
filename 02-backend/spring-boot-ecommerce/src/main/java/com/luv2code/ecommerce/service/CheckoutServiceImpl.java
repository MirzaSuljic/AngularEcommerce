package com.luv2code.ecommerce.service;

import com.luv2code.ecommerce.dao.CustomerRepository;
import com.luv2code.ecommerce.dao.ProductRepository;
import com.luv2code.ecommerce.dto.Purchase;
import com.luv2code.ecommerce.dto.PurchaseResponse;
import com.luv2code.ecommerce.entity.Customer;
import com.luv2code.ecommerce.entity.Order;
import com.luv2code.ecommerce.entity.OrderItem;
import com.luv2code.ecommerce.entity.Product;
import com.luv2code.ecommerce.entity.User;
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
    public PurchaseResponse placeOrder(Purchase purchase, User buyer) {
        Order order = purchase.order();
        Set<OrderItem> orderItems = purchase.orderItems();
        if (order == null || orderItems == null || orderItems.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The order has no items");
        }

        // prices always come from the catalog, never from the browser;
        // each item gets the product sale, then the buyer's member discount on top
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal total = BigDecimal.ZERO;
        int totalQuantity = 0;
        for (OrderItem item : orderItems) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Product " + item.getProductId() + " does not exist"));
            if (item.getQuantity() < 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity must be at least 1");
            }
            BigDecimal quantity = BigDecimal.valueOf(item.getQuantity());
            BigDecimal paidUnitPrice = Pricing.unitPrice(product, buyer);

            item.setUnitPrice(paidUnitPrice);
            item.setImageUrl(product.getImageUrl());
            subtotal = subtotal.add(product.getUnitPrice().multiply(quantity));
            total = total.add(paidUnitPrice.multiply(quantity));
            totalQuantity += item.getQuantity();
            order.add(item);
        }
        subtotal = subtotal.setScale(2, RoundingMode.HALF_UP);
        total = total.setScale(2, RoundingMode.HALF_UP);
        BigDecimal discount = subtotal.subtract(total);

        String orderTrackingNumber = generateOrderTrackingNumber();
        order.setOrderTrackingNumber(orderTrackingNumber);
        order.setTotalQuantity(totalQuantity);
        order.setTotalPrice(total);
        order.setStatus("PLACED");

        order.setBillingAddress(purchase.billingAddress());
        order.setShippingAddress(purchase.shippingAddress());

        Customer customer = purchase.customer();
        customer.add(order);

        customerRepository.save(customer);

        return new PurchaseResponse(orderTrackingNumber, subtotal, discount, total);
    }

    private String generateOrderTrackingNumber() {
        return UUID.randomUUID().toString();
    }
}
