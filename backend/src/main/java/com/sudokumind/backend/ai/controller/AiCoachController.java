package com.sudokumind.backend.ai.controller;

import com.sudokumind.backend.ai.dto.ExplainCellRequest;
import com.sudokumind.backend.ai.dto.ExplainCellResponse;
import com.sudokumind.backend.ai.service.AiCoachService;
import com.sudokumind.backend.common.util.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AiCoachController {
    private final AiCoachService aiCoachService;

    public AiCoachController(AiCoachService aiCoachService) {
        this.aiCoachService = aiCoachService;
    }

    @PostMapping("/explain-cell")
    public ExplainCellResponse explain(@Valid @RequestBody ExplainCellRequest request) {
        return aiCoachService.explain(CurrentUser.id(), request);
    }
}
