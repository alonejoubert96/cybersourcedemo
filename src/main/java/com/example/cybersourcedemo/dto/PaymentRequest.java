package com.example.cybersourcedemo.dto;

import lombok.Data;

@Data
public class PaymentRequest {
    private String cardNumber;
    private String expirationMonth;
    private String expirationYear;
    private String securityCode;
    private String firstName;
    private String lastName;
    private String email;
    private double amount;
    private String currency = "ZAR";
}
