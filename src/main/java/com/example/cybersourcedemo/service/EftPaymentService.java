package com.example.cybersourcedemo.service;

import Api.PaymentsApi;
import Invokers.ApiClient;
import Model.*;
import com.example.cybersourcedemo.dto.EftPaymentRequest;
import com.example.cybersourcedemo.dto.PaymentResponse;
import com.example.cybersourcedemo.exception.PaymentException;
import com.example.cybersourcedemo.sdk.ApiClientFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EftPaymentService {

    private final ApiClientFactory apiClientFactory;

    public PaymentResponse pay(EftPaymentRequest request) {
        try {
            ApiClient apiClient = apiClientFactory.create();

            CreatePaymentRequest paymentRequest = new CreatePaymentRequest();

            Ptsv2paymentsClientReferenceInformation clientRef = new Ptsv2paymentsClientReferenceInformation();
            clientRef.code("eft-" + UUID.randomUUID().toString().substring(0, 8));
            paymentRequest.clientReferenceInformation(clientRef);

            Ptsv2paymentsPaymentInformation paymentInfo = new Ptsv2paymentsPaymentInformation();
            Ptsv2paymentsPaymentInformationBank bank = new Ptsv2paymentsPaymentInformationBank();
            Ptsv2paymentsPaymentInformationBankAccount bankAccount = new Ptsv2paymentsPaymentInformationBankAccount();
            bankAccount.number(request.getAccountNumber());
            bankAccount.type(request.getAccountType());
            bank.account(bankAccount);
            bank.routingNumber(request.getRoutingNumber());
            paymentInfo.bank(bank);

            Ptsv2paymentsPaymentInformationPaymentType paymentType = new Ptsv2paymentsPaymentInformationPaymentType();
            paymentType.name("CHECK");
            paymentInfo.paymentType(paymentType);
            paymentRequest.paymentInformation(paymentInfo);

            Ptsv2paymentsOrderInformation orderInfo = new Ptsv2paymentsOrderInformation();
            Ptsv2paymentsOrderInformationAmountDetails amountDetails = new Ptsv2paymentsOrderInformationAmountDetails();
            amountDetails.totalAmount(String.valueOf(request.getAmount()));
            amountDetails.currency(request.getCurrency());
            orderInfo.amountDetails(amountDetails);

            Ptsv2paymentsOrderInformationBillTo billTo = new Ptsv2paymentsOrderInformationBillTo();
            billTo.firstName(request.getFirstName());
            billTo.lastName(request.getLastName());
            billTo.email(request.getEmail());
            billTo.address1("123 Main Street");
            billTo.locality("Cape Town");
            billTo.administrativeArea("Western Cape");
            billTo.postalCode("8001");
            billTo.country("ZA");
            orderInfo.billTo(billTo);
            paymentRequest.orderInformation(orderInfo);

            PaymentsApi api = new PaymentsApi(apiClient);
            PtsV2PaymentsPost201Response result = api.createPayment(paymentRequest);

            return PaymentResponse.builder()
                    .status(result.getStatus())
                    .transactionId(result.getId())
                    .message("EFT/eCheck payment successful")
                    .httpStatus(Integer.parseInt(apiClient.responseCode))
                    .build();

        } catch (Invokers.ApiException e) {
            log.error("EFT payment error: {}", e.getResponseBody(), e);
            throw new PaymentException("EFT payment failed: " + e.getMessage(), e.getCode(), e.getResponseBody());
        } catch (Exception e) {
            throw new PaymentException("EFT payment processing failed", e);
        }
    }
}
