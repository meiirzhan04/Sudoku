package com.sudokumind.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.jwt")
public record JwtConfig(
        String secret,
        long accessTokenMinutes,
        long refreshTokenDays,
        long refreshTokenRememberDays
) {
}
