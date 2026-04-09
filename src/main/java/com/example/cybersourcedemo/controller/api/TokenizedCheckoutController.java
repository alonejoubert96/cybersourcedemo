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

    @SuppressWarnings("unchecked")
    @PostMapping("/pay")
    public ResponseEntity<PaymentResponse> pay(@RequestBody Map<String, Object> body) {
        String transientToken = (String) body.get("transientToken");
        double amount = parseAmount(body.get("amount"));
        String currency = (String) body.getOrDefault("currency", "ZAR");
        Map<String, String> threeDsData = (Map<String, String>) body.get("threeDsData");
        return ResponseEntity.ok(tokenizedCheckoutService.payWithTransientToken(transientToken, amount, currency, threeDsData));
    }


    private double parseAmount(Object value) {
        if (value instanceof Number n) return n.doubleValue();
        if (value instanceof String s) return Double.parseDouble(s);
        return 0.0;
    }
}
