package com.example.cybersourcedemo.dto;

import lombok.Data;

@Data
public class DirectApiRequest {
    private String cardNumber;
    private String expirationMonth;
    private String expirationYear;
    private String cvv;
    private double amount;
    private String currency;
}
