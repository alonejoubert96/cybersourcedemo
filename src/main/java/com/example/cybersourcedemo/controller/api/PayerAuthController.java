package com.example.cybersourcedemo.controller.api;

import com.example.cybersourcedemo.service.PayerAuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/3ds")
@RequiredArgsConstructor
@Slf4j
public class PayerAuthController {

    private final PayerAuthService payerAuthService;

    private Map<String, String> resolveCard(Map<String, String> body) {
        String cardSuffix = body.get("cardSuffix");
        Map<String, String> card = payerAuthService.lookupCard(cardSuffix);
        if (card == null) {
            throw new IllegalArgumentException("Unknown card suffix: " + cardSuffix);
        }
        return card;
    }

    /**
     * Step 1: Setup payer authentication.
     */
    @PostMapping("/setup")
    public ResponseEntity<Map<String, String>> setup(@RequestBody Map<String, String> body) {
        Map<String, String> card = resolveCard(body);
        return ResponseEntity.ok(payerAuthService.setup(
                card.get("number"), card.get("type"), card.get("expirationMonth"), card.get("expirationYear")));
    }

    /**
     * Step 3: Check enrollment.
     */
    @SuppressWarnings("unchecked")
    @PostMapping("/enroll")
    public ResponseEntity<Map<String, Object>> checkEnrollment(@RequestBody Map<String, Object> body,
                                                                HttpServletRequest request) {
        String cardSuffix = (String) body.get("cardSuffix");
        Map<String, String> card = payerAuthService.lookupCard(cardSuffix);
        if (card == null) throw new IllegalArgumentException("Unknown card suffix: " + cardSuffix);

        String amount = (String) body.get("amount");
        String currency = (String) body.getOrDefault("currency", "ZAR");
        String referenceId = (String) body.get("referenceId");

        // Build returnUrl dynamically from the current request
        String scheme = request.getScheme();
        String host = request.getServerName();
        int port = request.getServerPort();
        String returnUrl = scheme + "://" + host + ":" + port + "/3ds/callback";

        Map<String, String> browserInfo = (Map<String, String>) body.getOrDefault("browserInfo", new HashMap<>());

        return ResponseEntity.ok(payerAuthService.checkEnrollment(
                card.get("number"), card.get("type"), card.get("expirationMonth"), card.get("expirationYear"),
                amount, currency, referenceId, returnUrl, browserInfo));
    }

    /**
     * Step 5: Validate authentication results after challenge.
     */
    @PostMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateResults(@RequestBody Map<String, String> body) {
        Map<String, String> card = resolveCard(body);

        return ResponseEntity.ok(payerAuthService.validateResults(
                body.get("authenticationTransactionId"),
                card.get("number"), card.get("type"), card.get("expirationMonth"), card.get("expirationYear"),
                body.get("amount"), body.getOrDefault("currency", "ZAR")));
    }
}
