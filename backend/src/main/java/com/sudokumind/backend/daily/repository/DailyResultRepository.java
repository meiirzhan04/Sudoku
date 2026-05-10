package com.sudokumind.backend.daily.repository;

import com.sudokumind.backend.daily.entity.DailyResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DailyResultRepository extends JpaRepository<DailyResult, UUID> {
    boolean existsByUserIdAndDailyChallengeId(UUID userId, UUID dailyChallengeId);

    List<DailyResult> findByDailyChallengeIdOrderByTimeSecondsAscMistakesAscAccuracyDesc(UUID dailyChallengeId);
}
