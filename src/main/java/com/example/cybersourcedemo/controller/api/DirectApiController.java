package com.example.cybersourcedemo.controller.api;

import com.example.cybersourcedemo.dto.DirectApiRequest;
import com.example.cybersourcedemo.dto.PaymentResponse;
import com.example.cybersourcedemo.service.DirectApiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/direct")
@RequiredArgsConstructor
public class DirectApiController {

    private final DirectApiService directApiService;

    @PostMapping("/pay")
    public ResponseEntity<PaymentResponse> pay(@RequestBody DirectApiRequest request) {
        return ResponseEntity.ok(directApiService.processPayment(request));
    }
}
