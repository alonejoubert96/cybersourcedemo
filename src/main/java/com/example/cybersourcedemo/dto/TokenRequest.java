package com.example.cybersourcedemo.dto;

import lombok.Data;

@Data
public class TokenRequest {
    private String cardNumber;
    private String expirationMonth;
    private String expirationYear;
    private String firstName;
    private String lastName;
    private String email;
}
