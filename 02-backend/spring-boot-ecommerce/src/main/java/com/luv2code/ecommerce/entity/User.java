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
import jakarta.persistence.MapKeyColumn;
import jakarta.persistence.Table;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

// "user" is a reserved word in PostgreSQL
@Entity
@Table(name = "app_user")
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

    // member discount in percent on every product, set by an admin (0 = none);
    // only regular users get member discounts (see isDiscountEligible)
    private Integer discountPercent = 0;

    // own member discount per product (product id -> percent); overrides discountPercent for that product
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_product_discount", joinColumns = @JoinColumn(name = "user_id"))
    @MapKeyColumn(name = "product_id")
    @Column(name = "percent")
    private Map<Long, Integer> productDiscounts = new HashMap<>();

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

    public Map<Long, Integer> getProductDiscounts() { return productDiscounts; }
    public void setProductDiscounts(Map<Long, Integer> productDiscounts) { this.productDiscounts = productDiscounts; }

    /** Admins never get a member discount. */
    @JsonIgnore
    public boolean isDiscountEligible() {
        return roles.stream().noneMatch(r -> r.getName().equals("ROLE_ADMIN"));
    }

    /** The member discount this user has (0 for admins). */
    @JsonIgnore
    public int getEffectiveDiscountPercent() {
        return isDiscountEligible() ? getDiscountPercent() : 0;
    }

    /** Member discount for one product: its own percent if the admin set one, otherwise the all-products percent. */
    @JsonIgnore
    public int memberDiscountFor(Long productId) {
        if (!isDiscountEligible()) {
            return 0;
        }
        Integer own = productDiscounts.get(productId);
        return own != null ? own : getDiscountPercent();
    }
}
