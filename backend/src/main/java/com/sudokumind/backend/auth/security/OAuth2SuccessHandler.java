package com.sudokumind.backend.auth.security;

import com.sudokumind.backend.auth.service.AuthService;
import com.sudokumind.backend.common.enums.AuthProvider;
import com.sudokumind.backend.user.entity.User;
import com.sudokumind.backend.user.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Locale;

@Component
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {
    private final UserRepository userRepository;
    private final AuthService authService;
    private final String frontendUrl;
    private final String successRedirectPath;

    public OAuth2SuccessHandler(
            UserRepository userRepository,
            AuthService authService,
            @Value("${app.frontend-url}") String frontendUrl,
            @Value("${app.oauth2.success-redirect-path}") String successRedirectPath
    ) {
        this.userRepository = userRepository;
        this.authService = authService;
        this.frontendUrl = frontendUrl;
        this.successRedirectPath = successRedirectPath;
    }

    @Override
    @Transactional
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2User principal = (OAuth2User) authentication.getPrincipal();
        String email = principal.getAttribute("email");
        String name = principal.getAttribute("name");
        String picture = principal.getAttribute("picture");
        if (email == null) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Google email is missing");
            return;
        }

        User user = userRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
            User created = new User();
            created.setEmail(email.toLowerCase(Locale.ROOT));
            created.setFullName(name == null ? email : name);
            created.setUsername(uniqueUsername(email));
            created.setAvatarUrl(picture);
            created.setProvider(AuthProvider.GOOGLE);
            created.setEmailVerified(true);
            return userRepository.save(created);
        });

        var auth = authService.tokens(user, true);
        String redirect = UriComponentsBuilder.fromUriString(frontendUrl + successRedirectPath)
                .queryParam("accessToken", auth.accessToken())
                .queryParam("refreshToken", auth.refreshToken())
                .build()
                .toUriString();
        response.sendRedirect(redirect);
    }

    private String uniqueUsername(String email) {
        String base = email.substring(0, email.indexOf('@')).replaceAll("[^A-Za-z0-9_]", "");
        if (base.length() < 3) {
            base = "player";
        }
        String candidate = base;
        int suffix = 1;
        while (userRepository.existsByUsernameIgnoreCase(candidate)) {
            candidate = base + suffix++;
        }
        return candidate;
    }
}
