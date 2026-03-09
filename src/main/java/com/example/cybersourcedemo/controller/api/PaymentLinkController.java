package com.example.cybersourcedemo.controller.api;

import com.example.cybersourcedemo.dto.PaymentLinkRequest;
import com.example.cybersourcedemo.dto.PaymentResponse;
import com.example.cybersourcedemo.service.PaymentLinkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payment-links")
@RequiredArgsConstructor
public class PaymentLinkController {

    private final PaymentLinkService paymentLinkService;

    @PostMapping
    public ResponseEntity<PaymentResponse> create(@RequestBody PaymentLinkRequest request) {
        return ResponseEntity.ok(paymentLinkService.createPaymentLink(request));
    }
}
