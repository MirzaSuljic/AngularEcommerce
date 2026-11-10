package com.luv2code.ecommerce.controller;

import com.luv2code.ecommerce.entity.Role;
import com.luv2code.ecommerce.entity.User;
import com.luv2code.ecommerce.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // profile of the user identified by the JWT in the Authorization header
    @GetMapping("/users/me")
    public ResponseEntity<CurrentUser> me(Authentication authentication) {
        User user = userService.getUser(authentication.getName());
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        List<String> roles = authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList();
        return ResponseEntity.ok(new CurrentUser(user.getUsername(), user.getName(), roles,
                user.getEffectiveDiscountPercent(),
                user.isDiscountEligible() ? new java.util.TreeMap<>(user.getProductDiscounts()) : java.util.Map.of()));
    }

    // the logged in user changes their own name
    @PutMapping("/users/me")
    public ResponseEntity<CurrentUser> updateMe(@RequestBody ProfileRequest request, Authentication authentication) {
        String name = request.name() == null ? "" : request.name().trim();
        if (name.isEmpty() || name.length() > 80) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name must be 1 to 80 characters");
        }
        userService.updateName(authentication.getName(), name);
        return me(authentication);
    }

    // the logged in user changes their own password (the current one must be right)
    @PutMapping("/users/me/password")
    public ResponseEntity<Void> changePassword(@RequestBody PasswordRequest request, Authentication authentication) {
        if (request.newPassword() == null || request.newPassword().length() < 4) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The new password must be at least 4 characters");
        }
        if (!userService.changePassword(authentication.getName(), request.currentPassword(), request.newPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The current password is not correct");
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getUsers() {
        return ResponseEntity.ok().body(userService.getUsers());
    }

    @PostMapping("/user/save")
    public ResponseEntity<User> saveUser(@RequestBody User user) {
        URI uri = URI.create(ServletUriComponentsBuilder.fromCurrentContextPath().path("/api/user/save").toUriString());
        return ResponseEntity.created(uri).body(userService.saveUser(user));
    }

    @PostMapping("/role/save")
    public ResponseEntity<Role> saveRole(@RequestBody Role role) {
        URI uri = URI.create(ServletUriComponentsBuilder.fromCurrentContextPath().path("/api/role/save").toUriString());
        return ResponseEntity.created(uri).body(userService.saveRole(role));
    }

    @PostMapping("/role/addtouser")
    public ResponseEntity<Void> addRoleToUser(@RequestBody RoleToUserForm form) {
        userService.addRoleToUser(form.username(), form.roleName());
        return ResponseEntity.ok().build();
    }

    record RoleToUserForm(String username, String roleName) {
    }

    record ProfileRequest(String name) {
    }

    record PasswordRequest(String currentPassword, String newPassword) {
    }

    record CurrentUser(String username, String name, List<String> roles, int discountPercent,
                       java.util.Map<Long, Integer> productDiscounts) {
    }
}
