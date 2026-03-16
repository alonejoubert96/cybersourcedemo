package com.example.cybersourcedemo.service;

import Api.PaymentsApi;
import Invokers.ApiClient;
import Model.*;
import com.example.cybersourcedemo.dto.PaymentResponse;
import com.example.cybersourcedemo.dto.WalletPaymentRequest;
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
public class WalletPaymentService {

    private final ApiClientFactory apiClientFactory;

    public PaymentResponse pay(WalletType walletType, WalletPaymentRequest request) {
        try {
            ApiClient apiClient = apiClientFactory.create();

            CreatePaymentRequest paymentRequest = new CreatePaymentRequest();

            Ptsv2paymentsClientReferenceInformation clientRef = new Ptsv2paymentsClientReferenceInformation();
            clientRef.code("wallet-" + UUID.randomUUID().toString().substring(0, 8));
            paymentRequest.clientReferenceInformation(clientRef);

            Ptsv2paymentsProcessingInformation processingInfo = new Ptsv2paymentsProcessingInformation();
            processingInfo.paymentSolution(walletType.getPaymentSolution());
            paymentRequest.processingInformation(processingInfo);

            Ptsv2paymentsPaymentInformation paymentInfo = new Ptsv2paymentsPaymentInformation();
            Ptsv2paymentsPaymentInformationTokenizedCard tokenizedCard = new Ptsv2paymentsPaymentInformationTokenizedCard();
            tokenizedCard.number(request.getTokenData());
            tokenizedCard.expirationMonth(request.getExpirationMonth());
            tokenizedCard.expirationYear(request.getExpirationYear());
            tokenizedCard.cryptogram(request.getCryptogram());
            tokenizedCard.transactionType("1");
            paymentInfo.tokenizedCard(tokenizedCard);
            paymentRequest.paymentInformation(paymentInfo);

            Ptsv2paymentsOrderInformation orderInfo = new Ptsv2paymentsOrderInformation();
            Ptsv2paymentsOrderInformationAmountDetails amountDetails = new Ptsv2paymentsOrderInformationAmountDetails();
            amountDetails.totalAmount(String.valueOf(request.getAmount()));
            amountDetails.currency(request.getCurrency());
            orderInfo.amountDetails(amountDetails);
            paymentRequest.orderInformation(orderInfo);

            PaymentsApi api = new PaymentsApi(apiClient);
            PtsV2PaymentsPost201Response result = api.createPayment(paymentRequest);

            return PaymentResponse.builder()
                    .status(result.getStatus())
                    .transactionId(result.getId())
                    .message(walletType.getDisplayName() + " payment successful")
                    .httpStatus(Integer.parseInt(apiClient.responseCode))
                    .details(Map.of("walletType", walletType.name()))
                    .build();

        } catch (Invokers.ApiException e) {
            log.error("Wallet payment error: {}", e.getResponseBody(), e);
            throw new PaymentException("Wallet payment failed: " + e.getMessage(), e.getCode(), e.getResponseBody());
        } catch (Exception e) {
            throw new PaymentException("Wallet payment processing failed", e);
        }
    }
}
