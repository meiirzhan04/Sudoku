package com.sudokumind.backend.ai.entity;

import com.sudokumind.backend.game.entity.GameSession;
import com.sudokumind.backend.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "ai_hint_logs")
public class AiHintLog {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_session_id")
    private GameSession gameSession;

    @Column(columnDefinition = "text", nullable = false)
    private String prompt;

    @Column(columnDefinition = "text", nullable = false)
    private String response;

    @Column(nullable = false)
    private String language;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
