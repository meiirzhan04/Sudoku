package com.sudokumind.backend.user.service;

import com.sudokumind.backend.user.dto.PublicUserResponse;
import com.sudokumind.backend.user.dto.UserResponse;
import com.sudokumind.backend.user.dto.UserStatsDto;
import com.sudokumind.backend.user.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {
    public UserResponse toResponse(User user, UserStatsDto stats) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getUsername(),
                user.getEmail(),
                user.getCity(),
                user.getAvatarUrl(),
                user.getLanguage(),
                user.getRole(),
                user.isEmailVerified(),
                stats
        );
    }

    public PublicUserResponse toPublic(User user, UserStatsDto stats) {
        return new PublicUserResponse(
                user.getId(),
                user.getFullName(),
                user.getUsername(),
                user.getCity(),
                user.getAvatarUrl(),
                user.getRole(),
                stats
        );
    }
}
