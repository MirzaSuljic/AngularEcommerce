package com.luv2code.ecommerce.config;

import com.luv2code.ecommerce.dao.ProductCategoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;

/**
 * Fills an EMPTY database with the demo catalog from data-dev.sql (categories, 100 products,
 * countries, states, sale prices). Runs once: as soon as a category exists it does nothing.
 * In the "dev" profile H2 already loads the same file itself, so this skips there.
 * Turn off with SEED_DEMO_DATA=false.
 */
@Component
@Order(0)
public class DemoDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    private final ProductCategoryRepository categoryRepository;
    private final DataSource dataSource;
    private final boolean enabled;

    public DemoDataSeeder(ProductCategoryRepository categoryRepository, DataSource dataSource,
                          @Value("${app.seed-demo-data:true}") boolean enabled) {
        this.categoryRepository = categoryRepository;
        this.dataSource = dataSource;
        this.enabled = enabled;
    }

    @Override
    public void run(String... args) {
        if (!enabled || categoryRepository.count() > 0) {
            return;
        }
        log.info("Empty database: loading the demo catalog from data-dev.sql");
        ResourceDatabasePopulator populator = new ResourceDatabasePopulator(new ClassPathResource("data-dev.sql"));
        populator.setSqlScriptEncoding("UTF-8");
        populator.execute(dataSource);
    }
}
