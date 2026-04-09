package com.example.cybersourcedemo.service;

import Api.CustomerApi;
import Api.CustomerPaymentInstrumentApi;
import Api.InstrumentIdentifierApi;
import Invokers.ApiClient;
import Model.*;
import com.example.cybersourcedemo.dto.PaymentResponse;
import com.example.cybersourcedemo.dto.SavedCardResponse;
import com.example.cybersourcedemo.dto.TokenRequest;
import com.example.cybersourcedemo.exception.PaymentException;
import com.example.cybersourcedemo.sdk.ApiClientFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TokenService {

    private final ApiClientFactory apiClientFactory;
    private final PayerAuthService payerAuthService;

    public PaymentResponse storeCustomerCard(TokenRequest request) {
        try {
            ApiClient apiClient = apiClientFactory.create();

            PostInstrumentIdentifierRequest iiRequest = new PostInstrumentIdentifierRequest();
            TmsEmbeddedInstrumentIdentifierCard iiCard = new TmsEmbeddedInstrumentIdentifierCard();
            iiCard.number(request.getCardNumber());
            iiRequest.card(iiCard);

            InstrumentIdentifierApi iiApi = new InstrumentIdentifierApi(apiClient);
            PostInstrumentIdentifierRequest iiResponse = iiApi.postInstrumentIdentifier(iiRequest, null, null);
            String instrumentIdentifierId = iiResponse.getId();

            apiClient = apiClientFactory.create();

            PostCustomerRequest customerRequest = new PostCustomerRequest();
            Tmsv2tokenizeTokenInformationCustomerBuyerInformation buyerInfo =
                    new Tmsv2tokenizeTokenInformationCustomerBuyerInformation();
            buyerInfo.email(request.getEmail());
            customerRequest.buyerInformation(buyerInfo);

            CustomerApi customerApi = new CustomerApi(apiClient);
            PostCustomerRequest customerResponse = customerApi.postCustomer(customerRequest, null);
            String customerId = customerResponse.getId();

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

    public List<SavedCardResponse> listCustomerCards(String customerId) {
        try {
            ApiClient apiClient = apiClientFactory.create();
            CustomerPaymentInstrumentApi instrumentApi = new CustomerPaymentInstrumentApi(apiClient);
            PaymentInstrumentList list = instrumentApi.getCustomerPaymentInstrumentsList(customerId, null, null, null);

            if (list.getEmbedded() == null || list.getEmbedded().getPaymentInstruments() == null) {
                return Collections.emptyList();
            }

            List<SavedCardResponse> cards = new ArrayList<>();
            for (var pi : list.getEmbedded().getPaymentInstruments()) {
                SavedCardResponse.SavedCardResponseBuilder builder = SavedCardResponse.builder()
                        .paymentInstrumentId(pi.getId());

                if (pi.getCard() != null) {
                    builder.cardType(pi.getCard().getType())
                           .expirationMonth(pi.getCard().getExpirationMonth())
                           .expirationYear(pi.getCard().getExpirationYear());
                }

                // Card number (masked by CyberSource — only last 4 visible)
                if (pi.getEmbedded() != null
                        && pi.getEmbedded().getInstrumentIdentifier() != null
                        && pi.getEmbedded().getInstrumentIdentifier().getCard() != null) {
                    String number = pi.getEmbedded().getInstrumentIdentifier().getCard().getNumber();
                    if (number != null && number.length() >= 4) {
                        builder.cardSuffix(number.substring(number.length() - 4));
                    }
                }

                if (pi.getBillTo() != null) {
                    builder.firstName(pi.getBillTo().getFirstName())
                           .lastName(pi.getBillTo().getLastName());
                }

                cards.add(builder.build());
            }
            return cards;

        } catch (Invokers.ApiException e) {
            log.error("List cards error: {}", e.getResponseBody(), e);
            throw new PaymentException("Failed to list cards: " + e.getMessage(), e.getCode(), e.getResponseBody());
        } catch (Exception e) {
            throw new PaymentException("Failed to list cards", e);
        }
    }

    public String seedTestCards() {
        try {
            // Create customer
            ApiClient apiClient = apiClientFactory.create();
            PostCustomerRequest customerRequest = new PostCustomerRequest();
            Tmsv2tokenizeTokenInformationCustomerBuyerInformation buyerInfo =
                    new Tmsv2tokenizeTokenInformationCustomerBuyerInformation();
            buyerInfo.email("demo@cybershop.test");
            customerRequest.buyerInformation(buyerInfo);
            CustomerApi customerApi = new CustomerApi(apiClient);
            PostCustomerRequest customerResponse = customerApi.postCustomer(customerRequest, null);
            String customerId = customerResponse.getId();

            String[][] testCards = {
                    {"4000000000001005", "12", "2028", "001", "John", "Doe"},       // Visa — 3DS frictionless
                    {"5200000000001005", "06", "2027", "002", "Jane", "Smith"},      // Mastercard — 3DS frictionless
                    {"4000000000001091", "03", "2029", "001", "Alex", "Johnson"},    // Visa — 3DS challenge
                    {"5200000000001096", "09", "2028", "002", "Sam", "Williams"},    // Mastercard — 3DS challenge
            };

            for (String[] tc : testCards) {
                apiClient = apiClientFactory.create();
                PostInstrumentIdentifierRequest iiRequest = new PostInstrumentIdentifierRequest();
                TmsEmbeddedInstrumentIdentifierCard iiCard = new TmsEmbeddedInstrumentIdentifierCard();
                iiCard.number(tc[0]);
                iiRequest.card(iiCard);
                InstrumentIdentifierApi iiApi = new InstrumentIdentifierApi(apiClient);
                PostInstrumentIdentifierRequest iiResponse = iiApi.postInstrumentIdentifier(iiRequest, null, null);

                apiClient = apiClientFactory.create();
                PostCustomerPaymentInstrumentRequest piReq = new PostCustomerPaymentInstrumentRequest();

                Tmsv2tokenizeTokenInformationCustomerEmbeddedDefaultPaymentInstrumentCard card =
                        new Tmsv2tokenizeTokenInformationCustomerEmbeddedDefaultPaymentInstrumentCard();
                card.expirationMonth(tc[1]);
                card.expirationYear(tc[2]);
                card.type(tc[3]);
                piReq.card(card);

                Tmsv2tokenizeTokenInformationCustomerEmbeddedDefaultPaymentInstrumentInstrumentIdentifier ii =
                        new Tmsv2tokenizeTokenInformationCustomerEmbeddedDefaultPaymentInstrumentInstrumentIdentifier();
                ii.id(iiResponse.getId());
                piReq.instrumentIdentifier(ii);

                Tmsv2tokenizeTokenInformationCustomerEmbeddedDefaultPaymentInstrumentBillTo billTo =
                        new Tmsv2tokenizeTokenInformationCustomerEmbeddedDefaultPaymentInstrumentBillTo();
                billTo.firstName(tc[4]);
                billTo.lastName(tc[5]);
                billTo.address1("123 Main Street");
                billTo.locality("Cape Town");
                billTo.administrativeArea("Western Cape");
                billTo.postalCode("8001");
                billTo.country("ZA");
                piReq.billTo(billTo);

                CustomerPaymentInstrumentApi piApi = new CustomerPaymentInstrumentApi(apiClient);
                piApi.postCustomerPaymentInstrument(customerId, piReq, null);
            }

            // Register cards with PayerAuthService for 3DS lookups
            for (String[] tc : testCards) {
                String suffix = tc[0].substring(tc[0].length() - 4);
                payerAuthService.registerCard(suffix, tc[0], tc[3], tc[1], tc[2]);
            }

            log.info("Seeded {} test cards for customer {}", testCards.length, customerId);
            return customerId;

        } catch (Invokers.ApiException e) {
            log.error("Seed test cards error: {}", e.getResponseBody(), e);
            throw new PaymentException("Failed to seed test cards: " + e.getMessage(), e.getCode(), e.getResponseBody());
        } catch (Exception e) {
            throw new PaymentException("Failed to seed test cards", e);
        }
    }

    public void deleteCustomerCard(String customerId, String paymentInstrumentId) {
        try {
            ApiClient apiClient = apiClientFactory.create();
            CustomerPaymentInstrumentApi instrumentApi = new CustomerPaymentInstrumentApi(apiClient);
            instrumentApi.deleteCustomerPaymentInstrument(customerId, paymentInstrumentId, null);
        } catch (Invokers.ApiException e) {
            log.error("Delete card error: {}", e.getResponseBody(), e);
            throw new PaymentException("Failed to delete card: " + e.getMessage(), e.getCode(), e.getResponseBody());
        } catch (Exception e) {
            throw new PaymentException("Failed to delete card", e);
        }
    }
}
