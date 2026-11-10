package com.luv2code.ecommerce.service;

import com.luv2code.ecommerce.dao.RoleRepo;
import com.luv2code.ecommerce.dao.UserRepo;
import com.luv2code.ecommerce.entity.Role;
import com.luv2code.ecommerce.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class UserServiceImpl implements UserService, UserDetailsService {

    private static final Logger log = LoggerFactory.getLogger(UserServiceImpl.class);

    private final UserRepo userRepo;
    private final RoleRepo roleRepo;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepo userRepo, RoleRepo roleRepo, PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepo.findByUsername(username);
        if (user == null) {
            log.error("User not found in the database");
            // you can create a global exception handling for your app check @ExceptionHandler annotation and @ControllerAdvice
            throw new UsernameNotFoundException("User not found in the database");
        }
        log.info("User found in the database: {}", username);

        List<SimpleGrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(role.getName()))
                .toList();

        return new org.springframework.security.core.userdetails.User(user.getUsername(), user.getPassword(), authorities);
    }

    @Override
    public User saveUser(User user) {
        log.info("Saving new user {} to the database", user.getName());
        // passwords are stored as BCrypt hashes so that login can verify them
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepo.save(user);
    }

    @Override
    public Role saveRole(Role role) {
        log.info("Saving new role {} to the database", role.getName());
        return roleRepo.save(role);
    }

    @Override
    public void addRoleToUser(String username, String roleName) {
        log.info("Adding role {} to user {}", roleName, username);
        User user = userRepo.findByUsername(username);
        Role role = roleRepo.findByName(roleName);
        user.getRoles().add(role);
        userRepo.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public User getUser(String username) {
        return userRepo.findByUsername(username);
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> getUsers() {
        return userRepo.findAll();
    }

    @Override
    public void setDiscount(String username, int discountPercent) {
        User user = userRepo.findByUsername(username);
        user.setDiscountPercent(discountPercent);
        userRepo.save(user);
    }

    @Override
    public void setProductDiscounts(String username, java.util.Map<Long, Integer> productDiscounts) {
        User user = userRepo.findByUsername(username);
        user.getProductDiscounts().clear();
        user.getProductDiscounts().putAll(productDiscounts);
        userRepo.save(user);
    }

    @Override
    public void deleteUser(String username) {
        log.info("Deleting user {}", username);
        User user = userRepo.findByUsername(username);
        if (user != null) {
            userRepo.delete(user);
        }
    }

    @Override
    public void removeRole(String roleName) {
        Role role = roleRepo.findByName(roleName);
        if (role == null) {
            return;
        }
        log.info("Removing role {}", roleName);
        for (User user : userRepo.findAll()) {
            if (user.getRoles().removeIf(r -> r.getName().equals(roleName))) {
                userRepo.save(user);
            }
        }
        roleRepo.delete(role);
    }

    @Override
    public void updateName(String username, String name) {
        User user = userRepo.findByUsername(username);
        user.setName(name);
        userRepo.save(user);
    }

    @Override
    public boolean changePassword(String username, String currentPassword, String newPassword) {
        User user = userRepo.findByUsername(username);
        if (user == null || currentPassword == null || !passwordEncoder.matches(currentPassword, user.getPassword())) {
            return false;
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepo.save(user);
        log.info("Password changed for user {}", username);
        return true;
    }
}
