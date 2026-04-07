package com.example.cybersourcedemo.controller.api;

import com.example.cybersourcedemo.dto.PaymentResponse;
import com.example.cybersourcedemo.service.TokenizedCheckoutService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/tokenized-checkout")
@RequiredArgsConstructor
public class TokenizedCheckoutController {

    private final TokenizedCheckoutService tokenizedCheckoutService;

    @PostMapping("/pay")
    public ResponseEntity<PaymentResponse> pay(@RequestBody Map<String, Object> body) {
        String transientToken = (String) body.get("transientToken");
        double amount = ((Number) body.getOrDefault("amount", 0.0)).doubleValue();
        String currency = (String) body.getOrDefault("currency", "ZAR");
        return ResponseEntity.ok(tokenizedCheckoutService.payWithTransientToken(transientToken, amount, currency));
    }
}
