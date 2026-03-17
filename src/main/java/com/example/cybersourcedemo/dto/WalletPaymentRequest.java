package com.example.cybersourcedemo.dto;

import lombok.Data;

@Data
public class WalletPaymentRequest {
    private String tokenData;
    private String cryptogram;
    private String expirationMonth;
    private String expirationYear;
    private double amount;
    private String currency = "ZAR";
}
