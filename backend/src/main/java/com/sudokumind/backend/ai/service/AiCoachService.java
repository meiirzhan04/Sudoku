package com.sudokumind.backend.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sudokumind.backend.ai.dto.ExplainCellRequest;
import com.sudokumind.backend.ai.dto.ExplainCellResponse;
import com.sudokumind.backend.ai.entity.AiHintLog;
import com.sudokumind.backend.ai.repository.AiHintLogRepository;
import com.sudokumind.backend.common.enums.UserRole;
import com.sudokumind.backend.common.exception.ApiException;
import com.sudokumind.backend.common.exception.ErrorCode;
import com.sudokumind.backend.game.entity.GameSession;
import com.sudokumind.backend.game.repository.GameSessionRepository;
import com.sudokumind.backend.user.entity.User;
import com.sudokumind.backend.user.service.UserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

@Service
public class AiCoachService {
    private final AiHintLogRepository logRepository;
    private final GameSessionRepository gameSessionRepository;
    private final UserService userService;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String model;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public AiCoachService(
            AiHintLogRepository logRepository,
            GameSessionRepository gameSessionRepository,
            UserService userService,
            ObjectMapper objectMapper,
            @Value("${app.anthropic.api-key}") String apiKey,
            @Value("${app.anthropic.model}") String model
    ) {
        this.logRepository = logRepository;
        this.gameSessionRepository = gameSessionRepository;
        this.userService = userService;
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.model = model;
    }

    @Transactional
    public ExplainCellResponse explain(UUID userId, ExplainCellRequest request) {
        User user = userService.require(userId);
        GameSession game = null;
        if (request.gameSessionId() != null) {
            game = gameSessionRepository.findById(request.gameSessionId()).orElseThrow(() -> new ApiException(ErrorCode.GAME_NOT_FOUND));
            if (!game.getUser().getId().equals(userId)) throw new ApiException(ErrorCode.GAME_NOT_FOUND);
            if (user.getRole() != UserRole.PRO && game.getHintsUsed() >= 5) {
                throw new ApiException(ErrorCode.HINT_LIMIT_REACHED);
            }
            game.setHintsUsed(game.getHintsUsed() + 1);
            gameSessionRepository.save(game);
        }

        String prompt = buildPrompt(request);
        String response = apiKey == null || apiKey.isBlank()
                ? localFallback(request)
                : callClaude(prompt, request.language().name());

        AiHintLog log = new AiHintLog();
        log.setUser(user);
        log.setGameSession(game);
        log.setPrompt(prompt);
        log.setResponse(response);
        log.setLanguage(request.language().name());
        logRepository.save(log);
        return new ExplainCellResponse(response, game == null ? 0 : game.getHintsUsed(), false);
    }

    private String buildPrompt(ExplainCellRequest request) {
        return "Explain Sudoku cell row " + request.row() + ", col " + request.col()
                + ". Teach strategies if useful: naked singles, hidden pairs, X-wing. Board: "
                + java.util.Arrays.deepToString(request.currentBoard());
    }

    private String localFallback(ExplainCellRequest request) {
        return switch (request.language()) {
            case ru -> "Проверьте строку, столбец и блок 3x3. Если в клетке остался единственный кандидат, это стратегия «одиночный кандидат».";
            case kk -> "Жолды, бағанды және 3x3 блокты тексеріңіз. Егер бір ғана кандидат қалса, бұл «жалғыз кандидат» стратегиясы.";
            default -> "Check the row, column, and 3x3 box. If only one candidate remains, this is a naked single.";
        };
    }

    private String callClaude(String prompt, String language) {
        try {
            String body = objectMapper.writeValueAsString(Map.of(
                    "model", model,
                    "max_tokens", 240,
                    "temperature", 0.2,
                    "system", "You are SudokuMind's concise Sudoku coach. Respond only in " + language + ".",
                    "messages", new Object[]{Map.of("role", "user", "content", prompt)}
            ));
            HttpRequest request = HttpRequest.newBuilder(URI.create("https://api.anthropic.com/v1/messages"))
                    .header("content-type", "application/json")
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", "2023-06-01")
                    .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode root = objectMapper.readTree(response.body());
            JsonNode text = root.path("content").path(0).path("text");
            return text.isMissingNode() ? "AI coach response unavailable." : text.asText();
        } catch (Exception exception) {
            return "AI coach response unavailable. Try checking row, column, and box candidates.";
        }
    }
}
