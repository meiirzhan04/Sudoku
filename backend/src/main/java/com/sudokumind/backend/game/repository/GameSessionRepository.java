package com.sudokumind.backend.game.repository;

import com.sudokumind.backend.common.enums.GameStatus;
import com.sudokumind.backend.common.enums.Difficulty;
import com.sudokumind.backend.game.entity.GameSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GameSessionRepository extends JpaRepository<GameSession, UUID> {
    long countByUserId(UUID userId);

    @Query("select count(g) from GameSession g where g.user.id = :userId and g.status = 'COMPLETED'")
    long countCompletedByUserId(UUID userId);

    @Query("select min(g.elapsedSeconds) from GameSession g where g.user.id = :userId and g.status = 'COMPLETED'")
    Integer bestTimeByUserId(UUID userId);

    @Query("select avg(g.accuracy) from GameSession g where g.user.id = :userId")
    BigDecimal averageAccuracyByUserId(UUID userId);

    Optional<GameSession> findFirstByUserIdAndStatusOrderByUpdatedAtDesc(UUID userId, GameStatus status);

    List<GameSession> findTop30ByUserIdOrderByCreatedAtDesc(UUID userId);

    long countByCreatedAtAfter(Instant since);

    @Query("select count(distinct g.user.id) from GameSession g where g.updatedAt >= :since and g.user is not null")
    long countActivePlayersSince(Instant since);

    @Query("select count(g) from GameSession g where g.user.id = :userId and g.status = 'COMPLETED' and g.completedAt >= :since")
    long countCompletedByUserIdSince(UUID userId, Instant since);

    @Query("select count(g) from GameSession g where g.user.id = :userId and g.status = 'COMPLETED' and g.hintsUsed <= :maxHints and g.completedAt >= :since")
    long countCompletedByUserIdWithHintsAtMostSince(UUID userId, int maxHints, Instant since);

    @Query("select count(g) from GameSession g where g.user.id = :userId and g.status = 'COMPLETED' and g.difficulty = :difficulty and g.completedAt >= :since")
    long countCompletedByUserIdAndDifficultySince(UUID userId, Difficulty difficulty, Instant since);

    @Query("select coalesce(g.user.city, 'Global'), count(g) from GameSession g where g.updatedAt >= :since and g.user is not null group by coalesce(g.user.city, 'Global') order by count(g) desc")
    List<Object[]> activeCitiesSince(Instant since);
}
