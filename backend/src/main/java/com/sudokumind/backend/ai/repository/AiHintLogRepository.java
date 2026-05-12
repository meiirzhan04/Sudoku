package com.sudokumind.backend.ai.repository;

import com.sudokumind.backend.ai.entity.AiHintLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.UUID;

public interface AiHintLogRepository extends JpaRepository<AiHintLog, UUID> {
    @Modifying
    @Query("update AiHintLog log set log.user = null where log.user.id = :userId")
    void detachUser(UUID userId);
}
