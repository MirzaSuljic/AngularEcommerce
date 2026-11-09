package com.luv2code.ecommerce.controller;

import com.luv2code.ecommerce.dao.ContactMessageRepository;
import com.luv2code.ecommerce.entity.ContactMessage;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.regex.Pattern;

/** Public endpoint for the contact form. */
@RestController
@RequestMapping("/api/contact")
public class ContactController {

    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final ContactMessageRepository repository;

    public ContactController(ContactMessageRepository repository) {
        this.repository = repository;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ContactResponse send(@RequestBody ContactRequest request) {
        String name = required(request.name(), "Name", 100);
        String email = required(request.email(), "Email", 150);
        String subject = required(request.subject(), "Subject", 150);
        String message = required(request.message(), "Message", 2000);
        if (!EMAIL.matcher(email).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid email address");
        }

        ContactMessage contactMessage = new ContactMessage();
        contactMessage.setName(name);
        contactMessage.setEmail(email);
        contactMessage.setSubject(subject);
        contactMessage.setMessage(message);
        return new ContactResponse(repository.save(contactMessage).getId());
    }

    private static String required(String value, String field, int maxLength) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is required");
        }
        String trimmed = value.trim();
        if (trimmed.length() > maxLength) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is too long (max " + maxLength + ")");
        }
        return trimmed;
    }

    record ContactRequest(String name, String email, String subject, String message) {
    }

    record ContactResponse(Long id) {
    }
}
