package com.luv2code.ecommerce.controller;

import com.luv2code.ecommerce.dao.ProductCategoryRepository;
import com.luv2code.ecommerce.dao.ProductRepository;
import com.luv2code.ecommerce.entity.ProductCategory;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;

/** Public catalog info for the shop's sidebar: how many products each category has. */
@RestController
@RequestMapping("/api/catalog")
public class CatalogController {

    private final ProductCategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CatalogController(ProductCategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    @GetMapping("/category-counts")
    public CategoryCounts categoryCounts() {
        List<CategoryCount> categories = categoryRepository.findAll().stream()
                .sorted(Comparator.comparing(ProductCategory::getId))
                .map(c -> new CategoryCount(c.getId(),
                        productRepository.findByCategoryId(c.getId(), Pageable.ofSize(1)).getTotalElements()))
                .toList();
        return new CategoryCounts(productRepository.count(), categories);
    }

    record CategoryCount(Long id, long count) {
    }

    record CategoryCounts(long total, List<CategoryCount> categories) {
    }
}
