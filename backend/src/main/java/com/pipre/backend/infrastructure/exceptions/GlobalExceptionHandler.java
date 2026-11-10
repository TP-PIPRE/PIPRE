package com.pipre.backend.infrastructure.exceptions;

import com.pipre.backend.domain.exceptions.ResourceNotFoundException;
import com.pipre.backend.domain.exceptions.GameHintStaleException;
import com.pipre.backend.domain.exceptions.GameHintPendingException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> handleMethodNotAllowed(
            org.springframework.web.HttpRequestMethodNotSupportedException ex) {
        // Respond directly: a servlet error dispatch can hide 405 behind a second authentication check.
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("error", "Método no permitido");
        body.put("message", "Este recurso no admite el método solicitado.");
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).headers(ex.getHeaders()).body(body);
    }

    @ExceptionHandler({com.pipre.backend.domain.exceptions.BusinessException.class, IllegalArgumentException.class})
    public ResponseEntity<Map<String, Object>> handleDomainErrors(RuntimeException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("error", "Error de validación de negocio");
        body.put("message", ex.getMessage());

        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(GameHintStaleException.class)
    public ResponseEntity<Map<String, Object>> handleStaleGameHint(GameHintStaleException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                "code", "HINT_STALE",
                "message", ex.getMessage(),
                "requestedRevision", ex.getRequestedRevision(),
                "currentRevision", ex.getCurrentRevision()));
    }

    @ExceptionHandler(GameHintPendingException.class)
    public ResponseEntity<Map<String, Object>> handlePendingGameHint(GameHintPendingException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                "code", "HINT_PENDING",
                "message", ex.getMessage()));
    }

    @ExceptionHandler({org.springframework.http.converter.HttpMessageNotReadableException.class,
            org.springframework.web.bind.MissingServletRequestParameterException.class,
            org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class})
    public ResponseEntity<Map<String,Object>> handleMalformedInput(Exception ex) {
        return ResponseEntity.badRequest().body(Map.of("timestamp",LocalDateTime.now(),"error","Error de validación de entrada",
                "message","La solicitud contiene campos ausentes, tipos incorrectos o JSON inválido."));
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<Map<String,Object>> handleConflict(org.springframework.dao.DataIntegrityViolationException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("timestamp",LocalDateTime.now(),"error","Conflicto de datos",
                "message","La operación entra en conflicto con los datos existentes."));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String,Object>> handleUnexpected(RuntimeException ex) {
        org.slf4j.LoggerFactory.getLogger(getClass()).error("Fallo interno al procesar la solicitud",ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("timestamp",LocalDateTime.now(),"error","Error interno",
                "message","No pudimos procesar la solicitud. Inténtalo nuevamente."));
    }

    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(org.springframework.web.bind.MethodArgumentNotValidException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("error", "Error de validación de entrada");
        body.put("message", "Revisa los campos de la solicitud.");
        
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> 
            errors.put(error.getField(), error.getDefaultMessage())
        );
        body.put("errors", errors);

        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleResourceNotFound(ResourceNotFoundException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("error", "Recurso no encontrado");
        body.put("message", ex.getMessage());

        return new ResponseEntity<>(body, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(org.springframework.security.authentication.LockedException.class)
    public ResponseEntity<Map<String, Object>> handleLockedException(org.springframework.security.authentication.LockedException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("error", "Cuenta bloqueada");
        body.put("message", "La cuenta se encuentra temporalmente bloqueada debido a múltiples intentos fallidos. Intente más tarde.");

        return new ResponseEntity<>(body, HttpStatus.LOCKED);
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDeniedException(org.springframework.security.access.AccessDeniedException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("error", "Acceso denegado");
        body.put("message", "No tiene permisos suficientes para acceder a este recurso.");

        return new ResponseEntity<>(body, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(org.springframework.security.authentication.BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentialsException(org.springframework.security.authentication.BadCredentialsException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("error", "Credenciales incorrectas");
        body.put("message", "El correo o la contraseña ingresados son incorrectos.");

        return new ResponseEntity<>(body, HttpStatus.UNAUTHORIZED);
    }
}
