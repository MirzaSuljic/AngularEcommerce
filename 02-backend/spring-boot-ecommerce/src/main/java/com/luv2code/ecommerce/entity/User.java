package com.luv2code.ecommerce.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToMany;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

@Entity
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    private String name;
    private String username;

    // accepted when saving a user, never sent back in responses
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    @ManyToMany(fetch = FetchType.EAGER)
    private Collection<Role> roles = new ArrayList<>();

    // member discount in percent, set by an admin; only regular users get it (see isDiscountEligible)
    private Integer discountPercent = 0;

    // products the member discount applies to; empty = every product
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_discount_product", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "product_id")
    private Set<Long> discountProductIds = new HashSet<>();

    public User() {
    }

    public User(Long id, String name, String username, String password, Collection<Role> roles) {
        this.id = id;
        this.name = name;
        this.username = username;
        this.password = password;
        this.roles = roles;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Collection<Role> getRoles() { return roles; }
    public void setRoles(Collection<Role> roles) { this.roles = roles; }

    public Integer getDiscountPercent() { return discountPercent == null ? 0 : discountPercent; }
    public void setDiscountPercent(Integer discountPercent) { this.discountPercent = discountPercent; }

    public Set<Long> getDiscountProductIds() { return discountProductIds; }
    public void setDiscountProductIds(Set<Long> discountProductIds) { this.discountProductIds = discountProductIds; }

    /** Admins and super admins never get a member discount. */
    @JsonIgnore
    public boolean isDiscountEligible() {
        return roles.stream().noneMatch(r -> r.getName().equals("ROLE_ADMIN") || r.getName().equals("ROLE_SUPER_ADMIN"));
    }

    /** The member discount this user has (0 for admins and super admins). */
    @JsonIgnore
    public int getEffectiveDiscountPercent() {
        return isDiscountEligible() ? getDiscountPercent() : 0;
    }

    /** Member discount for one product: only if the discount covers all products or this one. */
    @JsonIgnore
    public int memberDiscountFor(Long productId) {
        if (discountProductIds.isEmpty() || discountProductIds.contains(productId)) {
            return getEffectiveDiscountPercent();
        }
        return 0;
    }
}
