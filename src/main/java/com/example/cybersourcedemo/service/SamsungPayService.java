package com.example.cybersourcedemo.service;

import Api.PaymentsApi;
import Invokers.ApiClient;
import Model.*;
import com.example.cybersourcedemo.dto.PaymentResponse;
import com.example.cybersourcedemo.dto.SamsungPayRequest;
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
public class SamsungPayService {

    private final ApiClientFactory apiClientFactory;

    public PaymentResponse processPayment(SamsungPayRequest request) {
        try {
            ApiClient apiClient = apiClientFactory.create();

            CreatePaymentRequest paymentRequest = new CreatePaymentRequest();

            // Client reference
            Ptsv2paymentsClientReferenceInformation clientRef = new Ptsv2paymentsClientReferenceInformation();
            clientRef.code("samsung-" + UUID.randomUUID().toString().substring(0, 8));
            paymentRequest.clientReferenceInformation(clientRef);

            // Processing info — paymentSolution "008" = Samsung Pay
            Ptsv2paymentsProcessingInformation processingInfo = new Ptsv2paymentsProcessingInformation();
            processingInfo.paymentSolution("008");
            processingInfo.capture(true);
            paymentRequest.processingInformation(processingInfo);

            // Tokenized card data (merchant decryption — DPAN + cryptogram)
            Ptsv2paymentsPaymentInformation paymentInfo = new Ptsv2paymentsPaymentInformation();
            Ptsv2paymentsPaymentInformationTokenizedCard tokenizedCard = new Ptsv2paymentsPaymentInformationTokenizedCard();
            tokenizedCard.number(request.getDpan());
            tokenizedCard.expirationMonth(request.getExpirationMonth());
            tokenizedCard.expirationYear(request.getExpirationYear());
            tokenizedCard.cryptogram(request.getCryptogram());
            tokenizedCard.transactionType("1");
            tokenizedCard.type(request.getCardType());
            paymentInfo.tokenizedCard(tokenizedCard);
            paymentRequest.paymentInformation(paymentInfo);

            // Order information
            Ptsv2paymentsOrderInformation orderInfo = new Ptsv2paymentsOrderInformation();
            Ptsv2paymentsOrderInformationAmountDetails amountDetails = new Ptsv2paymentsOrderInformationAmountDetails();
            amountDetails.totalAmount(String.valueOf(request.getAmount()));
            amountDetails.currency(request.getCurrency());
            orderInfo.amountDetails(amountDetails);
            paymentRequest.orderInformation(orderInfo);

            // Bill-to (required for Samsung Pay)
            Ptsv2paymentsOrderInformationBillTo billTo = new Ptsv2paymentsOrderInformationBillTo();
            billTo.firstName("Demo");
            billTo.lastName("User");
            billTo.address1("123 Main Street");
            billTo.locality("Cape Town");
            billTo.administrativeArea("Western Cape");
            billTo.postalCode("8001");
            billTo.country("ZA");
            billTo.email("demo@example.com");
            orderInfo.billTo(billTo);

            PaymentsApi api = new PaymentsApi(apiClient);
            PtsV2PaymentsPost201Response result = api.createPayment(paymentRequest);

            return PaymentResponse.builder()
                    .status(result.getStatus())
                    .transactionId(result.getId())
                    .message("Samsung Pay payment successful")
                    .httpStatus(Integer.parseInt(apiClient.responseCode))
                    .details(Map.of("paymentSolution", "008"))
                    .build();

        } catch (Invokers.ApiException e) {
            log.error("Samsung Pay error: {}", e.getResponseBody(), e);
            throw new PaymentException("Samsung Pay payment failed: " + e.getMessage(), e.getCode(), e.getResponseBody());
        } catch (Exception e) {
            throw new PaymentException("Samsung Pay payment processing failed", e);
        }
    }
}
