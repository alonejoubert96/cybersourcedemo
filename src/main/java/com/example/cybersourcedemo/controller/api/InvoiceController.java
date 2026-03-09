package com.example.cybersourcedemo.controller.api;

import com.example.cybersourcedemo.dto.InvoiceRequest;
import com.example.cybersourcedemo.dto.PaymentResponse;
import com.example.cybersourcedemo.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @PostMapping
    public ResponseEntity<PaymentResponse> create(@RequestBody InvoiceRequest request) {
        return ResponseEntity.ok(invoiceService.createInvoice(request));
    }

    @PostMapping("/{id}/send")
    public ResponseEntity<PaymentResponse> send(@PathVariable String id) {
        return ResponseEntity.ok(invoiceService.sendInvoice(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponse> get(@PathVariable String id) {
        return ResponseEntity.ok(invoiceService.getInvoice(id));
    }
}
