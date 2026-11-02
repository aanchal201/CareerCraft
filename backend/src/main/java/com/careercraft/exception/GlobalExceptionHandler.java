package com.careercraft.exception;

import com.careercraft.ai.AiServiceException;
import com.careercraft.dto.response.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Centralized exception handling: converts exceptions thrown by controllers
 * and services into consistent {@link ApiErrorResponse} JSON bodies with the
 * correct HTTP status code.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** 400 - @Valid failed on a request body. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException ex,
                                                             HttpServletRequest request) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            // keep the first message per field
            fieldErrors.putIfAbsent(error.getField(), error.getDefaultMessage());
        }
        return build(HttpStatus.BAD_REQUEST, "Validation failed", request, fieldErrors);
    }

    /** 400 - business-rule validation (e.g. end date before start date). */
    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidRequest(InvalidRequestException ex,
                                                                 HttpServletRequest request) {
        Map<String, String> fieldErrors = ex.getField() == null ? null : Map.of(ex.getField(), ex.getMessage());
        return build(HttpStatus.BAD_REQUEST, ex.getMessage(), request, fieldErrors);
    }

    /** 400 - body is missing or is not valid JSON (also wrong date/enum formats). */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleUnreadable(HttpMessageNotReadableException ex,
                                                             HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "Request body is missing or malformed", request, null);
    }

    /** 400 - e.g. /api/profile/education/abc (id must be a number). */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex,
                                                               HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "Invalid value for '" + ex.getName() + "'", request, null);
    }

    /** 400 - required query parameter or multipart part missing. */
    @ExceptionHandler({MissingServletRequestParameterException.class, MissingServletRequestPartException.class})
    public ResponseEntity<ApiErrorResponse> handleMissingPart(Exception ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "A required field or file is missing", request, null);
    }

    /** 413 - uploaded file is larger than spring.servlet.multipart limits. */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiErrorResponse> handleMaxUpload(MaxUploadSizeExceededException ex,
                                                            HttpServletRequest request) {
        return build(HttpStatus.PAYLOAD_TOO_LARGE, "The file is too large (maximum 5 MB)", request, null);
    }

    /** 400 - malformed multipart request. */
    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<ApiErrorResponse> handleMultipart(MultipartException ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "Invalid file upload", request, null);
    }

    /** 415 - wrong Content-Type (e.g. JSON sent to the upload endpoint). */
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ApiErrorResponse> handleMediaType(HttpMediaTypeNotSupportedException ex,
                                                            HttpServletRequest request) {
        return build(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Unsupported content type", request, null);
    }

    /** 401 - wrong email/password on login. */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiErrorResponse> handleAuthentication(AuthenticationException ex,
                                                                 HttpServletRequest request) {
        // Deliberately vague: don't reveal whether the email exists.
        return build(HttpStatus.UNAUTHORIZED, "Invalid email or password", request, null);
    }

    /** 403 - authenticated but not allowed. */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(AccessDeniedException ex,
                                                               HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN, "You do not have permission to perform this action", request, null);
    }

    /** 404 - entity not found. */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNotFound(ResourceNotFoundException ex,
                                                           HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, ex.getMessage(), request, null);
    }

    /** 404 - no controller mapped to this URL. */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNoResource(NoResourceFoundException ex,
                                                             HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, "Endpoint not found", request, null);
    }

    /** 405 - e.g. GET on a POST-only endpoint. */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex,
                                                                     HttpServletRequest request) {
        return build(HttpStatus.METHOD_NOT_ALLOWED, ex.getMessage(), request, null);
    }

    /** 409 - duplicate email. */
    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<ApiErrorResponse> handleEmailExists(EmailAlreadyExistsException ex,
                                                              HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, ex.getMessage(), request, null);
    }

    /** 429 - usage limit reached (e.g. daily AI analyses). */
    @ExceptionHandler(TooManyRequestsException.class)
    public ResponseEntity<ApiErrorResponse> handleTooManyRequests(TooManyRequestsException ex,
                                                                  HttpServletRequest request) {
        ResponseEntity<ApiErrorResponse> response = build(HttpStatus.TOO_MANY_REQUESTS, ex.getMessage(), request, null);
        if (ex.getRetryAfterSeconds() == null) {
            return response;
        }
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header(HttpHeaders.RETRY_AFTER, String.valueOf(ex.getRetryAfterSeconds()))
                .body(response.getBody());
    }

    /** 502 / 503 / 504 - problem talking to the AI provider. The message is already user-friendly. */
    @ExceptionHandler(AiServiceException.class)
    public ResponseEntity<ApiErrorResponse> handleAiService(AiServiceException ex, HttpServletRequest request) {
        return build(ex.getStatus(), ex.getMessage(), request, null);
    }

    /** 409 - conflicts with existing data (e.g. portfolio address taken). */
    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiErrorResponse> handleConflict(ConflictException ex, HttpServletRequest request) {
        Map<String, String> fieldErrors = ex.getField() == null ? null : Map.of(ex.getField(), ex.getMessage());
        return build(HttpStatus.CONFLICT, ex.getMessage(), request, fieldErrors);
    }

    /** 500 - anything unexpected. Logged with stack trace, generic message to client. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(Exception ex, HttpServletRequest request) {
        log.error("Unexpected error on {} {}", request.getMethod(), request.getRequestURI(), ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong. Please try again later.", request, null);
    }

    private ResponseEntity<ApiErrorResponse> build(HttpStatus status, String message,
                                                   HttpServletRequest request,
                                                   Map<String, String> fieldErrors) {
        ApiErrorResponse body = (fieldErrors == null)
                ? ApiErrorResponse.of(status.value(), status.getReasonPhrase(), message, request.getRequestURI())
                : ApiErrorResponse.withFieldErrors(status.value(), status.getReasonPhrase(), message,
                request.getRequestURI(), fieldErrors);
        return ResponseEntity.status(status).body(body);
    }
}
