package com.sudokumind.backend.common.util;

import com.sudokumind.backend.auth.security.AuthUserDetails;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

public final class CurrentUser {
    private CurrentUser() {
    }

    public static UUID id() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthUserDetails details)) {
            throw new IllegalStateException("No authenticated user");
        }
        return details.id();
    }
}
