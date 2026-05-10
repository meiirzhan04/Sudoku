package com.sudokumind.backend.daily.controller;

import com.sudokumind.backend.common.util.CurrentUser;
import com.sudokumind.backend.daily.dto.*;
import com.sudokumind.backend.daily.service.DailyService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/daily")
public class DailyController {
    private final DailyService dailyService;

    public DailyController(DailyService dailyService) {
        this.dailyService = dailyService;
    }

    @GetMapping("/today")
    public DailyChallengeResponse today() {
        return dailyService.today();
    }

    @PostMapping("/{id}/submit")
    public void submit(@PathVariable UUID id, @Valid @RequestBody DailySubmitRequest request) {
        dailyService.submit(CurrentUser.id(), id, request);
    }

    @GetMapping("/{id}/leaderboard")
    public List<LeaderboardEntry> leaderboard(@PathVariable UUID id, @RequestParam(required = false) String city) {
        return dailyService.leaderboard(id, city);
    }
}
