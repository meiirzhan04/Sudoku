package com.sudokumind.backend.daily.repository;

import com.sudokumind.backend.daily.entity.DailyResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DailyResultRepository extends JpaRepository<DailyResult, UUID> {
    boolean existsByUserIdAndDailyChallengeId(UUID userId, UUID dailyChallengeId);

    Optional<DailyResult> findByUserIdAndDailyChallengeId(UUID userId, UUID dailyChallengeId);

    List<DailyResult> findByUserIdOrderByCompletedAtDesc(UUID userId);

    List<DailyResult> findByDailyChallengeIdOrderByTimeSecondsAscMistakesAscAccuracyDesc(UUID dailyChallengeId);

    @Modifying
    void deleteByUserId(UUID userId);
}
