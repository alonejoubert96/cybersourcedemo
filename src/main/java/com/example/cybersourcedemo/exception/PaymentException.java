package com.example.cybersourcedemo.exception;

import lombok.Getter;

@Getter
public class PaymentException extends RuntimeException {

    private final int statusCode;
    private final String responseBody;

    public PaymentException(String message, int statusCode, String responseBody) {
        super(message);
        this.statusCode = statusCode;
        this.responseBody = responseBody;
    }

    public PaymentException(String message, Throwable cause) {
        super(message, cause);
        this.statusCode = 500;
        this.responseBody = cause.getMessage();
    }
}
