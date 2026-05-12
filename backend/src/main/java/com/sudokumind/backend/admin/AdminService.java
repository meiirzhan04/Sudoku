package com.sudokumind.backend.admin;

import com.sudokumind.backend.admin.dto.AdminUserResponse;
import com.sudokumind.backend.admin.dto.AdminUserUpdateRequest;
import com.sudokumind.backend.common.enums.UserRole;
import com.sudokumind.backend.common.exception.ApiException;
import com.sudokumind.backend.common.exception.ErrorCode;
import com.sudokumind.backend.user.dto.DashboardResponse;
import com.sudokumind.backend.user.dto.UserStatsDto;
import com.sudokumind.backend.user.entity.User;
import com.sudokumind.backend.user.repository.UserRepository;
import com.sudokumind.backend.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class AdminService {
    private final UserRepository userRepository;
    private final UserService userService;

    public AdminService(UserRepository userRepository, UserService userService) {
        this.userRepository = userRepository;
        this.userService = userService;
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
    public AdminUserResponse updateUser(UUID adminId, UUID userId, AdminUserUpdateRequest request) {
        assertAdmin(adminId);
        User user = userService.require(userId);
        if (request.fullName() != null && !request.fullName().isBlank()) user.setFullName(request.fullName());
        if (request.username() != null && !request.username().isBlank()) user.setUsername(request.username());
        if (request.city() != null) user.setCity(request.city());
        if (request.role() != null) user.setRole(request.role());
        if (request.emailVerified() != null) user.setEmailVerified(request.emailVerified());
        user.setXpOverride(request.xpOverride());
        user.setStreakOverride(request.streakOverride());
        return toResponse(userRepository.save(user));
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
