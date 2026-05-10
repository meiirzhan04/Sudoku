package com.sudokumind.backend.auth.dto;

import com.sudokumind.backend.common.enums.Language;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(max = 160) String fullName,
        @NotBlank @Size(min = 3, max = 80) String username,
        @Email @NotBlank String email,
        @NotBlank @Size(min = 8) @Pattern(regexp = "^(?=.*[\\p{L}])(?=.*\\d).+$", message = "must contain a letter and a number") String password,
        @NotBlank String confirmPassword,
        @Size(max = 120) String city,
        @NotNull Language language
) {
}
