package com.example.cybersourcedemo.controller.api;

import com.example.cybersourcedemo.dto.PaymentResponse;
import com.example.cybersourcedemo.service.FlexMicroformService;
import com.example.cybersourcedemo.service.TokenizedCheckoutService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/tokenized-checkout")
@RequiredArgsConstructor
public class TokenizedCheckoutController {

    private final TokenizedCheckoutService tokenizedCheckoutService;
    private final FlexMicroformService flexMicroformService;

    @PostMapping("/capture-context")
    public ResponseEntity<Map<String, String>> getCaptureContext(HttpServletRequest request) {
        String targetOrigin = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort();
        String jwt = flexMicroformService.generateCaptureContext(targetOrigin);
        return ResponseEntity.ok(Map.of("jwt", jwt));
    }

    @PostMapping("/pay")
    public ResponseEntity<PaymentResponse> pay(@RequestBody Map<String, Object> body) {
        String transientToken = (String) body.get("transientToken");
        double amount = ((Number) body.getOrDefault("amount", 0.0)).doubleValue();
        String currency = (String) body.getOrDefault("currency", "ZAR");
        return ResponseEntity.ok(tokenizedCheckoutService.payWithTransientToken(transientToken, amount, currency));
    }

    @SuppressWarnings("unchecked")
    @PostMapping("/pay-default")
    public ResponseEntity<PaymentResponse> payDefault(@RequestBody Map<String, Object> body) {
        double amount = ((Number) body.getOrDefault("amount", 0.0)).doubleValue();
        String currency = (String) body.getOrDefault("currency", "ZAR");
        Map<String, String> threeDsData = (Map<String, String>) body.get("threeDsData");
        return ResponseEntity.ok(tokenizedCheckoutService.payWithDefaultCard(amount, currency, threeDsData));
    }
}
