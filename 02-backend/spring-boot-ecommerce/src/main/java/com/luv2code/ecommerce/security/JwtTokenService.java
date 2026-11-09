package com.luv2code.ecommerce.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Creates and verifies the JWTs used by the Angular frontend.
 */
@Service
public class JwtTokenService {

    private static final String ISSUER = "luv2shop";
    private static final long ACCESS_TOKEN_VALIDITY_MS = 60 * 60 * 1000;          // 1 hour
    private static final long REFRESH_TOKEN_VALIDITY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

    private final Algorithm algorithm;
    private final JWTVerifier verifier;

    public JwtTokenService(@Value("${app.jwt.secret}") String secret) {
        this.algorithm = Algorithm.HMAC256(secret.getBytes(StandardCharsets.UTF_8));
        this.verifier = JWT.require(algorithm).withIssuer(ISSUER).build();
    }

    public String createAccessToken(UserDetails user) {
        return JWT.create()
                .withSubject(user.getUsername())
                .withIssuer(ISSUER)
                .withIssuedAt(new Date())
                .withExpiresAt(new Date(System.currentTimeMillis() + ACCESS_TOKEN_VALIDITY_MS))
                .withClaim("roles", user.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList())
                .sign(algorithm);
    }

    public String createRefreshToken(UserDetails user) {
        return JWT.create()
                .withSubject(user.getUsername())
                .withIssuer(ISSUER)
                .withIssuedAt(new Date())
                .withExpiresAt(new Date(System.currentTimeMillis() + REFRESH_TOKEN_VALIDITY_MS))
                .sign(algorithm);
    }

    /** @throws com.auth0.jwt.exceptions.JWTVerificationException if the token is invalid or expired */
    public DecodedJWT verify(String token) {
        return verifier.verify(token);
    }
}
