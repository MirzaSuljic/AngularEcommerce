package com.luv2code.ecommerce;

import com.luv2code.ecommerce.entity.Role;
import com.luv2code.ecommerce.entity.User;
import com.luv2code.ecommerce.service.UserService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.util.ArrayList;

@SpringBootApplication
public class SpringBootEcommerceApplication {


	public static void main(String[] args) {
		SpringApplication.run(SpringBootEcommerceApplication.class, args);
	}

	@Bean
	CommandLineRunner run(UserService userService){
		return args -> {


		userService.saveRole(new Role(null, "ROLE_USER"));
		userService.saveRole(new Role(null, "ROLE_MANAGER"));
		userService.saveRole(new Role(null, "ROLE_ADMIN"));
		userService.saveRole(new Role(null, "ROLE_SUPER_ADMIN"));

		userService.saveUser(new User(null, "John Travolta", "john", "1234", new ArrayList<>()));
		userService.saveUser(new User(null, "Will Smith", "will", "1234", new ArrayList<>()));
		userService.saveUser(new User(null, "Jim Carry", "jim", "1234", new ArrayList<>()));
		userService.saveUser(new User(null, "Arnold Schwarzenegger", "arnold", "1234", new ArrayList<>()));


		userService.addRoleToUser("john", "ROLE_USER");
		userService.addRoleToUser("john", "ROLE_MANAGER");
		userService.addRoleToUser("will", "ROLE_MANAGER");
		userService.addRoleToUser("jim", "ROLE_ADMIN");
		userService.addRoleToUser("arnold", "ROLE_SUPER_ADMIN");
		userService.addRoleToUser("arnold", "ROLE_ADMIN");
		userService.addRoleToUser("arnold", "ROLE_USER");
		};
	}

}
