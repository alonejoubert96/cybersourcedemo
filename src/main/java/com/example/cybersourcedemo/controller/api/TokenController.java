package com.example.cybersourcedemo.controller.api;

import com.example.cybersourcedemo.dto.PaymentResponse;
import com.example.cybersourcedemo.dto.SavedCardResponse;
import com.example.cybersourcedemo.dto.TokenRequest;
import com.example.cybersourcedemo.service.TokenService;
import com.example.cybersourcedemo.service.TokenizedPaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tokens")
@RequiredArgsConstructor
public class TokenController {

    private final TokenService tokenService;
    private final TokenizedPaymentService tokenizedPaymentService;

    @PostMapping("/seed")
    public ResponseEntity<Map<String, String>> seedTestCards() {
        String customerId = tokenService.seedTestCards();
        return ResponseEntity.ok(Map.of("customerId", customerId));
    }

    @PostMapping("/customers")
    public ResponseEntity<PaymentResponse> storeCard(@RequestBody TokenRequest request) {
        return ResponseEntity.ok(tokenService.storeCustomerCard(request));
    }

    @GetMapping("/customers/{customerId}/cards")
    public ResponseEntity<List<SavedCardResponse>> listCards(@PathVariable String customerId) {
        return ResponseEntity.ok(tokenService.listCustomerCards(customerId));
    }

    @DeleteMapping("/customers/{customerId}/cards/{instrumentId}")
    public ResponseEntity<Void> deleteCard(@PathVariable String customerId,
                                           @PathVariable String instrumentId) {
        tokenService.deleteCustomerCard(customerId, instrumentId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/pay")
    public ResponseEntity<PaymentResponse> payWithToken(@RequestBody Map<String, Object> body) {
        String customerId = (String) body.get("customerId");
        double amount = ((Number) body.getOrDefault("amount", 25.00)).doubleValue();
        String currency = (String) body.getOrDefault("currency", "ZAR");
        return ResponseEntity.ok(tokenizedPaymentService.payWithToken(customerId, amount, currency));
    }
}
