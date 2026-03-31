package com.example.cybersourcedemo.controller.api;

import com.example.cybersourcedemo.dto.PaymentResponse;
import com.example.cybersourcedemo.dto.SamsungPayRequest;
import com.example.cybersourcedemo.service.SamsungPayService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/samsung-pay")
@RequiredArgsConstructor
public class SamsungPayController {

    private final SamsungPayService samsungPayService;

    @PostMapping
    public ResponseEntity<PaymentResponse> pay(@RequestBody SamsungPayRequest request) {
        return ResponseEntity.ok(samsungPayService.processPayment(request));
    }
}
