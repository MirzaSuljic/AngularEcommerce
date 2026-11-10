package com.luv2code.ecommerce;

import com.luv2code.ecommerce.entity.Role;
import com.luv2code.ecommerce.entity.User;
import com.luv2code.ecommerce.service.UserService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.ArrayList;

@SpringBootApplication
public class SpringBootEcommerceApplication {

	public static void main(String[] args) {
		SpringApplication.run(SpringBootEcommerceApplication.class, args);
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	// seeds demo roles and users the first time the application starts
	@Bean
	CommandLineRunner run(UserService userService) {
		return args -> {
			// the super admin role is no longer used: admins do everything
			userService.removeRole("ROLE_SUPER_ADMIN");

			if (userService.getUser("john") != null) {
				return; // already seeded
			}

			userService.saveRole(new Role(null, "ROLE_USER"));
			userService.saveRole(new Role(null, "ROLE_MANAGER"));
			userService.saveRole(new Role(null, "ROLE_ADMIN"));

			userService.saveUser(new User(null, "John Travolta", "john", "1234", new ArrayList<>()));
			userService.saveUser(new User(null, "Will Smith", "will", "1234", new ArrayList<>()));
			userService.saveUser(new User(null, "Jim Carry", "jim", "1234", new ArrayList<>()));
			userService.saveUser(new User(null, "Arnold Schwarzenegger", "arnold", "1234", new ArrayList<>()));

			userService.addRoleToUser("john", "ROLE_USER");
			userService.addRoleToUser("john", "ROLE_MANAGER");
			userService.addRoleToUser("will", "ROLE_MANAGER");
			userService.addRoleToUser("jim", "ROLE_ADMIN");
			userService.addRoleToUser("arnold", "ROLE_ADMIN");
			userService.addRoleToUser("arnold", "ROLE_USER");

			// member discounts for regular users (admins never get one)
			userService.setDiscount("john", 10);
			// will has his own discounts on some coffee mugs: 15% on ids 26-28, 20% on ids 29-30
			userService.setProductDiscounts("will", java.util.Map.of(26L, 15, 27L, 15, 28L, 15, 29L, 20, 30L, 20));
		};
	}

}
