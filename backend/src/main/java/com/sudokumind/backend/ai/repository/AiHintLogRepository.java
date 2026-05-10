package com.sudokumind.backend.ai.repository;

import com.sudokumind.backend.ai.entity.AiHintLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AiHintLogRepository extends JpaRepository<AiHintLog, UUID> {
}
