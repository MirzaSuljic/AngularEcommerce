package com.luv2code.ecommerce.dao;

import com.luv2code.ecommerce.entity.ContactMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.util.List;

// not exported by Spring Data REST: written by ContactController, read by admins via AdminController
@RepositoryRestResource(exported = false)
public interface ContactMessageRepository extends JpaRepository<ContactMessage, Long> {
    List<ContactMessage> findAllByOrderByDateCreatedDesc();
}
