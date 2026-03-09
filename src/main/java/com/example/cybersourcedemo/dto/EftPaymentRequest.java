package com.example.cybersourcedemo.dto;

import lombok.Data;

@Data
public class EftPaymentRequest {
    private String accountNumber;
    private String routingNumber;
    private String accountType = "C"; // C=checking, S=savings
    private String firstName;
    private String lastName;
    private String email;
    private double amount;
    private String currency = "USD";
}
