package com.sudokumind.backend.admin;

import com.sudokumind.backend.admin.dto.AdminActionResponse;
import com.sudokumind.backend.admin.dto.AdminPasswordResetRequest;
import com.sudokumind.backend.admin.dto.AdminUserCreateRequest;
import com.sudokumind.backend.admin.dto.AdminUserResponse;
import com.sudokumind.backend.admin.dto.AdminUserUpdateRequest;
import com.sudokumind.backend.common.enums.AuthProvider;
import com.sudokumind.backend.common.enums.Language;
import com.sudokumind.backend.ai.repository.AiHintLogRepository;
import com.sudokumind.backend.auth.repository.RefreshTokenRepository;
import com.sudokumind.backend.common.enums.UserRole;
import com.sudokumind.backend.common.exception.ApiException;
import com.sudokumind.backend.common.exception.ErrorCode;
import com.sudokumind.backend.daily.repository.DailyResultRepository;
import com.sudokumind.backend.friends.repository.FriendRepository;
import com.sudokumind.backend.friends.repository.FriendRequestRepository;
import com.sudokumind.backend.game.repository.GameSessionRepository;
import com.sudokumind.backend.multiplayer.repository.GameInviteRepository;
import com.sudokumind.backend.multiplayer.repository.MultiplayerMoveRepository;
import com.sudokumind.backend.multiplayer.repository.MultiplayerPlayerRepository;
import com.sudokumind.backend.multiplayer.repository.MultiplayerRoomRepository;
import com.sudokumind.backend.user.dto.DashboardResponse;
import com.sudokumind.backend.user.dto.UserStatsDto;
import com.sudokumind.backend.user.entity.User;
import com.sudokumind.backend.user.repository.UserRepository;
import com.sudokumind.backend.user.service.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class AdminService {
    private final UserRepository userRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenRepository refreshTokenRepository;
    private final FriendRepository friendRepository;
    private final FriendRequestRepository friendRequestRepository;
    private final DailyResultRepository dailyResultRepository;
    private final GameSessionRepository gameSessionRepository;
    private final AiHintLogRepository aiHintLogRepository;
    private final GameInviteRepository gameInviteRepository;
    private final MultiplayerMoveRepository multiplayerMoveRepository;
    private final MultiplayerPlayerRepository multiplayerPlayerRepository;
    private final MultiplayerRoomRepository multiplayerRoomRepository;

    public AdminService(
            UserRepository userRepository,
            UserService userService,
            PasswordEncoder passwordEncoder,
            RefreshTokenRepository refreshTokenRepository,
            FriendRepository friendRepository,
            FriendRequestRepository friendRequestRepository,
            DailyResultRepository dailyResultRepository,
            GameSessionRepository gameSessionRepository,
            AiHintLogRepository aiHintLogRepository,
            GameInviteRepository gameInviteRepository,
            MultiplayerMoveRepository multiplayerMoveRepository,
            MultiplayerPlayerRepository multiplayerPlayerRepository,
            MultiplayerRoomRepository multiplayerRoomRepository
    ) {
        this.userRepository = userRepository;
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.refreshTokenRepository = refreshTokenRepository;
        this.friendRepository = friendRepository;
        this.friendRequestRepository = friendRequestRepository;
        this.dailyResultRepository = dailyResultRepository;
        this.gameSessionRepository = gameSessionRepository;
        this.aiHintLogRepository = aiHintLogRepository;
        this.gameInviteRepository = gameInviteRepository;
        this.multiplayerMoveRepository = multiplayerMoveRepository;
        this.multiplayerPlayerRepository = multiplayerPlayerRepository;
        this.multiplayerRoomRepository = multiplayerRoomRepository;
    }

    public List<AdminUserResponse> users(UUID adminId, String query) {
        assertAdmin(adminId);
        String normalized = query == null ? "" : query.trim().toLowerCase();
        return userRepository.findAll().stream()
                .filter(user -> normalized.isBlank()
                        || contains(user.getUsername(), normalized)
                        || contains(user.getEmail(), normalized)
                        || contains(user.getFullName(), normalized))
                .sorted(Comparator.comparing(this::updatedAtOrEpoch).reversed())
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AdminUserResponse createUser(UUID adminId, AdminUserCreateRequest request) {
        assertAdmin(adminId);
        if (isBlank(request.fullName()) || isBlank(request.username()) || isBlank(request.email()) || isBlank(request.password())) {
            throw new IllegalArgumentException("Full name, username, email and password are required.");
        }
        if (request.password().length() < 8) {
            throw new IllegalArgumentException("Password must contain at least 8 characters.");
        }

        String username = request.username().trim();
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new ApiException(ErrorCode.USERNAME_ALREADY_EXISTS);
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ApiException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setCity(request.city());
        user.setLanguage(Language.en);
        user.setProvider(AuthProvider.LOCAL);
        user.setRole(request.role() == null ? UserRole.USER : request.role());
        user.setEmailVerified(request.emailVerified() != null && request.emailVerified());
        user.setXpOverride(request.xpOverride());
        user.setStreakOverride(request.streakOverride());
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public AdminUserResponse updateUser(UUID adminId, UUID userId, AdminUserUpdateRequest request) {
        assertAdmin(adminId);
        User user = userService.require(userId);
        if (request.fullName() != null && !request.fullName().isBlank()) {
            user.setFullName(request.fullName().trim());
        }
        if (request.username() != null && !request.username().isBlank()) {
            String username = request.username().trim();
            userRepository.findByUsernameIgnoreCase(username)
                    .filter(existing -> !existing.getId().equals(userId))
                    .ifPresent(existing -> {
                        throw new ApiException(ErrorCode.USERNAME_ALREADY_EXISTS);
                    });
            user.setUsername(username);
        }
        if (request.email() != null && !request.email().isBlank()) {
            String email = request.email().trim().toLowerCase(Locale.ROOT);
            userRepository.findByEmailIgnoreCase(email)
                    .filter(existing -> !existing.getId().equals(userId))
                    .ifPresent(existing -> {
                        throw new ApiException(ErrorCode.EMAIL_ALREADY_EXISTS);
                    });
            user.setEmail(email);
        }
        if (request.city() != null) user.setCity(request.city());
        if (request.role() != null) user.setRole(request.role());
        if (request.emailVerified() != null) user.setEmailVerified(request.emailVerified());
        user.setXpOverride(request.xpOverride());
        user.setStreakOverride(request.streakOverride());
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public AdminUserResponse resetPassword(UUID adminId, UUID userId, AdminPasswordResetRequest request) {
        assertAdmin(adminId);
        if (request.password() == null || request.password().length() < 8) {
            throw new IllegalArgumentException("Password must contain at least 8 characters.");
        }
        User user = userService.require(userId);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setEmailVerified(true);
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public AdminActionResponse deleteUser(UUID adminId, UUID userId) {
        assertAdmin(adminId);
        if (adminId.equals(userId)) {
            throw new ApiException(ErrorCode.ACCESS_DENIED);
        }
        User user = userService.require(userId);
        refreshTokenRepository.deleteByUserId(userId);
        friendRequestRepository.deleteAllForUser(userId);
        friendRepository.deleteAllForUser(userId);
        dailyResultRepository.deleteByUserId(userId);
        aiHintLogRepository.detachUser(userId);
        gameSessionRepository.detachUser(userId);
        gameInviteRepository.deleteAllForUser(userId);
        multiplayerMoveRepository.deleteAllForUser(userId);
        multiplayerPlayerRepository.deleteAllForUser(userId);
        multiplayerRoomRepository.deleteAllForUser(userId);
        userRepository.delete(user);
        return new AdminActionResponse(true, "User deleted.");
    }

    private void assertAdmin(UUID adminId) {
        User admin = userService.require(adminId);
        if (admin.getRole() != UserRole.ADMIN) {
            throw new ApiException(ErrorCode.ACCESS_DENIED);
        }
    }

    private boolean contains(String value, String query) {
        return value != null && value.toLowerCase().contains(query);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private Instant updatedAtOrEpoch(User user) {
        return user.getUpdatedAt() == null ? Instant.EPOCH : user.getUpdatedAt();
    }

    private AdminUserResponse toResponse(User user) {
        UserStatsDto stats = userService.stats(user.getId());
        DashboardResponse dashboard = userService.dashboard(user.getId());
        return new AdminUserResponse(
                user.getId(),
                user.getFullName(),
                user.getUsername(),
                user.getEmail(),
                user.getCity(),
                user.getRole(),
                user.isEmailVerified(),
                stats.gamesPlayed(),
                stats.wins(),
                stats.bestTimeSeconds(),
                stats.averageAccuracy(),
                dashboard.currentStreak(),
                dashboard.xp(),
                user.getXpOverride(),
                user.getStreakOverride(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
