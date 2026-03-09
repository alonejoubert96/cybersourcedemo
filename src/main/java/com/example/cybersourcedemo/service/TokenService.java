package com.example.cybersourcedemo.service;

import Api.CustomerApi;
import Api.CustomerPaymentInstrumentApi;
import Api.InstrumentIdentifierApi;
import Invokers.ApiClient;
import Model.*;
import com.example.cybersourcedemo.dto.PaymentResponse;
import com.example.cybersourcedemo.dto.TokenRequest;
import com.example.cybersourcedemo.exception.PaymentException;
import com.example.cybersourcedemo.sdk.ApiClientFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TokenService {

    private final ApiClientFactory apiClientFactory;

    public PaymentResponse storeCustomerCard(TokenRequest request) {
        try {
            // Step 1: Create instrument identifier (stores the card number)
            ApiClient apiClient = apiClientFactory.create();

            PostInstrumentIdentifierRequest iiRequest = new PostInstrumentIdentifierRequest();
            TmsEmbeddedInstrumentIdentifierCard iiCard = new TmsEmbeddedInstrumentIdentifierCard();
            iiCard.number(request.getCardNumber());
            iiRequest.card(iiCard);

            InstrumentIdentifierApi iiApi = new InstrumentIdentifierApi(apiClient);
            PostInstrumentIdentifierRequest iiResponse = iiApi.postInstrumentIdentifier(iiRequest, null, null);
            String instrumentIdentifierId = iiResponse.getId();

            // Step 2: Create customer
            apiClient = apiClientFactory.create();

            PostCustomerRequest customerRequest = new PostCustomerRequest();
            Tmsv2tokenizeTokenInformationCustomerBuyerInformation buyerInfo =
                    new Tmsv2tokenizeTokenInformationCustomerBuyerInformation();
            buyerInfo.email(request.getEmail() != null ? request.getEmail() : "test@example.com");
            customerRequest.buyerInformation(buyerInfo);

            CustomerApi customerApi = new CustomerApi(apiClient);
            PostCustomerRequest customerResponse = customerApi.postCustomer(customerRequest, null);
            String customerId = customerResponse.getId();

            // Step 3: Add payment instrument to customer with instrument identifier
            apiClient = apiClientFactory.create();

            PostCustomerPaymentInstrumentRequest instrumentRequest = new PostCustomerPaymentInstrumentRequest();

            Tmsv2tokenizeTokenInformationCustomerEmbeddedDefaultPaymentInstrumentCard card =
                    new Tmsv2tokenizeTokenInformationCustomerEmbeddedDefaultPaymentInstrumentCard();
            card.expirationMonth(request.getExpirationMonth());
            card.expirationYear(request.getExpirationYear());
            instrumentRequest.card(card);

            Tmsv2tokenizeTokenInformationCustomerEmbeddedDefaultPaymentInstrumentInstrumentIdentifier ii =
                    new Tmsv2tokenizeTokenInformationCustomerEmbeddedDefaultPaymentInstrumentInstrumentIdentifier();
            ii.id(instrumentIdentifierId);
            instrumentRequest.instrumentIdentifier(ii);

            Tmsv2tokenizeTokenInformationCustomerEmbeddedDefaultPaymentInstrumentBillTo billTo =
                    new Tmsv2tokenizeTokenInformationCustomerEmbeddedDefaultPaymentInstrumentBillTo();
            billTo.firstName(request.getFirstName() != null ? request.getFirstName() : "John");
            billTo.lastName(request.getLastName() != null ? request.getLastName() : "Doe");
            billTo.address1("1 Market St");
            billTo.locality("San Francisco");
            billTo.administrativeArea("CA");
            billTo.postalCode("94105");
            billTo.country("US");
            instrumentRequest.billTo(billTo);

            CustomerPaymentInstrumentApi instrumentApi = new CustomerPaymentInstrumentApi(apiClient);
            PostCustomerPaymentInstrumentRequest instrumentResponse =
                    instrumentApi.postCustomerPaymentInstrument(customerId, instrumentRequest, null);

            return PaymentResponse.builder()
                    .status("CREATED")
                    .transactionId(customerId)
                    .message("Customer and payment instrument stored successfully")
                    .httpStatus(201)
                    .details(Map.of(
                            "customerId", customerId,
                            "paymentInstrumentId", instrumentResponse.getId()
                    ))
                    .build();

        } catch (Invokers.ApiException e) {
            log.error("Token storage error: {}", e.getResponseBody(), e);
            throw new PaymentException("Token storage failed: " + e.getMessage(), e.getCode(), e.getResponseBody());
        } catch (Exception e) {
            throw new PaymentException("Token storage processing failed", e);
        }
    }
}
