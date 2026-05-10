package com.sudokumind.backend.common.exception;

import com.sudokumind.backend.common.response.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.context.MessageSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Locale;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private final MessageSource messageSource;

    public GlobalExceptionHandler(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApi(ApiException exception, HttpServletRequest request, Locale locale) {
        ErrorCode code = exception.getErrorCode();
        return build(code.status(), code.name(), message(code.name(), locale), request.getRequestURI());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException exception, HttpServletRequest request, Locale locale) {
        String details = exception.getBindingResult().getFieldErrors().stream()
                .map(this::fieldMessage)
                .collect(Collectors.joining("; "));
        return build(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR.name(), details, request.getRequestURI());
    }

    @ExceptionHandler({ConstraintViolationException.class, IllegalArgumentException.class})
    public ResponseEntity<ErrorResponse> handleBadRequest(Exception exception, HttpServletRequest request, Locale locale) {
        return build(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR.name(), exception.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleDenied(AccessDeniedException exception, HttpServletRequest request, Locale locale) {
        return build(HttpStatus.FORBIDDEN, ErrorCode.ACCESS_DENIED.name(), message(ErrorCode.ACCESS_DENIED.name(), locale), request.getRequestURI());
    }

    private String fieldMessage(FieldError error) {
        return error.getField() + ": " + (error.getDefaultMessage() == null ? "invalid" : error.getDefaultMessage());
    }

    private String message(String key, Locale locale) {
        return messageSource.getMessage(key, null, key, locale);
    }

    private ResponseEntity<ErrorResponse> build(HttpStatus status, String error, String message, String path) {
        return ResponseEntity.status(status).body(new ErrorResponse(Instant.now(), status.value(), error, message, path));
    }
}
