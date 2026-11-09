package com.luv2code.ecommerce.dto;

import com.luv2code.ecommerce.entity.Address;
import com.luv2code.ecommerce.entity.Customer;
import com.luv2code.ecommerce.entity.Order;
import com.luv2code.ecommerce.entity.OrderItem;

import java.util.Set;

// it is not good practice to send entity classes as request or responses , use something like CustomerRequest or customerDTO
public record Purchase(
        Customer customer,
        Address shippingAddress,
        Address billingAddress,
        Order order,
        Set<OrderItem> orderItems) {
}
