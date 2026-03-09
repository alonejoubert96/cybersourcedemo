package com.example.cybersourcedemo.controller.api;

import com.example.cybersourcedemo.dto.PaymentRequest;
import com.example.cybersourcedemo.dto.PaymentResponse;
import com.example.cybersourcedemo.service.CardPaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments/card")
@RequiredArgsConstructor
public class CardPaymentController {

    private final CardPaymentService cardPaymentService;

    @PostMapping("/authorize")
    public ResponseEntity<PaymentResponse> authorize(@RequestBody PaymentRequest request) {
        return ResponseEntity.ok(cardPaymentService.authorize(request));
    }

    @PostMapping("/sale")
    public ResponseEntity<PaymentResponse> sale(@RequestBody PaymentRequest request) {
        return ResponseEntity.ok(cardPaymentService.sale(request));
    }

    @PostMapping("/{id}/capture")
    public ResponseEntity<PaymentResponse> capture(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        double amount = ((Number) body.getOrDefault("amount", 25.00)).doubleValue();
        String currency = (String) body.getOrDefault("currency", "USD");
        return ResponseEntity.ok(cardPaymentService.capture(id, amount, currency));
    }

    @PostMapping("/{id}/refund")
    public ResponseEntity<PaymentResponse> refund(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        double amount = ((Number) body.getOrDefault("amount", 25.00)).doubleValue();
        String currency = (String) body.getOrDefault("currency", "USD");
        return ResponseEntity.ok(cardPaymentService.refund(id, amount, currency));
    }

    @PostMapping("/{id}/void")
    public ResponseEntity<PaymentResponse> voidPayment(@PathVariable String id) {
        return ResponseEntity.ok(cardPaymentService.voidPayment(id));
    }
}
