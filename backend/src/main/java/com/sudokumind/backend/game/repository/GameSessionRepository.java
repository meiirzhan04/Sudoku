package com.sudokumind.backend.game.repository;

import com.sudokumind.backend.common.enums.GameStatus;
import com.sudokumind.backend.game.entity.GameSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
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
}
