package com.example.cybersourcedemo.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import com.example.cybersourcedemo.model.RequestData;

import java.util.*;

import com.cybersource.authsdk.core.MerchantConfig;
import Api.*;
import Model.*;
import Invokers.*;

@Service
public class CaptureContextService {

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(CaptureContextService.class);

    private Properties merchantProperties;

    public CaptureContextService(
            @Value("${app.request-host:apitest.cybersource.com}") String requestHost,
            @Value("${app.merchant-id:alone_tmid001}") String merchantId,
            @Value("${app.merchant-key-id:6c56f759-9bdd-443e-8361-a4bc3f5701ce}") String merchantKeyId,
            @Value("${app.merchant-secret-key:iln9YDngM+HrD9UKguV/PmDckrcbaOzdCh96dVVJCe4=}") String merchantSecretKey) {

        this.merchantProperties = new Properties();
        this.merchantProperties.setProperty("authenticationType", "http_signature");
        this.merchantProperties.setProperty("runEnvironment", requestHost);
        this.merchantProperties.setProperty("merchantID", merchantId);
        this.merchantProperties.setProperty("merchantKeyId", merchantKeyId);
        this.merchantProperties.setProperty("merchantsecretKey", merchantSecretKey);
    }

    /**
     * Calls the CyberSource v0 API to get a capture context (used by Flex Microform).
     */
    public String getCaptureContext(RequestData requestData) {
        try {
            String jsonPayload = requestData.getPayload();

            MerchantConfig merchantConfig = new MerchantConfig(this.merchantProperties);

            ApiClient apiClient = new ApiClient();
            apiClient.merchantConfig = merchantConfig;

            JSON deserializer = new JSON(apiClient);

            GenerateUnifiedCheckoutCaptureContextRequest requestObj = deserializer.deserialize(jsonPayload, GenerateUnifiedCheckoutCaptureContextRequest.class);

            UnifiedCheckoutCaptureContextApi apiInstance = new UnifiedCheckoutCaptureContextApi(apiClient);
            String response = apiInstance.generateUnifiedCheckoutCaptureContext(requestObj);

            String responseCode = apiClient.responseCode;

            if (responseCode.equals("200") || responseCode.equals("201")) {
                return response;
            } else {
                logger.error("Error: {} - {}", responseCode, response);
                throw new RuntimeException("Error calling Cybersource API: " + responseCode);
            }

        } catch (Exception e) {
            logger.error("Failed to get capture context", e);
            throw new RuntimeException("Failed to get capture context", e);
        }
    }

    /**
     * Calls the CyberSource v1 Sessions API for Unified Checkout v1.
     * Uses /up/v1/sessions endpoint with clientVersion 1.0.
     */
    public String getCaptureContextV1(List<String> allowedPaymentTypes, String amount, String currency, String customerId) {
        try {
            MerchantConfig merchantConfig = new MerchantConfig(this.merchantProperties);

            ApiClient apiClient = new ApiClient();
            apiClient.merchantConfig = merchantConfig;

            GenerateUnifiedCheckoutV1CaptureContextRequest request = new GenerateUnifiedCheckoutV1CaptureContextRequest();
            request.targetOrigins(List.of("https://localhost:8080"));
            request.country("ZA");
            request.locale("en_US");

            Ucv1sessionsCaptureMandate captureMandate = new Ucv1sessionsCaptureMandate();
            captureMandate.requestShipping(false);
            request.captureMandate(captureMandate);

            Ucv1sessionsData data = new Ucv1sessionsData();
            Ucv1sessionsDataOrderInformation orderInfo = new Ucv1sessionsDataOrderInformation();
            Ucv1sessionsDataOrderInformationAmountDetails amountDetails = new Ucv1sessionsDataOrderInformationAmountDetails();
            String formattedAmount = amount.contains(".") ? amount : amount + ".00";
            if (formattedAmount.matches(".*\\.\\d$")) formattedAmount += "0";
            amountDetails.totalAmount(formattedAmount);
            amountDetails.currency(currency);
            orderInfo.amountDetails(amountDetails);
            data.orderInformation(orderInfo);
            request.data(data);

            UnifiedCheckoutV1CaptureContextApi apiInstance = new UnifiedCheckoutV1CaptureContextApi(apiClient);
            String response = apiInstance.generateUnifiedCheckoutV1CaptureContext(request);

            String responseCode = apiClient.responseCode;

            if (responseCode.equals("200") || responseCode.equals("201")) {
                return response;
            } else {
                logger.error("UC v1 error: {} - {}", responseCode, response);
                throw new RuntimeException("Error calling UC v1 Sessions API: " + responseCode);
            }

        } catch (Invokers.ApiException e) {
            logger.error("UC v1 API error [{}]: {}", e.getCode(), e.getResponseBody());
            throw new RuntimeException("UC v1 API error: " + e.getResponseBody(), e);
        } catch (Exception e) {
            logger.error("Failed to get UC v1 capture context", e);
            throw new RuntimeException("Failed to get UC v1 capture context", e);
        }
    }
}
