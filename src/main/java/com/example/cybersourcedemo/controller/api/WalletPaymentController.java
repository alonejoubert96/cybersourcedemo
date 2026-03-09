package com.example.cybersourcedemo.controller.api;

import com.example.cybersourcedemo.dto.PaymentResponse;
import com.example.cybersourcedemo.dto.WalletPaymentRequest;
import com.example.cybersourcedemo.service.WalletPaymentService;
import com.example.cybersourcedemo.service.WalletType;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments/wallet")
@RequiredArgsConstructor
public class WalletPaymentController {

    private final WalletPaymentService walletPaymentService;

    @PostMapping("/{type}")
    public ResponseEntity<PaymentResponse> pay(
            @PathVariable String type,
            @RequestBody WalletPaymentRequest request) {
        WalletType walletType = WalletType.valueOf(type.toUpperCase());
        return ResponseEntity.ok(walletPaymentService.pay(walletType, request));
    }
}
