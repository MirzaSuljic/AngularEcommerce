package com.luv2code.ecommerce.dao;

import com.luv2code.ecommerce.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepo extends JpaRepository<User, Long> {
    User findByUsername(String username);
}
