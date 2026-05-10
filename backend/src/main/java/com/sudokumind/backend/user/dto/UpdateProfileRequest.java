package com.sudokumind.backend.user.dto;

import com.sudokumind.backend.common.enums.Language;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank @Size(max = 160) String fullName,
        @NotBlank @Size(min = 3, max = 80) String username,
        @Size(max = 120) String city,
        String avatarUrl,
        Language language
) {
}
