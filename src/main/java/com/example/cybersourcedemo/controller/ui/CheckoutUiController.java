package com.example.cybersourcedemo.controller.ui;

import com.example.cybersourcedemo.dto.*;
import com.example.cybersourcedemo.exception.PaymentException;
import com.example.cybersourcedemo.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequiredArgsConstructor
public class CheckoutUiController {

    private final CardPaymentService cardPaymentService;
    private final WalletPaymentService walletPaymentService;
    private final EftPaymentService eftPaymentService;
    private final TokenService tokenService;
    private final TokenizedPaymentService tokenizedPaymentService;
    private final InvoiceService invoiceService;
    private final PaymentLinkService paymentLinkService;

    // ── Page routes ──

    @GetMapping("/")
    public String index() {
        return "index";
    }

    @GetMapping("/checkout/card")
    public String cardForm(Model model) {
        model.addAttribute("paymentRequest", new PaymentRequest());
        return "checkout/card";
    }

    @GetMapping("/checkout/wallet")
    public String walletForm(Model model) {
        model.addAttribute("walletRequest", new WalletPaymentRequest());
        model.addAttribute("walletTypes", WalletType.values());
        return "checkout/wallet";
    }

    @GetMapping("/checkout/eft")
    public String eftForm(Model model) {
        model.addAttribute("eftRequest", new EftPaymentRequest());
        return "checkout/eft";
    }

    @GetMapping("/checkout/token")
    public String tokenForm(Model model) {
        model.addAttribute("tokenRequest", new TokenRequest());
        return "checkout/token";
    }

    @GetMapping("/checkout/invoice")
    public String invoiceForm(Model model) {
        model.addAttribute("invoiceRequest", new InvoiceRequest());
        return "checkout/invoice";
    }

    @GetMapping("/checkout/payment-link")
    public String paymentLinkForm(Model model) {
        model.addAttribute("linkRequest", new PaymentLinkRequest());
        return "checkout/payment-link";
    }

    // ── Card payment form handlers ──

    @PostMapping("/checkout/card/authorize")
    public String cardAuthorize(PaymentRequest request, Model model) {
        return processAndRedirect(model, "card", () -> cardPaymentService.authorize(request));
    }

    @PostMapping("/checkout/card/sale")
    public String cardSale(PaymentRequest request, Model model) {
        return processAndRedirect(model, "card", () -> cardPaymentService.sale(request));
    }

    @PostMapping("/checkout/card/capture")
    public String cardCapture(@RequestParam String transactionId,
                              @RequestParam double amount,
                              @RequestParam String currency,
                              Model model) {
        return processAndRedirect(model, "card",
                () -> cardPaymentService.capture(transactionId, amount, currency));
    }

    @PostMapping("/checkout/card/refund")
    public String cardRefund(@RequestParam String transactionId,
                             @RequestParam double amount,
                             @RequestParam String currency,
                             Model model) {
        return processAndRedirect(model, "card",
                () -> cardPaymentService.refund(transactionId, amount, currency));
    }

    @PostMapping("/checkout/card/void")
    public String cardVoid(@RequestParam String transactionId, Model model) {
        return processAndRedirect(model, "card",
                () -> cardPaymentService.voidPayment(transactionId));
    }

    // ── Wallet form handler ──

    @PostMapping("/checkout/wallet")
    public String walletPay(@RequestParam String walletType,
                            WalletPaymentRequest request,
                            Model model) {
        WalletType type = WalletType.valueOf(walletType);
        return processAndRedirect(model, "wallet",
                () -> walletPaymentService.pay(type, request));
    }

    // ── EFT form handler ──

    @PostMapping("/checkout/eft")
    public String eftPay(EftPaymentRequest request, Model model) {
        return processAndRedirect(model, "eft", () -> eftPaymentService.pay(request));
    }

    // ── Token form handlers ──

    @PostMapping("/checkout/token/store")
    public String tokenStore(TokenRequest request, Model model) {
        return processAndRedirect(model, "token",
                () -> tokenService.storeCustomerCard(request));
    }

    @PostMapping("/checkout/token/pay")
    public String tokenPay(@RequestParam String customerId,
                           @RequestParam double amount,
                           @RequestParam String currency,
                           Model model) {
        return processAndRedirect(model, "token",
                () -> tokenizedPaymentService.payWithToken(customerId, amount, currency));
    }

    // ── Invoice form handlers ──

    @PostMapping("/checkout/invoice/create")
    public String invoiceCreate(InvoiceRequest request, Model model) {
        return processAndRedirect(model, "invoice",
                () -> invoiceService.createInvoice(request));
    }

    @PostMapping("/checkout/invoice/send")
    public String invoiceSend(@RequestParam String invoiceId, Model model) {
        return processAndRedirect(model, "invoice",
                () -> invoiceService.sendInvoice(invoiceId));
    }

    // ── Payment link form handler ──

    @PostMapping("/checkout/payment-link")
    public String paymentLinkCreate(PaymentLinkRequest request, Model model) {
        return processAndRedirect(model, "payment-link",
                () -> paymentLinkService.createPaymentLink(request));
    }

    // ── Shared result handling ──

    private String processAndRedirect(Model model, String backTo, PaymentOperation operation) {
        try {
            PaymentResponse response = operation.execute();
            model.addAttribute("success", true);
            model.addAttribute("status", response.getStatus());
            model.addAttribute("message", response.getMessage());
            model.addAttribute("transactionId", response.getTransactionId());
            model.addAttribute("httpStatus", response.getHttpStatus());
            model.addAttribute("details", response.getDetails());
        } catch (PaymentException e) {
            model.addAttribute("success", false);
            model.addAttribute("message", e.getMessage());
            model.addAttribute("errorBody", e.getResponseBody());
        } catch (Exception e) {
            model.addAttribute("success", false);
            model.addAttribute("message", "Unexpected error: " + e.getMessage());
        }
        model.addAttribute("backTo", backTo);
        return "result";
    }

    @FunctionalInterface
    private interface PaymentOperation {
        PaymentResponse execute();
    }
}
