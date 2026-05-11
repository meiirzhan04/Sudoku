package com.sudokumind.backend.leaderboard;

import com.sudokumind.backend.daily.dto.LeaderboardEntry;
import com.sudokumind.backend.daily.service.DailyService;
import com.sudokumind.backend.user.service.UserService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {
    private final DailyService dailyService;
    private final UserService userService;

    public LeaderboardController(DailyService dailyService, UserService userService) {
        this.dailyService = dailyService;
        this.userService = userService;
    }

    @GetMapping("/daily")
    public List<LeaderboardEntry> daily(@RequestParam(defaultValue = "5") int limit) {
        return dailyService.leaderboard(dailyService.today().id(), null)
                .stream()
                .limit(Math.max(1, Math.min(limit, 50)))
                .toList();
    }

    @GetMapping("/global")
    public List<GlobalLeaderboardEntry> global(@RequestParam(defaultValue = "50") int limit) {
        return userService.leaderboard(limit);
    }
}
