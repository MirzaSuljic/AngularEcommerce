package com.luv2code.ecommerce.dto;

import com.luv2code.ecommerce.entity.Customer;
import com.luv2code.ecommerce.entity.Address;
import com.luv2code.ecommerce.entity.Order;
import com.luv2code.ecommerce.entity.OrderItem;
import lombok.Data;

import java.util.Set;

@Data
public class Purchase {
    // it is not good practice to send entity classes as request or responses , use something like CustomerRequest or customerDTO
    private Customer customer;
    private Address shippingAddress;
    private Address billingAddress;
    private Order order;
    private Set<OrderItem> orderItems;

}
