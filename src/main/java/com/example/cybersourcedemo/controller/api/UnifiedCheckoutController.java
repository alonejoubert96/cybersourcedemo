package com.example.cybersourcedemo.controller.api;

import com.example.cybersourcedemo.dto.PaymentResponse;
import com.example.cybersourcedemo.service.UnifiedCheckoutService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/unified-checkout")
@RequiredArgsConstructor
public class UnifiedCheckoutController {

    private final UnifiedCheckoutService unifiedCheckoutService;

    /**
     * Authorize a payment using a transient token from UC v1.
     * The frontend sends the transient token after the customer completes the UC widget.
     */
    @PostMapping("/pay")
    public ResponseEntity<PaymentResponse> pay(@RequestBody Map<String, Object> body) {
        String transientToken = (String) body.get("transientToken");
        double amount = body.get("amount") instanceof Number
                ? ((Number) body.get("amount")).doubleValue()
                : Double.parseDouble(body.get("amount").toString());
        String currency = (String) body.getOrDefault("currency", "ZAR");

        return ResponseEntity.ok(
                unifiedCheckoutService.authorizeWithTransientToken(transientToken, amount, currency));
    }
}
