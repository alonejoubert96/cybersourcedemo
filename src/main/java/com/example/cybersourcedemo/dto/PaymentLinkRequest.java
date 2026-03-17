package com.example.cybersourcedemo.dto;

import lombok.Data;

@Data
public class PaymentLinkRequest {
    private String description;
    private double amount;
    private String currency = "ZAR";
}
