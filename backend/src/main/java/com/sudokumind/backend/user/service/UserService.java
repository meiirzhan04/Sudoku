package com.sudokumind.backend.user.service;

import com.sudokumind.backend.common.exception.ApiException;
import com.sudokumind.backend.common.exception.ErrorCode;
import com.sudokumind.backend.common.enums.Difficulty;
import com.sudokumind.backend.common.enums.UserRole;
import com.sudokumind.backend.daily.entity.DailyResult;
import com.sudokumind.backend.daily.repository.DailyResultRepository;
import com.sudokumind.backend.friends.repository.FriendRepository;
import com.sudokumind.backend.game.repository.GameSessionRepository;
import com.sudokumind.backend.leaderboard.GlobalLeaderboardEntry;
import com.sudokumind.backend.user.dto.*;
import com.sudokumind.backend.user.entity.User;
import com.sudokumind.backend.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final GameSessionRepository gameSessionRepository;
    private final FriendRepository friendRepository;
    private final DailyResultRepository dailyResultRepository;

    public UserService(UserRepository userRepository, UserMapper userMapper, GameSessionRepository gameSessionRepository, FriendRepository friendRepository, DailyResultRepository dailyResultRepository) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.gameSessionRepository = gameSessionRepository;
        this.friendRepository = friendRepository;
        this.dailyResultRepository = dailyResultRepository;
    }

    public User require(UUID id) {
        return userRepository.findById(id).orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
    }

    public UserResponse me(UUID id) {
        User user = require(id);
        return userMapper.toResponse(user, stats(id));
    }

    @Transactional
    public void heartbeat(UUID id) {
        User user = require(id);
        user.setLastSeenAt(Instant.now());
        userRepository.save(user);
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

    public DashboardResponse dashboard(UUID userId) {
        User user = require(userId);
        UserStatsDto stats = stats(userId);
        List<DailyResult> dailyResults = dailyResultRepository.findByUserIdOrderByCompletedAtDesc(userId);
        Set<LocalDate> completedDates = new TreeSet<>((a, b) -> b.compareTo(a));
        for (DailyResult result : dailyResults) {
            completedDates.add(result.getDailyChallenge().getChallengeDate());
        }

        int currentStreak = currentStreak(completedDates);
        if (user.getStreakOverride() != null) {
            currentStreak = Math.max(0, user.getStreakOverride());
        }
        int longestStreak = longestStreak(completedDates);
        int xp = (int) (stats.wins() * 50 + dailyResults.size() * 100L + currentStreak * 20L);
        if (user.getXpOverride() != null) {
            xp = Math.max(0, user.getXpOverride());
        }
        int level = Math.max(1, xp / 1000 + 1);
        int levelStart = (level - 1) * 1000;
        int xpProgress = xp - levelStart;
        int xpNeeded = 1000;
        int averageAccuracy = stats.averageAccuracy() == null ? 100 : stats.averageAccuracy().intValue();
        String rank = stats.wins() >= 50 ? "Diamond" : stats.wins() >= 20 ? "Gold" : stats.wins() >= 5 ? "Silver" : "Starter";
        List<String> dates = completedDates.stream().map(LocalDate::toString).toList();

        return new DashboardResponse(
                user.getFullName(),
                user.getUsername(),
                user.getCity(),
                stats.gamesPlayed(),
                stats.wins(),
                stats.bestTimeSeconds(),
                averageAccuracy == 0 ? 100 : averageAccuracy,
                currentStreak,
                Math.max(longestStreak, stats.bestStreak()),
                dates.isEmpty() ? null : dates.get(0),
                dates,
                xp,
                level,
                xpProgress,
                xpNeeded,
                Math.max(0, xpNeeded - xpProgress),
                user.getRole() == UserRole.PRO ? 2 : 0,
                completedDates.contains(LocalDate.now()),
                rank
        );
    }

    public List<GlobalLeaderboardEntry> leaderboard(int limit) {
        java.util.concurrent.atomic.AtomicInteger rank = new java.util.concurrent.atomic.AtomicInteger(1);
        return userRepository.findAll().stream()
                .map(user -> {
                    UserStatsDto stats = stats(user.getId());
                    return new GlobalLeaderboardEntry(
                            0,
                            user.getId(),
                            user.getUsername(),
                            user.getCity(),
                            user.getAvatarUrl(),
                            stats.wins(),
                            stats.bestTimeSeconds(),
                            stats.averageAccuracy(),
                            tier(stats.wins()),
                            user.getRole() == UserRole.PRO
                    );
                })
                .sorted((a, b) -> {
                    int wins = Long.compare(b.completedGames(), a.completedGames());
                    if (wins != 0) return wins;
                    int aTime = a.bestTimeSeconds() == null ? Integer.MAX_VALUE : a.bestTimeSeconds();
                    int bTime = b.bestTimeSeconds() == null ? Integer.MAX_VALUE : b.bestTimeSeconds();
                    return Integer.compare(aTime, bTime);
                })
                .limit(Math.max(1, Math.min(limit, 100)))
                .map(entry -> new GlobalLeaderboardEntry(
                        rank.getAndIncrement(),
                        entry.userId(),
                        entry.username(),
                        entry.city(),
                        entry.avatarUrl(),
                        entry.completedGames(),
                        entry.bestTimeSeconds(),
                        entry.averageAccuracy(),
                        entry.tier(),
                        entry.pro()
                ))
                .toList();
    }

    public DailyGoalsResponse dailyGoals(UUID userId) {
        Instant todayStart = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant();
        boolean completedAny = gameSessionRepository.countCompletedByUserIdSince(userId, todayStart) > 0;
        boolean lowHints = gameSessionRepository.countCompletedByUserIdWithHintsAtMostSince(userId, 2, todayStart) > 0;
        boolean mediumDone = gameSessionRepository.countCompletedByUserIdAndDifficultySince(userId, Difficulty.MEDIUM, todayStart) > 0;

        return new DailyGoalsResponse(List.of(
                new DailyGoalResponse("complete-one", "Пройти 1 головоломку сегодня", 50, completedAny),
                new DailyGoalResponse("low-hints", "Использовать не больше 2 подсказок", 50, lowHints),
                new DailyGoalResponse("medium-one", "Завершить одну среднюю головоломку", 50, mediumDone),
                new DailyGoalResponse("battle-win", "Выиграть одну битву", 150, false)
        ));
    }

    private int currentStreak(Set<LocalDate> completedDates) {
        if (completedDates.isEmpty()) return 0;
        LocalDate cursor = completedDates.contains(LocalDate.now()) ? LocalDate.now() : LocalDate.now().minusDays(1);
        int streak = 0;
        while (completedDates.contains(cursor)) {
            streak++;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }

    private int longestStreak(Set<LocalDate> completedDates) {
        int longest = 0;
        int current = 0;
        LocalDate previous = null;
        for (LocalDate date : completedDates.stream().sorted().toList()) {
            if (previous != null && previous.plusDays(1).equals(date)) {
                current++;
            } else {
                current = 1;
            }
            longest = Math.max(longest, current);
            previous = date;
        }
        return longest;
    }

    private String tier(long wins) {
        if (wins >= 100) return "Grandmaster";
        if (wins >= 50) return "Diamond";
        if (wins >= 20) return "Gold";
        if (wins >= 5) return "Silver";
        return "Starter";
    }
}
