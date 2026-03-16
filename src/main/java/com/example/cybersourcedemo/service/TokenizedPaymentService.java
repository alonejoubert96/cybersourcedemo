package com.example.cybersourcedemo.service;

import Api.PaymentsApi;
import Invokers.ApiClient;
import Model.*;
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
public class TokenizedPaymentService {

    private final ApiClientFactory apiClientFactory;

    public PaymentResponse payWithToken(String customerId, double amount, String currency) {
        try {
            ApiClient apiClient = apiClientFactory.create();

            CreatePaymentRequest paymentRequest = new CreatePaymentRequest();

            Ptsv2paymentsClientReferenceInformation clientRef = new Ptsv2paymentsClientReferenceInformation();
            clientRef.code("token-" + UUID.randomUUID().toString().substring(0, 8));
            paymentRequest.clientReferenceInformation(clientRef);

            Ptsv2paymentsProcessingInformation processingInfo = new Ptsv2paymentsProcessingInformation();
            processingInfo.capture(true);
            paymentRequest.processingInformation(processingInfo);

            Ptsv2paymentsPaymentInformation paymentInfo = new Ptsv2paymentsPaymentInformation();
            Ptsv2paymentsPaymentInformationCustomer customer = new Ptsv2paymentsPaymentInformationCustomer();
            customer.id(customerId);
            paymentInfo.customer(customer);
            paymentRequest.paymentInformation(paymentInfo);

            Ptsv2paymentsOrderInformation orderInfo = new Ptsv2paymentsOrderInformation();
            Ptsv2paymentsOrderInformationAmountDetails amountDetails = new Ptsv2paymentsOrderInformationAmountDetails();
            amountDetails.totalAmount(String.valueOf(amount));
            amountDetails.currency(currency);
            orderInfo.amountDetails(amountDetails);
            paymentRequest.orderInformation(orderInfo);

            PaymentsApi api = new PaymentsApi(apiClient);
            PtsV2PaymentsPost201Response result = api.createPayment(paymentRequest);

            return PaymentResponse.builder()
                    .status(result.getStatus())
                    .transactionId(result.getId())
                    .message("Tokenized payment successful")
                    .httpStatus(Integer.parseInt(apiClient.responseCode))
                    .details(Map.of("customerId", customerId))
                    .build();

        } catch (Invokers.ApiException e) {
            log.error("Tokenized payment error: {}", e.getResponseBody(), e);
            throw new PaymentException("Tokenized payment failed: " + e.getMessage(), e.getCode(), e.getResponseBody());
        } catch (Exception e) {
            throw new PaymentException("Tokenized payment processing failed", e);
        }
    }
}
