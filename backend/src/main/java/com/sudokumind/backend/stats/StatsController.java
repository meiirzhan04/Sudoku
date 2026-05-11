package com.sudokumind.backend.stats;

import com.sudokumind.backend.stats.dto.ActiveCitiesResponse;
import com.sudokumind.backend.stats.dto.GlobalStatsResponse;
import com.sudokumind.backend.stats.dto.OnlinePlayerResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
public class StatsController {
    private final StatsService statsService;

    public StatsController(StatsService statsService) {
        this.statsService = statsService;
    }

    @GetMapping("/global")
    public GlobalStatsResponse global() {
        return statsService.global();
    }

    @GetMapping("/cities/active")
    public ActiveCitiesResponse activeCities() {
        return statsService.activeCities();
    }

    @GetMapping("/players/online")
    public List<OnlinePlayerResponse> onlinePlayers() {
        return statsService.onlinePlayers();
    }
}
import java.util.List;
