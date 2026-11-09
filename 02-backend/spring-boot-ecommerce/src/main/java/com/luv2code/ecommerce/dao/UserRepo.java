package com.luv2code.ecommerce.dao;

import com.luv2code.ecommerce.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

// not exported by Spring Data REST: users are handled by UserController (and passwords must not leak)
@RepositoryRestResource(exported = false)
public interface UserRepo extends JpaRepository<User, Long> {
    User findByUsername(String username);
}
