package com.sudokumind.backend.leaderboard;

import com.sudokumind.backend.daily.dto.LeaderboardEntry;
import com.sudokumind.backend.daily.service.DailyService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {
    private final DailyService dailyService;

    public LeaderboardController(DailyService dailyService) {
        this.dailyService = dailyService;
    }

    @GetMapping("/daily")
    public List<LeaderboardEntry> daily(@RequestParam(defaultValue = "5") int limit) {
        return dailyService.leaderboard(dailyService.today().id(), null)
                .stream()
                .limit(Math.max(1, Math.min(limit, 50)))
                .toList();
    }
}
