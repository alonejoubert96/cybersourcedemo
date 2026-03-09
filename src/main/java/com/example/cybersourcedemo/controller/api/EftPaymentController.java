package com.example.cybersourcedemo.controller.api;

import com.example.cybersourcedemo.dto.EftPaymentRequest;
import com.example.cybersourcedemo.dto.PaymentResponse;
import com.example.cybersourcedemo.service.EftPaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments/eft")
@RequiredArgsConstructor
public class EftPaymentController {

    private final EftPaymentService eftPaymentService;

    @PostMapping
    public ResponseEntity<PaymentResponse> pay(@RequestBody EftPaymentRequest request) {
        return ResponseEntity.ok(eftPaymentService.pay(request));
    }
}
