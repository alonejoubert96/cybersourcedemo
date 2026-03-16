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
            // 1) instrument identifier — stores the PAN
            ApiClient apiClient = apiClientFactory.create();

            PostInstrumentIdentifierRequest iiRequest = new PostInstrumentIdentifierRequest();
            TmsEmbeddedInstrumentIdentifierCard iiCard = new TmsEmbeddedInstrumentIdentifierCard();
            iiCard.number(request.getCardNumber());
            iiRequest.card(iiCard);

            InstrumentIdentifierApi iiApi = new InstrumentIdentifierApi(apiClient);
            PostInstrumentIdentifierRequest iiResponse = iiApi.postInstrumentIdentifier(iiRequest, null, null);
            String instrumentIdentifierId = iiResponse.getId();

            // 2) customer record
            apiClient = apiClientFactory.create();

            PostCustomerRequest customerRequest = new PostCustomerRequest();
            Tmsv2tokenizeTokenInformationCustomerBuyerInformation buyerInfo =
                    new Tmsv2tokenizeTokenInformationCustomerBuyerInformation();
            buyerInfo.email(request.getEmail());
            customerRequest.buyerInformation(buyerInfo);

            CustomerApi customerApi = new CustomerApi(apiClient);
            PostCustomerRequest customerResponse = customerApi.postCustomer(customerRequest, null);
            String customerId = customerResponse.getId();

            // 3) link payment instrument to customer
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
            billTo.firstName(request.getFirstName());
            billTo.lastName(request.getLastName());
            billTo.address1("123 Main Street");
            billTo.locality("Cape Town");
            billTo.administrativeArea("Western Cape");
            billTo.postalCode("8001");
            billTo.country("ZA");
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
