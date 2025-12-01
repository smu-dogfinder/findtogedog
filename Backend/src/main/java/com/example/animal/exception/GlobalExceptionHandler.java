package com.example.animal.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private ResponseEntity<Map<String,Object>> body(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of(
            "status", status.is2xxSuccessful() ? "success" : "error",
            "statusCode", status.value(),
            "message", message
        ));
    }

    @ExceptionHandler(DuplicateUserException.class)
    public ResponseEntity<Map<String,Object>> handleDuplicateUserId(DuplicateUserException e) {
        return body(HttpStatus.CONFLICT, e.getMessage()); // 409
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<Map<String,Object>> handleUnauthorized(UnauthorizedException e) {
        return body(HttpStatus.UNAUTHORIZED, e.getMessage()); // 401
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String,Object>> handleDataIntegrity(DataIntegrityViolationException e) {
        return body(HttpStatus.CONFLICT, "데이터 무결성 제약 조건 위반"); // 409
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String,Object>> handleValidation(MethodArgumentNotValidException e) {
        String msg = e.getBindingResult().getFieldErrors().stream()
            .findFirst().map(err -> err.getField() + ": " + err.getDefaultMessage())
            .orElse("유효성 검사 실패");
        return body(HttpStatus.BAD_REQUEST, msg); // 400
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String,Object>> handleRuntime(RuntimeException e) {
        return body(HttpStatus.BAD_REQUEST, e.getMessage()); // 400 (fallback)
    }
}
