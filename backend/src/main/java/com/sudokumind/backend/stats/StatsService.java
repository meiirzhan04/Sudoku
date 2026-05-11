package com.sudokumind.backend.stats;

import com.sudokumind.backend.game.repository.GameSessionRepository;
import com.sudokumind.backend.stats.dto.ActiveCitiesResponse;
import com.sudokumind.backend.stats.dto.ActiveCityResponse;
import com.sudokumind.backend.stats.dto.GlobalStatsResponse;
import com.sudokumind.backend.stats.dto.OnlinePlayerResponse;
import com.sudokumind.backend.user.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Service
public class StatsService {
    private final UserRepository userRepository;
    private final GameSessionRepository gameSessionRepository;

    public StatsService(UserRepository userRepository, GameSessionRepository gameSessionRepository) {
        this.userRepository = userRepository;
        this.gameSessionRepository = gameSessionRepository;
    }

    public GlobalStatsResponse global() {
        Instant todayStart = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant activeSince = Instant.now().minusSeconds(300);
        return new GlobalStatsResponse(
                userRepository.count(),
                gameSessionRepository.countByCreatedAtAfter(todayStart),
                gameSessionRepository.countActivePlayersSince(activeSince)
        );
    }

    public ActiveCitiesResponse activeCities() {
        Instant since = Instant.now().minusSeconds(3600);
        List<ActiveCityResponse> cities = gameSessionRepository.activeCitiesSince(since)
                .stream()
                .limit(8)
                .map(row -> new ActiveCityResponse(flagFor(String.valueOf(row[0])), String.valueOf(row[0]), ((Number) row[1]).longValue()))
                .toList();
        return new ActiveCitiesResponse(cities);
    }

    public List<OnlinePlayerResponse> onlinePlayers() {
        Instant since = Instant.now().minusSeconds(300);
        return userRepository.findTop50ByUpdatedAtAfterOrderByUpdatedAtDesc(since).stream()
                .map(user -> new OnlinePlayerResponse(
                        user.getId(),
                        user.getUsername(),
                        user.getCity(),
                        user.getAvatarUrl(),
                        "online"
                ))
                .toList();
    }

    private String flagFor(String city) {
        String value = city == null ? "" : city.toLowerCase();
        if (value.contains("алматы") || value.contains("астана") || value.contains("almaty") || value.contains("astana")) {
            return "🇰🇿";
        }
        if (value.contains("москва") || value.contains("moscow")) {
            return "🇷🇺";
        }
        if (value.contains("new york") || value.contains("нью-йорк")) {
            return "🇺🇸";
        }
        return "🌐";
    }
}
