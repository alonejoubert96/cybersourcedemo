package com.example.cybersourcedemo.controller.api;

import com.example.cybersourcedemo.dto.PaymentResponse;
import com.example.cybersourcedemo.dto.TokenRequest;
import com.example.cybersourcedemo.service.TokenService;
import com.example.cybersourcedemo.service.TokenizedPaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/tokens")
@RequiredArgsConstructor
public class TokenController {

    private final TokenService tokenService;
    private final TokenizedPaymentService tokenizedPaymentService;

    @PostMapping("/customers")
    public ResponseEntity<PaymentResponse> storeCard(@RequestBody TokenRequest request) {
        return ResponseEntity.ok(tokenService.storeCustomerCard(request));
    }

    @PostMapping("/pay")
    public ResponseEntity<PaymentResponse> payWithToken(@RequestBody Map<String, Object> body) {
        String customerId = (String) body.get("customerId");
        double amount = ((Number) body.getOrDefault("amount", 25.00)).doubleValue();
        String currency = (String) body.getOrDefault("currency", "USD");
        return ResponseEntity.ok(tokenizedPaymentService.payWithToken(customerId, amount, currency));
    }
}
