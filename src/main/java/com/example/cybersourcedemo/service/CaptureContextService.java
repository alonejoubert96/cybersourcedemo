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
     * Calls the CyberSource API to get a capture context using the provided request data
     * @param requestData The request data containing payload and headers
     * @return The JWT token from the API response
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
            String status = apiClient.status;

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
}
