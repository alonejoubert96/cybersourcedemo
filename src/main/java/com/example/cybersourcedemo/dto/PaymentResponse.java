package com.example.cybersourcedemo.dto;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class PaymentResponse {
    private String status;
    private String transactionId;
    private String message;
    private int httpStatus;
    private Map<String, Object> details;
}
