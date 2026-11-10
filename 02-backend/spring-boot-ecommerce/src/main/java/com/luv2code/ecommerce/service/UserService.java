package com.luv2code.ecommerce.service;

import com.luv2code.ecommerce.entity.Role;
import com.luv2code.ecommerce.entity.User;

import java.util.List;

public interface UserService {
    User saveUser(User user);
    Role saveRole(Role role);

    void addRoleToUser(String username, String roleName);
    User getUser(String username);
    List<User>getUsers();

    void setDiscount(String username, int discountPercent);

    /** Replaces the member's per-product discounts (product id -> percent). */
    void setProductDiscounts(String username, java.util.Map<Long, Integer> productDiscounts);

    void deleteUser(String username);

    void updateName(String username, String name);

    /** Sets a new password if the current one matches; false when it does not. */
    boolean changePassword(String username, String currentPassword, String newPassword);

    /** Removes a role from every user and deletes it (used to drop ROLE_SUPER_ADMIN). */
    void removeRole(String roleName);

}
