package com.example.cybersourcedemo.service;

import Api.MicroformIntegrationApi;
import Invokers.ApiClient;
import Model.GenerateCaptureContextRequest;
import com.example.cybersourcedemo.sdk.ApiClientFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class FlexMicroformService {

    private final ApiClientFactory apiClientFactory;

    /**
     * Generates a Flex Microform capture context JWT.
     * This is different from the UC capture context — it returns a JWT with type "mf-*"
     * that the Flex Microform v2 JavaScript library can consume.
     */
    public String generateCaptureContext(String targetOrigin) {
        try {
            ApiClient apiClient = apiClientFactory.create();

            GenerateCaptureContextRequest request = new GenerateCaptureContextRequest();
            request.targetOrigins(List.of(targetOrigin));
            request.allowedCardNetworks(List.of("VISA", "MASTERCARD", "AMEX", "DISCOVER"));
            request.allowedPaymentTypes(List.of("PANENTRY"));
            request.clientVersion("v2.0");

            MicroformIntegrationApi api = new MicroformIntegrationApi(apiClient);
            String jwt = api.generateCaptureContext(request);

            log.info("Flex Microform capture context generated");
            return jwt;

        } catch (Exception e) {
            log.error("Failed to generate Flex capture context", e);
            throw new RuntimeException("Failed to generate Flex capture context: " + e.getMessage(), e);
        }
    }
}
