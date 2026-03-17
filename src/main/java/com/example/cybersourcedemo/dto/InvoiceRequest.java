package com.example.cybersourcedemo.dto;

import lombok.Data;

@Data
public class InvoiceRequest {
    private String customerEmail;
    private String customerName;
    private String description;
    private double amount;
    private String currency = "ZAR";
    private String dueDate; // yyyy-MM-dd
}
