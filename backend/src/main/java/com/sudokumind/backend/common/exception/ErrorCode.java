package com.sudokumind.backend.common.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT),
    USERNAME_ALREADY_EXISTS(HttpStatus.CONFLICT),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND),
    FRIEND_REQUEST_ALREADY_EXISTS(HttpStatus.CONFLICT),
    ROOM_NOT_FOUND(HttpStatus.NOT_FOUND),
    ROOM_ALREADY_FULL(HttpStatus.CONFLICT),
    GAME_NOT_FOUND(HttpStatus.NOT_FOUND),
    DAILY_ALREADY_SUBMITTED(HttpStatus.CONFLICT),
    HINT_LIMIT_REACHED(HttpStatus.TOO_MANY_REQUESTS),
    ACCESS_DENIED(HttpStatus.FORBIDDEN),
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST);

    private final HttpStatus status;

    ErrorCode(HttpStatus status) {
        this.status = status;
    }

    public HttpStatus status() {
        return status;
    }
}
