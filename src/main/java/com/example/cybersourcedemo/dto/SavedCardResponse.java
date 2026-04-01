package com.example.cybersourcedemo.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SavedCardResponse {
    private String paymentInstrumentId;
    private String cardSuffix;
    private String cardType;
    private String expirationMonth;
    private String expirationYear;
    private String firstName;
    private String lastName;
}
