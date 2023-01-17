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

}
