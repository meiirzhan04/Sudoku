package com.sudokumind.backend.daily.service;

import com.sudokumind.backend.common.exception.ApiException;
import com.sudokumind.backend.common.exception.ErrorCode;
import com.sudokumind.backend.common.enums.UserRole;
import com.sudokumind.backend.daily.dto.*;
import com.sudokumind.backend.daily.entity.DailyChallenge;
import com.sudokumind.backend.daily.entity.DailyResult;
import com.sudokumind.backend.daily.repository.DailyChallengeRepository;
import com.sudokumind.backend.daily.repository.DailyResultRepository;
import com.sudokumind.backend.game.sudoku.SudokuEngine;
import com.sudokumind.backend.user.entity.User;
import com.sudokumind.backend.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class DailyService {
    private final DailyChallengeRepository challengeRepository;
    private final DailyResultRepository resultRepository;
    private final SudokuEngine sudokuEngine;
    private final UserService userService;

    public DailyService(DailyChallengeRepository challengeRepository, DailyResultRepository resultRepository, SudokuEngine sudokuEngine, UserService userService) {
        this.challengeRepository = challengeRepository;
        this.resultRepository = resultRepository;
        this.sudokuEngine = sudokuEngine;
        this.userService = userService;
    }

    @Transactional
    public DailyChallengeResponse today() {
        DailyChallenge challenge = challengeRepository.findByChallengeDate(LocalDate.now()).orElseGet(() -> {
            var puzzle = sudokuEngine.generateDaily(LocalDate.now());
            DailyChallenge created = new DailyChallenge();
            created.setChallengeDate(LocalDate.now());
            created.setPuzzle(puzzle.puzzle());
            created.setSolution(puzzle.solution());
            created.setDifficulty(puzzle.difficulty());
            return challengeRepository.save(created);
        });
        return toResponse(challenge);
    }

    @Transactional
    public void submit(UUID userId, UUID challengeId, DailySubmitRequest request) {
        if (resultRepository.existsByUserIdAndDailyChallengeId(userId, challengeId)) {
            throw new ApiException(ErrorCode.DAILY_ALREADY_SUBMITTED);
        }
        User user = userService.require(userId);
        DailyChallenge challenge = challengeRepository.findById(challengeId)
                .orElseThrow(() -> new ApiException(ErrorCode.GAME_NOT_FOUND));
        DailyResult result = new DailyResult();
        result.setUser(user);
        result.setDailyChallenge(challenge);
        result.setTimeSeconds(request.timeSeconds());
        result.setMistakes(request.mistakes());
        result.setAccuracy(request.accuracy());
        resultRepository.save(result);
    }

    public List<LeaderboardEntry> leaderboard(UUID challengeId, String city) {
        AtomicInteger rank = new AtomicInteger(1);
        return resultRepository.findByDailyChallengeIdOrderByTimeSecondsAscMistakesAscAccuracyDesc(challengeId)
                .stream()
                .filter(result -> city == null || city.isBlank() || (result.getUser().getCity() != null && result.getUser().getCity().equalsIgnoreCase(city)))
                .map(result -> new LeaderboardEntry(
                        rank.getAndIncrement(),
                        result.getUser().getId(),
                        result.getUser().getUsername(),
                        result.getUser().getCity(),
                        result.getUser().getAvatarUrl(),
                        result.getTimeSeconds(),
                        result.getMistakes(),
                        result.getAccuracy(),
                        result.getUser().getRole() == UserRole.PRO
                ))
                .toList();
    }

    @Transactional
    public DailyStatusResponse todayStatus(UUID userId) {
        DailyChallengeResponse today = today();
        var result = resultRepository.findByUserIdAndDailyChallengeId(userId, today.id());
        if (result.isEmpty()) {
            return new DailyStatusResponse(today.id(), false, null, null, null, 0);
        }
        List<DailyResult> ranked = resultRepository.findByDailyChallengeIdOrderByTimeSecondsAscMistakesAscAccuracyDesc(today.id());
        int rank = 1;
        for (DailyResult item : ranked) {
            if (item.getUser().getId().equals(userId)) {
                break;
            }
            rank++;
        }
        DailyResult value = result.get();
        return new DailyStatusResponse(today.id(), true, value.getTimeSeconds(), value.getMistakes(), value.getAccuracy().intValue(), rank);
    }

    private DailyChallengeResponse toResponse(DailyChallenge challenge) {
        return new DailyChallengeResponse(challenge.getId(), challenge.getChallengeDate(), challenge.getPuzzle(), challenge.getDifficulty());
    }
}
