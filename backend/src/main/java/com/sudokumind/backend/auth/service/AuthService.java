package com.sudokumind.backend.auth.service;

import com.sudokumind.backend.auth.dto.*;
import com.sudokumind.backend.auth.entity.RefreshToken;
import com.sudokumind.backend.auth.security.JwtService;
import com.sudokumind.backend.common.enums.AuthProvider;
import com.sudokumind.backend.common.enums.Language;
import com.sudokumind.backend.common.exception.ApiException;
import com.sudokumind.backend.common.exception.ErrorCode;
import com.sudokumind.backend.user.dto.UserResponse;
import com.sudokumind.backend.user.entity.User;
import com.sudokumind.backend.user.repository.UserRepository;
import com.sudokumind.backend.user.service.UserMapper;
import com.sudokumind.backend.user.service.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final UserMapper userMapper;
    private final UserService userService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            RefreshTokenService refreshTokenService,
            UserMapper userMapper,
            UserService userService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.userMapper = userMapper;
        this.userService = userService;
    }

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        if (!request.password().equals(request.confirmPassword())) {
            throw new IllegalArgumentException("confirmPassword must match password");
        }
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ApiException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        if (userRepository.existsByUsernameIgnoreCase(request.username())) {
            throw new ApiException(ErrorCode.USERNAME_ALREADY_EXISTS);
        }

        User user = new User();
        user.setFullName(request.fullName());
        user.setUsername(request.username());
        user.setEmail(request.email().toLowerCase(Locale.ROOT));
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setCity(request.city());
        user.setLanguage(request.language() == null ? Language.en : request.language());
        user.setProvider(AuthProvider.LOCAL);
        user.setEmailVerified(false);
        userRepository.save(user);
        return new RegisterResponse("Registration successful. Please check your email.", user.getId());
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new ApiException(ErrorCode.INVALID_CREDENTIALS));
        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(ErrorCode.INVALID_CREDENTIALS);
        }
        return tokens(user, request.rememberMe());
    }

    @Transactional
    public AuthResponse refresh(RefreshRequest request) {
        RefreshToken refreshToken = refreshTokenService.findValid(request.refreshToken());
        return tokens(refreshToken.getUser(), true);
    }

    @Transactional
    public void logout(LogoutRequest request) {
        refreshTokenService.revoke(request.refreshToken());
    }

    public UserResponse me(User user) {
        return userMapper.toResponse(user, userService.stats(user.getId()));
    }

    public String forgotPassword(ForgotPasswordRequest request) {
        return "If the email exists, a reset link will be sent.";
    }

    public String resetPassword(ResetPasswordRequest request) {
        if (!request.password().equals(request.confirmPassword())) {
            throw new IllegalArgumentException("confirmPassword must match password");
        }
        return "Password reset flow is ready for email-token integration.";
    }

    @Transactional
    public AuthResponse tokens(User user, boolean rememberMe) {
        String accessToken = jwtService.createAccessToken(user);
        RefreshToken refreshToken = refreshTokenService.create(user, rememberMe);
        return new AuthResponse(accessToken, refreshToken.getToken(), userMapper.toResponse(user, userService.stats(user.getId())));
    }
}
