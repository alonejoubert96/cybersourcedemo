package com.example.cybersourcedemo.service;

import Api.CaptureApi;
import Api.PaymentsApi;
import Api.RefundApi;
import Api.VoidApi;
import Invokers.ApiClient;
import Model.*;
import com.example.cybersourcedemo.dto.PaymentRequest;
import com.example.cybersourcedemo.dto.PaymentResponse;
import com.example.cybersourcedemo.exception.PaymentException;
import com.example.cybersourcedemo.sdk.ApiClientFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CardPaymentService {

    private final ApiClientFactory apiClientFactory;

    public PaymentResponse authorize(PaymentRequest request) {
        return processPayment(request, false);
    }

    public PaymentResponse sale(PaymentRequest request) {
        return processPayment(request, true);
    }

    private PaymentResponse processPayment(PaymentRequest request, boolean capture) {
        try {
            ApiClient apiClient = apiClientFactory.create();

            CreatePaymentRequest paymentRequest = new CreatePaymentRequest();

            // Client reference
            Ptsv2paymentsClientReferenceInformation clientRef = new Ptsv2paymentsClientReferenceInformation();
            clientRef.code("demo-" + UUID.randomUUID().toString().substring(0, 8));
            paymentRequest.clientReferenceInformation(clientRef);

            // Processing info
            Ptsv2paymentsProcessingInformation processingInfo = new Ptsv2paymentsProcessingInformation();
            processingInfo.capture(capture);
            paymentRequest.processingInformation(processingInfo);

            // Card info
            Ptsv2paymentsPaymentInformation paymentInfo = new Ptsv2paymentsPaymentInformation();
            Ptsv2paymentsPaymentInformationCard card = new Ptsv2paymentsPaymentInformationCard();
            card.number(request.getCardNumber());
            card.expirationMonth(request.getExpirationMonth());
            card.expirationYear(request.getExpirationYear());
            if (request.getSecurityCode() != null) {
                card.securityCode(request.getSecurityCode());
            }
            paymentInfo.card(card);
            paymentRequest.paymentInformation(paymentInfo);

            // Order/amount
            Ptsv2paymentsOrderInformation orderInfo = new Ptsv2paymentsOrderInformation();
            Ptsv2paymentsOrderInformationAmountDetails amountDetails = new Ptsv2paymentsOrderInformationAmountDetails();
            amountDetails.totalAmount(String.valueOf(request.getAmount()));
            amountDetails.currency(request.getCurrency());
            orderInfo.amountDetails(amountDetails);

            // Bill-to
            Ptsv2paymentsOrderInformationBillTo billTo = new Ptsv2paymentsOrderInformationBillTo();
            billTo.firstName(request.getFirstName() != null ? request.getFirstName() : "John");
            billTo.lastName(request.getLastName() != null ? request.getLastName() : "Doe");
            billTo.email(request.getEmail() != null ? request.getEmail() : "test@example.com");
            billTo.address1("1 Market St");
            billTo.locality("San Francisco");
            billTo.administrativeArea("CA");
            billTo.postalCode("94105");
            billTo.country("US");
            orderInfo.billTo(billTo);
            paymentRequest.orderInformation(orderInfo);

            PaymentsApi api = new PaymentsApi(apiClient);
            PtsV2PaymentsPost201Response result = api.createPayment(paymentRequest);

            return PaymentResponse.builder()
                    .status(result.getStatus())
                    .transactionId(result.getId())
                    .message(capture ? "Sale successful" : "Authorization successful")
                    .httpStatus(Integer.parseInt(apiClient.responseCode))
                    .details(Map.of("reconciliationId",
                            result.getReconciliationId() != null ? result.getReconciliationId() : ""))
                    .build();

        } catch (Invokers.ApiException e) {
            log.error("CyberSource API error: {}", e.getResponseBody(), e);
            throw new PaymentException("Payment failed: " + e.getMessage(), e.getCode(), e.getResponseBody());
        } catch (Exception e) {
            log.error("Payment processing error", e);
            throw new PaymentException("Payment processing failed", e);
        }
    }

    public PaymentResponse capture(String paymentId, double amount, String currency) {
        try {
            ApiClient apiClient = apiClientFactory.create();

            CapturePaymentRequest captureRequest = new CapturePaymentRequest();

            Ptsv2paymentsClientReferenceInformation clientRef = new Ptsv2paymentsClientReferenceInformation();
            clientRef.code("capture-" + UUID.randomUUID().toString().substring(0, 8));
            captureRequest.clientReferenceInformation(clientRef);

            Ptsv2paymentsidcapturesOrderInformationAmountDetails amountDetails = new Ptsv2paymentsidcapturesOrderInformationAmountDetails();
            amountDetails.totalAmount(String.valueOf(amount));
            amountDetails.currency(currency);
            Ptsv2paymentsidcapturesOrderInformation orderInfo = new Ptsv2paymentsidcapturesOrderInformation();
            orderInfo.amountDetails(amountDetails);
            captureRequest.orderInformation(orderInfo);

            CaptureApi api = new CaptureApi(apiClient);
            PtsV2PaymentsCapturesPost201Response result = api.capturePayment(captureRequest, paymentId);

            return PaymentResponse.builder()
                    .status(result.getStatus())
                    .transactionId(result.getId())
                    .message("Capture successful")
                    .httpStatus(Integer.parseInt(apiClient.responseCode))
                    .build();

        } catch (Invokers.ApiException e) {
            log.error("Capture error: {}", e.getResponseBody(), e);
            throw new PaymentException("Capture failed: " + e.getMessage(), e.getCode(), e.getResponseBody());
        } catch (Exception e) {
            throw new PaymentException("Capture processing failed", e);
        }
    }

    public PaymentResponse refund(String captureId, double amount, String currency) {
        try {
            ApiClient apiClient = apiClientFactory.create();

            RefundCaptureRequest refundRequest = new RefundCaptureRequest();

            Ptsv2paymentsidrefundsClientReferenceInformation clientRef = new Ptsv2paymentsidrefundsClientReferenceInformation();
            clientRef.code("refund-" + UUID.randomUUID().toString().substring(0, 8));
            refundRequest.clientReferenceInformation(clientRef);

            Ptsv2paymentsidcapturesOrderInformationAmountDetails amountDetails = new Ptsv2paymentsidcapturesOrderInformationAmountDetails();
            amountDetails.totalAmount(String.valueOf(amount));
            amountDetails.currency(currency);
            Ptsv2paymentsidrefundsOrderInformation orderInfo = new Ptsv2paymentsidrefundsOrderInformation();
            orderInfo.amountDetails(amountDetails);
            refundRequest.orderInformation(orderInfo);

            RefundApi api = new RefundApi(apiClient);
            PtsV2PaymentsRefundPost201Response result = api.refundCapture(refundRequest, captureId);

            return PaymentResponse.builder()
                    .status(result.getStatus())
                    .transactionId(result.getId())
                    .message("Refund successful")
                    .httpStatus(Integer.parseInt(apiClient.responseCode))
                    .build();

        } catch (Invokers.ApiException e) {
            log.error("Refund error: {}", e.getResponseBody(), e);
            throw new PaymentException("Refund failed: " + e.getMessage(), e.getCode(), e.getResponseBody());
        } catch (Exception e) {
            throw new PaymentException("Refund processing failed", e);
        }
    }

    public PaymentResponse voidPayment(String paymentId) {
        try {
            ApiClient apiClient = apiClientFactory.create();

            VoidPaymentRequest voidRequest = new VoidPaymentRequest();

            Ptsv2paymentsidreversalsClientReferenceInformation clientRef = new Ptsv2paymentsidreversalsClientReferenceInformation();
            clientRef.code("void-" + UUID.randomUUID().toString().substring(0, 8));
            voidRequest.clientReferenceInformation(clientRef);

            VoidApi api = new VoidApi(apiClient);
            PtsV2PaymentsVoidsPost201Response result = api.voidPayment(voidRequest, paymentId);

            return PaymentResponse.builder()
                    .status(result.getStatus())
                    .transactionId(result.getId())
                    .message("Void successful")
                    .httpStatus(Integer.parseInt(apiClient.responseCode))
                    .build();

        } catch (Invokers.ApiException e) {
            log.error("Void error: {}", e.getResponseBody(), e);
            throw new PaymentException("Void failed: " + e.getMessage(), e.getCode(), e.getResponseBody());
        } catch (Exception e) {
            throw new PaymentException("Void processing failed", e);
        }
    }
}
