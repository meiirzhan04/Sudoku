package com.sudokumind.backend.user.service;

import com.sudokumind.backend.common.exception.ApiException;
import com.sudokumind.backend.common.exception.ErrorCode;
import com.sudokumind.backend.friends.repository.FriendRepository;
import com.sudokumind.backend.game.repository.GameSessionRepository;
import com.sudokumind.backend.user.dto.PublicUserResponse;
import com.sudokumind.backend.user.dto.UpdateProfileRequest;
import com.sudokumind.backend.user.dto.UserResponse;
import com.sudokumind.backend.user.dto.UserStatsDto;
import com.sudokumind.backend.user.entity.User;
import com.sudokumind.backend.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final GameSessionRepository gameSessionRepository;
    private final FriendRepository friendRepository;

    public UserService(UserRepository userRepository, UserMapper userMapper, GameSessionRepository gameSessionRepository, FriendRepository friendRepository) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.gameSessionRepository = gameSessionRepository;
        this.friendRepository = friendRepository;
    }

    public User require(UUID id) {
        return userRepository.findById(id).orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
    }

    public UserResponse me(UUID id) {
        User user = require(id);
        return userMapper.toResponse(user, stats(id));
    }

    @Transactional
    public UserResponse update(UUID id, UpdateProfileRequest request) {
        User user = require(id);
        userRepository.findByUsernameIgnoreCase(request.username())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new ApiException(ErrorCode.USERNAME_ALREADY_EXISTS);
                });
        user.setFullName(request.fullName());
        user.setUsername(request.username());
        user.setCity(request.city());
        user.setAvatarUrl(request.avatarUrl());
        if (request.language() != null) {
            user.setLanguage(request.language());
        }
        return userMapper.toResponse(userRepository.save(user), stats(id));
    }

    @Transactional
    public void delete(UUID id) {
        userRepository.delete(require(id));
    }

    public List<PublicUserResponse> search(String username) {
        return userRepository.findTop10ByUsernameContainingIgnoreCaseOrderByUsernameAsc(username == null ? "" : username)
                .stream()
                .map(user -> userMapper.toPublic(user, stats(user.getId())))
                .toList();
    }

    public PublicUserResponse publicProfile(UUID id) {
        User user = require(id);
        return userMapper.toPublic(user, stats(id));
    }

    public UserStatsDto stats(UUID userId) {
        long games = gameSessionRepository.countByUserId(userId);
        long wins = gameSessionRepository.countCompletedByUserId(userId);
        Integer best = gameSessionRepository.bestTimeByUserId(userId);
        BigDecimal accuracy = gameSessionRepository.averageAccuracyByUserId(userId);
        long friends = friendRepository.countByUserId(userId);
        return new UserStatsDto(games, wins, best, accuracy == null ? BigDecimal.ZERO : accuracy, (int) Math.min(wins, 30), friends);
    }
}
