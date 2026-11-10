package com.luv2code.ecommerce.controller;

import com.luv2code.ecommerce.dao.ContactMessageRepository;
import com.luv2code.ecommerce.dao.ProductCategoryRepository;
import com.luv2code.ecommerce.dao.ProductRepository;
import com.luv2code.ecommerce.dao.RoleRepo;
import com.luv2code.ecommerce.entity.ContactMessage;
import com.luv2code.ecommerce.entity.Product;
import com.luv2code.ecommerce.entity.ProductCategory;
import com.luv2code.ecommerce.entity.Role;
import com.luv2code.ecommerce.entity.User;
import com.luv2code.ecommerce.service.UserService;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;

/**
 * Admin-only endpoints (secured with ROLE_ADMIN in SecurityConfig):
 * manage members, product categories and products.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private static final String DEFAULT_IMAGE = "assets/images/products/placeholder.png";

    private final UserService userService;
    private final RoleRepo roleRepo;
    private final ProductCategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ContactMessageRepository contactMessageRepository;

    public AdminController(UserService userService, RoleRepo roleRepo,
                           ProductCategoryRepository categoryRepository, ProductRepository productRepository,
                           ContactMessageRepository contactMessageRepository) {
        this.userService = userService;
        this.roleRepo = roleRepo;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.contactMessageRepository = contactMessageRepository;
    }

    // ---------- members ----------

    @GetMapping("/roles")
    public List<String> getRoles() {
        return roleRepo.findAll().stream().map(Role::getName).sorted().toList();
    }

    @GetMapping("/users")
    @Transactional(readOnly = true)
    public List<MemberResponse> getUsers() {
        return userService.getUsers().stream()
                .sorted(Comparator.comparing(User::getId))
                .map(MemberResponse::from)
                .toList();
    }

    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public MemberResponse createUser(@RequestBody CreateMemberRequest request) {
        String name = required(request.name(), "Name");
        String username = required(request.username(), "Username").toLowerCase(Locale.ROOT);
        String password = required(request.password(), "Password");
        if (password.length() < 4) {
            throw badRequest("Password must be at least 4 characters");
        }
        if (userService.getUser(username) != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username '" + username + "' is already taken");
        }

        List<String> roles = request.roles() == null || request.roles().isEmpty()
                ? List.of("ROLE_USER")
                : request.roles();
        for (String role : roles) {
            if (roleRepo.findByName(role) == null) {
                throw badRequest("Unknown role " + role);
            }
        }

        int discount = request.discountPercent() == null ? 0 : request.discountPercent();
        validateDiscount(discount);

        userService.saveUser(new User(null, name, username, password, new ArrayList<>()));
        roles.forEach(role -> userService.addRoleToUser(username, role));
        if (discount > 0) {
            if (!userService.getUser(username).isDiscountEligible()) {
                throw badRequest("Admins cannot get a member discount");
            }
            userService.setDiscount(username, discount);
        }

        return MemberResponse.from(userService.getUser(username));
    }

    // the member's discount on every product (products with their own discount keep theirs)
    @PutMapping("/users/{username}/discount")
    @Transactional
    public MemberResponse setDiscount(@PathVariable String username, @RequestBody DiscountRequest request) {
        eligibleMember(username);
        int discount = request.discountPercent() == null ? 0 : request.discountPercent();
        validateDiscount(discount);
        userService.setDiscount(username, discount);
        return MemberResponse.from(userService.getUser(username));
    }

    // replaces the member's own discounts per product (product id -> percent; 0 removes it)
    @PutMapping("/users/{username}/product-discounts")
    @Transactional
    public MemberResponse setProductDiscounts(@PathVariable String username,
                                              @RequestBody ProductDiscountMapRequest request) {
        eligibleMember(username);
        Map<Long, Integer> discounts = new HashMap<>();
        if (request.discounts() != null) {
            request.discounts().forEach((productId, percent) -> {
                int value = percent == null ? 0 : percent;
                validateDiscount(value);
                if (!productRepository.existsById(productId)) {
                    throw badRequest("Product " + productId + " does not exist");
                }
                if (value > 0) {
                    discounts.put(productId, value);
                }
            });
        }
        userService.setProductDiscounts(username, discounts);
        return MemberResponse.from(userService.getUser(username));
    }

    private User eligibleMember(String username) {
        User user = userService.getUser(username);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Member '" + username + "' does not exist");
        }
        if (!user.isDiscountEligible()) {
            throw badRequest("Admins cannot get a member discount");
        }
        return user;
    }

    // an admin cannot delete their own account or the last remaining admin
    @DeleteMapping("/users/{username}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void deleteUser(@PathVariable String username, Authentication authentication) {
        User user = userService.getUser(username);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Member '" + username + "' does not exist");
        }
        if (user.getUsername().equals(authentication.getName())) {
            throw badRequest("You cannot delete your own account");
        }
        if (!user.isDiscountEligible()) {
            long admins = userService.getUsers().stream().filter(u -> !u.isDiscountEligible()).count();
            if (admins <= 1) {
                throw badRequest("The last admin cannot be deleted");
            }
        }
        userService.deleteUser(username);
    }

    // ---------- categories ----------

    // categories with how many products each one has
    @GetMapping("/categories")
    public List<CategoryResponse> getCategories() {
        return categoryRepository.findAll().stream()
                .sorted(Comparator.comparing(ProductCategory::getId))
                .map(c -> new CategoryResponse(c.getId(), c.getCategoryName(),
                        productRepository.findByCategoryId(c.getId(), Pageable.ofSize(1)).getTotalElements()))
                .toList();
    }

    // deletes the category together with its products (cascade) and removes those products
    // from members' selected discount products
    @DeleteMapping("/categories/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void deleteCategory(@PathVariable Long id) {
        ProductCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category " + id + " does not exist"));
        List<Long> productIds = productRepository.findByCategoryId(id, Pageable.unpaged()).stream()
                .map(Product::getId)
                .toList();
        userService.getUsers().forEach(user -> user.getProductDiscounts().keySet().removeAll(productIds));
        categoryRepository.delete(category);
    }

    @PostMapping("/categories")
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse createCategory(@RequestBody CreateCategoryRequest request) {
        String name = required(request.categoryName(), "Category name").toUpperCase(Locale.ROOT);

        boolean exists = categoryRepository.findAll().stream()
                .anyMatch(c -> c.getCategoryName().equalsIgnoreCase(name));
        if (exists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Category '" + name + "' already exists");
        }

        ProductCategory category = new ProductCategory();
        category.setCategoryName(name);
        ProductCategory saved = categoryRepository.save(category);
        return new CategoryResponse(saved.getId(), saved.getCategoryName(), 0);
    }

    // ---------- products ----------

    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse createProduct(@RequestBody CreateProductRequest request) {
        if (request.categoryId() == null) {
            throw badRequest("Category is required");
        }
        ProductCategory category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> badRequest("Category " + request.categoryId() + " does not exist"));
        if (request.unitPrice() == null || request.unitPrice().signum() <= 0) {
            throw badRequest("Price must be greater than 0");
        }
        if (request.unitsInStock() == null || request.unitsInStock() < 0) {
            throw badRequest("Units in stock cannot be negative");
        }

        Product product = new Product();
        product.setCategory(category);
        product.setName(required(request.name(), "Name"));
        product.setSku(required(request.sku(), "SKU").toUpperCase(Locale.ROOT));
        product.setDescription(request.description() == null ? "" : request.description().trim());
        product.setUnitPrice(request.unitPrice());
        product.setUnitsInStock(request.unitsInStock());
        product.setImageUrl(request.imageUrl() == null || request.imageUrl().isBlank()
                ? DEFAULT_IMAGE
                : request.imageUrl().trim());
        product.setActive(true);
        int sale = request.salePercent() == null ? 0 : request.salePercent();
        validateDiscount(sale);
        product.setSalePercent(sale);
        product.setMemberDiscountEnabled(request.memberDiscountEnabled() == null || request.memberDiscountEnabled());

        Product saved = productRepository.save(product);
        return new ProductResponse(saved.getId(), saved.getName(), category.getId());
    }

    // sale % for everyone and whether member discounts apply to this product
    @PutMapping("/products/{id}/discounts")
    public ProductResponse setProductDiscounts(@PathVariable Long id, @RequestBody ProductDiscountsRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product " + id + " does not exist"));
        if (request.salePercent() != null) {
            validateDiscount(request.salePercent());
            product.setSalePercent(request.salePercent());
        }
        if (request.memberDiscountEnabled() != null) {
            product.setMemberDiscountEnabled(request.memberDiscountEnabled());
        }
        Product saved = productRepository.save(product);
        return new ProductResponse(saved.getId(), saved.getName(), saved.getCategory().getId());
    }

    // deletes the product and removes it from members' selected discount products;
    // past orders keep their own copy of the price (order items only store the product id)
    @DeleteMapping("/products/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void deleteProduct(@PathVariable Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product " + id + " does not exist"));
        userService.getUsers().forEach(user -> user.getProductDiscounts().remove(id));
        productRepository.delete(product);
    }

    // ---------- contact messages ----------

    @GetMapping("/messages")
    public List<ContactMessage> getMessages() {
        return contactMessageRepository.findAllByOrderByDateCreatedDesc();
    }

    @PutMapping("/messages/{id}/handled")
    public ContactMessage setHandled(@PathVariable Long id, @RequestBody HandledRequest request) {
        ContactMessage message = contactMessageRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Message " + id + " does not exist"));
        message.setHandled(Boolean.TRUE.equals(request.handled()));
        return contactMessageRepository.save(message);
    }

    // ---------- helpers & DTOs ----------

    private static String required(String value, String field) {
        if (value == null || value.isBlank()) {
            throw badRequest(field + " is required");
        }
        return value.trim();
    }

    private static void validateDiscount(int discount) {
        if (discount < 0 || discount > 90) {
            throw badRequest("Discount must be between 0 and 90 %");
        }
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    record CreateMemberRequest(String name, String username, String password, List<String> roles,
                               Integer discountPercent) {
    }

    record DiscountRequest(Integer discountPercent) {
    }

    record ProductDiscountMapRequest(Map<Long, Integer> discounts) {
    }

    record ProductDiscountsRequest(Integer salePercent, Boolean memberDiscountEnabled) {
    }

    record HandledRequest(Boolean handled) {
    }

    record MemberResponse(Long id, String name, String username, List<String> roles,
                          int discountPercent, boolean discountEligible, Map<Long, Integer> productDiscounts) {
        static MemberResponse from(User user) {
            return new MemberResponse(user.getId(), user.getName(), user.getUsername(),
                    user.getRoles().stream().map(Role::getName).sorted().toList(),
                    user.getEffectiveDiscountPercent(), user.isDiscountEligible(),
                    user.isDiscountEligible() ? new TreeMap<>(user.getProductDiscounts()) : Map.of());
        }
    }

    record CreateCategoryRequest(String categoryName) {
    }

    record CategoryResponse(Long id, String categoryName, long productCount) {
    }

    record CreateProductRequest(String name, String sku, String description, BigDecimal unitPrice,
                                Integer unitsInStock, String imageUrl, Long categoryId, Integer salePercent,
                                Boolean memberDiscountEnabled) {
    }

    record ProductResponse(Long id, String name, Long categoryId) {
    }
}
