package com.example.cybersourcedemo.dto;

import lombok.Data;

@Data
public class SamsungPayRequest {
    private String dpan;
    private String expirationMonth;
    private String expirationYear;
    private String cryptogram;
    private String cardType;
    private double amount;
    private String currency;
}
