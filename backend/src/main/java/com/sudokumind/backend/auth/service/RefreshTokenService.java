package com.sudokumind.backend.auth.service;

import com.sudokumind.backend.auth.entity.RefreshToken;
import com.sudokumind.backend.auth.repository.RefreshTokenRepository;
import com.sudokumind.backend.config.JwtConfig;
import com.sudokumind.backend.user.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

@Service
public class RefreshTokenService {
    private final RefreshTokenRepository repository;
    private final JwtConfig jwtConfig;
    private final SecureRandom secureRandom = new SecureRandom();

    public RefreshTokenService(RefreshTokenRepository repository, JwtConfig jwtConfig) {
        this.repository = repository;
        this.jwtConfig = jwtConfig;
    }

    @Transactional
    public RefreshToken create(User user, boolean rememberMe) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setToken(randomToken());
        long days = rememberMe ? jwtConfig.refreshTokenRememberDays() : jwtConfig.refreshTokenDays();
        refreshToken.setExpiresAt(Instant.now().plusSeconds(days * 24 * 60 * 60));
        return repository.save(refreshToken);
    }

    public RefreshToken findValid(String token) {
        RefreshToken refreshToken = repository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));
        if (refreshToken.isRevoked() || refreshToken.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Invalid refresh token");
        }
        return refreshToken;
    }

    @Transactional
    public void revoke(String token) {
        repository.findByToken(token).ifPresent(refreshToken -> {
            refreshToken.setRevoked(true);
            repository.save(refreshToken);
        });
    }

    private String randomToken() {
        byte[] bytes = new byte[48];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
