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
        return payWithToken(customerId, amount, currency, null);
    }

    public PaymentResponse payWithToken(String customerId, double amount, String currency,
                                         Map<String, String> threeDsData) {
        try {
            ApiClient apiClient = apiClientFactory.create();

            CreatePaymentRequest paymentRequest = new CreatePaymentRequest();

            Ptsv2paymentsClientReferenceInformation clientRef = new Ptsv2paymentsClientReferenceInformation();
            clientRef.code("token-" + UUID.randomUUID().toString().substring(0, 8));
            paymentRequest.clientReferenceInformation(clientRef);

            Ptsv2paymentsProcessingInformation processingInfo = new Ptsv2paymentsProcessingInformation();
            processingInfo.capture(true);
            if (threeDsData != null && threeDsData.get("indicator") != null) {
                processingInfo.commerceIndicator(threeDsData.get("indicator"));
            }
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

            // Include 3DS authentication data if provided
            if (threeDsData != null) {
                Ptsv2paymentsConsumerAuthenticationInformation consumerAuth = new Ptsv2paymentsConsumerAuthenticationInformation();
                if (threeDsData.get("cavv") != null) consumerAuth.cavv(threeDsData.get("cavv"));
                if (threeDsData.get("eciRaw") != null) consumerAuth.eciRaw(threeDsData.get("eciRaw"));
                if (threeDsData.get("paresStatus") != null) consumerAuth.paresStatus(threeDsData.get("paresStatus"));
                if (threeDsData.get("veresEnrolled") != null) consumerAuth.veresEnrolled(threeDsData.get("veresEnrolled"));
                if (threeDsData.get("xid") != null) consumerAuth.xid(threeDsData.get("xid"));
                if (threeDsData.get("specificationVersion") != null) consumerAuth.paSpecificationVersion(threeDsData.get("specificationVersion"));
                if (threeDsData.get("directoryServerTransactionId") != null) consumerAuth.directoryServerTransactionId(threeDsData.get("directoryServerTransactionId"));
                if (threeDsData.get("authenticationTransactionId") != null) consumerAuth.authenticationTransactionId(threeDsData.get("authenticationTransactionId"));
                paymentRequest.consumerAuthenticationInformation(consumerAuth);
                log.info("Payment includes 3DS data — indicator: {}, paresStatus: {}", threeDsData.get("indicator"), threeDsData.get("paresStatus"));
            }

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
