package com.example.cybersourcedemo.service;

import Api.PaymentLinksApi;
import Invokers.ApiClient;
import Model.*;
import com.example.cybersourcedemo.dto.PaymentLinkRequest;
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
public class PaymentLinkService {

    private final ApiClientFactory apiClientFactory;

    public PaymentResponse createPaymentLink(PaymentLinkRequest request) {
        try {
            ApiClient apiClient = apiClientFactory.create();

            CreatePaymentLinkRequest linkRequest = new CreatePaymentLinkRequest();

            Iplv2paymentlinksProcessingInformation processingInfo = new Iplv2paymentlinksProcessingInformation();
            processingInfo.linkType("PURCHASE");
            linkRequest.processingInformation(processingInfo);

            Iplv2paymentlinksPurchaseInformation purchaseInfo = new Iplv2paymentlinksPurchaseInformation();
            purchaseInfo.purchaseNumber("DEMO" + UUID.randomUUID().toString().replace("-", "").substring(0, 8));
            linkRequest.purchaseInformation(purchaseInfo);

            Iplv2paymentlinksOrderInformation orderInfo = new Iplv2paymentlinksOrderInformation();
            Iplv2paymentlinksOrderInformationAmountDetails amountDetails = new Iplv2paymentlinksOrderInformationAmountDetails();
            amountDetails.totalAmount(String.valueOf(request.getAmount()));
            amountDetails.currency(request.getCurrency());
            orderInfo.amountDetails(amountDetails);

            Iplv2paymentlinksOrderInformationLineItems lineItem = new Iplv2paymentlinksOrderInformationLineItems();
            lineItem.productName(request.getDescription());
            lineItem.productSku("LINK-001");
            lineItem.unitPrice(String.valueOf(request.getAmount()));
            lineItem.quantity(1);
            orderInfo.lineItems(java.util.List.of(lineItem));

            linkRequest.orderInformation(orderInfo);

            PaymentLinksApi api = new PaymentLinksApi(apiClient);
            PblPaymentLinksPost201Response result = api.createPaymentLink(linkRequest);

            String paymentUrl = null;
            if (result.getPurchaseInformation() != null) {
                paymentUrl = result.getPurchaseInformation().getPaymentLink();
            }

            Map<String, Object> details = new java.util.HashMap<>();
            details.put("linkId", result.getId());
            if (paymentUrl != null) {
                details.put("paymentUrl", paymentUrl);
            }

            return PaymentResponse.builder()
                    .status(result.getStatus())
                    .transactionId(result.getId())
                    .message("Payment link created successfully")
                    .httpStatus(Integer.parseInt(apiClient.responseCode))
                    .details(details)
                    .build();

        } catch (Invokers.ApiException e) {
            log.error("Payment link error: {}", e.getResponseBody(), e);
            throw new PaymentException("Payment link creation failed: " + e.getMessage(), e.getCode(), e.getResponseBody());
        } catch (Exception e) {
            throw new PaymentException("Payment link creation processing failed", e);
        }
    }
}
