package com.luv2code.ecommerce.config;

import com.luv2code.ecommerce.entity.Country;
import com.luv2code.ecommerce.entity.Product;
import com.luv2code.ecommerce.entity.ProductCategory;
import com.luv2code.ecommerce.entity.State;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.rest.core.config.RepositoryRestConfiguration;
import org.springframework.data.rest.webmvc.config.RepositoryRestConfigurer;
import org.springframework.http.HttpMethod;
import org.springframework.web.servlet.config.annotation.CorsRegistry;

import javax.persistence.EntityManager;
import javax.persistence.metamodel.EntityType;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

// I think that you don't need this class to expose entity package, just call repository and convert result to DTO or response class
@Configuration
public class MyDataRestConfig  implements RepositoryRestConfigurer {

    private EntityManager entityManager;
    @Autowired
    public MyDataRestConfig(EntityManager theEntityManager){
        entityManager = theEntityManager;
    }
    @Override
    public void configureRepositoryRestConfiguration(RepositoryRestConfiguration config, CorsRegistry cors) {
        RepositoryRestConfigurer.super.configureRepositoryRestConfiguration(config, cors);

        HttpMethod[] theUnsupportetActions = {HttpMethod.PUT, HttpMethod.POST, HttpMethod.DELETE};

        //disable HTTP methods for Products : PUT, POST and DELETE
        disableHttpMethods( Product.class,config, theUnsupportetActions);
        disableHttpMethods(
                ProductCategory.class,config, theUnsupportetActions);
        disableHttpMethods( Country.class,config, theUnsupportetActions);
        disableHttpMethods(
                State.class,config, theUnsupportetActions);

        exposeIds(config);
    }

    private static void disableHttpMethods( Class theClass, RepositoryRestConfiguration config, HttpMethod[] theUnsupportetActions) {
        config.getExposureConfiguration()
                .forDomainType(theClass)
                .withItemExposure(((metdata, httpMethods) -> httpMethods.disable(theUnsupportetActions)))
                .withCollectionExposure(((metdata, httpMethods) -> httpMethods.disable(theUnsupportetActions)));
    }

    private void exposeIds(RepositoryRestConfiguration config){
            Set<EntityType<?>> entities = entityManager.getMetamodel().getEntities();

            List<Class> entityClasses = new ArrayList<>();

            for(EntityType tempEntityType: entities){
                entityClasses.add(tempEntityType.getJavaType());
            }

            Class[] domainTypes = entityClasses.toArray(new Class[0]);
            config.exposeIdsFor(domainTypes);


        }

}
