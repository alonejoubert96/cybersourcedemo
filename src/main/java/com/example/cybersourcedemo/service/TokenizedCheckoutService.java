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
public class TokenizedCheckoutService {

    private final ApiClientFactory apiClientFactory;

    public PaymentResponse payWithTransientToken(String transientTokenJwt, double amount, String currency, Map<String, String> threeDsData) {
        try {
            ApiClient apiClient = apiClientFactory.create();

            CreatePaymentRequest paymentRequest = new CreatePaymentRequest();

            Ptsv2paymentsClientReferenceInformation clientRef = new Ptsv2paymentsClientReferenceInformation();
            clientRef.code("flex-" + UUID.randomUUID().toString().substring(0, 8));
            paymentRequest.clientReferenceInformation(clientRef);

            Ptsv2paymentsProcessingInformation processingInfo = new Ptsv2paymentsProcessingInformation();
            processingInfo.capture(true);

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
                if (threeDsData.get("indicator") != null) processingInfo.commerceIndicator(threeDsData.get("indicator"));
                paymentRequest.consumerAuthenticationInformation(consumerAuth);
            }

            paymentRequest.processingInformation(processingInfo);

            // Transient token from Flex Microform — contains encrypted card data
            Ptsv2paymentsTokenInformation tokenInfo = new Ptsv2paymentsTokenInformation();
            tokenInfo.transientTokenJwt(transientTokenJwt);
            paymentRequest.tokenInformation(tokenInfo);

            Ptsv2paymentsOrderInformation orderInfo = new Ptsv2paymentsOrderInformation();
            Ptsv2paymentsOrderInformationAmountDetails amountDetails = new Ptsv2paymentsOrderInformationAmountDetails();
            amountDetails.totalAmount(String.valueOf(amount));
            amountDetails.currency(currency);
            orderInfo.amountDetails(amountDetails);

            Ptsv2paymentsOrderInformationBillTo billTo = new Ptsv2paymentsOrderInformationBillTo();
            billTo.firstName("Demo");
            billTo.lastName("Customer");
            billTo.address1("123 Main Street");
            billTo.locality("Cape Town");
            billTo.administrativeArea("Western Cape");
            billTo.postalCode("8001");
            billTo.country("ZA");
            billTo.email("demo@cybershop.test");
            billTo.phoneNumber("27821234567");
            orderInfo.billTo(billTo);
            paymentRequest.orderInformation(orderInfo);

            PaymentsApi api = new PaymentsApi(apiClient);
            PtsV2PaymentsPost201Response result = api.createPayment(paymentRequest);

            log.info("Tokenized checkout payment — status: {}, id: {}", result.getStatus(), result.getId());

            return PaymentResponse.builder()
                    .status(result.getStatus())
                    .transactionId(result.getId())
                    .message("Tokenized checkout payment successful")
                    .httpStatus(Integer.parseInt(apiClient.responseCode))
                    .build();

        } catch (Invokers.ApiException e) {
            log.error("Tokenized checkout error: {}", e.getResponseBody(), e);
            throw new PaymentException("Tokenized checkout failed: " + e.getMessage(), e.getCode(), e.getResponseBody());
        } catch (Exception e) {
            throw new PaymentException("Tokenized checkout processing failed", e);
        }
    }

}
