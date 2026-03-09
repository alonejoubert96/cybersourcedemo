package com.example.cybersourcedemo.exception;

import com.example.cybersourcedemo.dto.PaymentResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(PaymentException.class)
    public ResponseEntity<PaymentResponse> handlePaymentException(PaymentException ex) {
        PaymentResponse response = PaymentResponse.builder()
                .status("ERROR")
                .message(ex.getMessage())
                .httpStatus(ex.getStatusCode())
                .details(Map.of("responseBody", ex.getResponseBody() != null ? ex.getResponseBody() : ""))
                .build();
        return ResponseEntity.status(ex.getStatusCode()).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<PaymentResponse> handleGenericException(Exception ex) {
        PaymentResponse response = PaymentResponse.builder()
                .status("ERROR")
                .message("Internal server error: " + ex.getMessage())
                .httpStatus(500)
                .build();
        return ResponseEntity.internalServerError().body(response);
    }
}
