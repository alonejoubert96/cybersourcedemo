package com.example.cybersourcedemo.service;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum WalletType {
    GOOGLE_PAY("012", "Google Pay"),
    APPLE_PAY("001", "Apple Pay"),
    SAMSUNG_PAY("008", "Samsung Pay");

    private final String paymentSolution;
    private final String displayName;
}
