package com.luv2code.ecommerce.dao;

import com.luv2code.ecommerce.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

@RepositoryRestResource(exported = false)
public interface RoleRepo extends JpaRepository<Role, Long> {
    Role findByName(String name);
}
