package com.sudokumind.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank String token,
        @NotBlank @Size(min = 8) @Pattern(regexp = "^(?=.*[\\p{L}])(?=.*\\d).+$") String password,
        @NotBlank String confirmPassword
) {
}
