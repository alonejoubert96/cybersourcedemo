package com.example.cybersourcedemo.service;

import Api.InvoicesApi;
import Invokers.ApiClient;
import Model.*;
import com.example.cybersourcedemo.dto.InvoiceRequest;
import com.example.cybersourcedemo.dto.PaymentResponse;
import com.example.cybersourcedemo.exception.PaymentException;
import com.example.cybersourcedemo.sdk.ApiClientFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.joda.time.LocalDate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceService {

    private final ApiClientFactory apiClientFactory;

    public PaymentResponse createInvoice(InvoiceRequest request) {
        try {
            ApiClient apiClient = apiClientFactory.create();

            CreateInvoiceRequest invoiceRequest = new CreateInvoiceRequest();

            Invoicingv2invoicesCustomerInformation customerInfo = new Invoicingv2invoicesCustomerInformation();
            customerInfo.email(request.getCustomerEmail());
            if (request.getCustomerName() != null) {
                customerInfo.name(request.getCustomerName());
            }
            invoiceRequest.customerInformation(customerInfo);

            Invoicingv2invoicesInvoiceInformation invoiceInfo = new Invoicingv2invoicesInvoiceInformation();
            invoiceInfo.description(request.getDescription());
            if (request.getDueDate() != null) {
                invoiceInfo.dueDate(LocalDate.parse(request.getDueDate()));
            }
            invoiceRequest.invoiceInformation(invoiceInfo);

            Invoicingv2invoicesOrderInformation orderInfo = new Invoicingv2invoicesOrderInformation();
            Invoicingv2invoicesOrderInformationAmountDetails amountDetails = new Invoicingv2invoicesOrderInformationAmountDetails();
            amountDetails.totalAmount(String.valueOf(request.getAmount()));
            amountDetails.currency(request.getCurrency());
            orderInfo.amountDetails(amountDetails);

            Invoicingv2invoicesOrderInformationLineItems lineItem = new Invoicingv2invoicesOrderInformationLineItems();
            lineItem.productName(request.getDescription());
            lineItem.productSku("DEMO-001");
            lineItem.unitPrice(String.valueOf(request.getAmount()));
            lineItem.quantity(1);
            orderInfo.lineItems(List.of(lineItem));

            invoiceRequest.orderInformation(orderInfo);

            InvoicesApi api = new InvoicesApi(apiClient);
            InvoicingV2InvoicesPost201Response result = api.createInvoice(invoiceRequest);

            return PaymentResponse.builder()
                    .status(result.getStatus())
                    .transactionId(result.getId())
                    .message("Invoice created successfully")
                    .httpStatus(Integer.parseInt(apiClient.responseCode))
                    .details(Map.of("invoiceId", result.getId()))
                    .build();

        } catch (Invokers.ApiException e) {
            log.error("Invoice creation error: {}", e.getResponseBody(), e);
            throw new PaymentException("Invoice creation failed: " + e.getMessage(), e.getCode(), e.getResponseBody());
        } catch (Exception e) {
            throw new PaymentException("Invoice creation processing failed", e);
        }
    }

    public PaymentResponse sendInvoice(String invoiceId) {
        try {
            ApiClient apiClient = apiClientFactory.create();

            InvoicesApi api = new InvoicesApi(apiClient);
            InvoicingV2InvoicesSend200Response result = api.performSendAction(invoiceId);

            return PaymentResponse.builder()
                    .status(result.getStatus())
                    .transactionId(invoiceId)
                    .message("Invoice sent successfully")
                    .httpStatus(Integer.parseInt(apiClient.responseCode))
                    .build();

        } catch (Invokers.ApiException e) {
            log.error("Invoice send error: {}", e.getResponseBody(), e);
            throw new PaymentException("Invoice send failed: " + e.getMessage(), e.getCode(), e.getResponseBody());
        } catch (Exception e) {
            throw new PaymentException("Invoice send processing failed", e);
        }
    }

    public PaymentResponse getInvoice(String invoiceId) {
        try {
            ApiClient apiClient = apiClientFactory.create();

            InvoicesApi api = new InvoicesApi(apiClient);
            InvoicingV2InvoicesGet200Response result = api.getInvoice(invoiceId);

            return PaymentResponse.builder()
                    .status(result.getStatus())
                    .transactionId(invoiceId)
                    .message("Invoice retrieved")
                    .httpStatus(Integer.parseInt(apiClient.responseCode))
                    .details(Map.of("invoiceId", invoiceId))
                    .build();

        } catch (Invokers.ApiException e) {
            log.error("Invoice retrieval error: {}", e.getResponseBody(), e);
            throw new PaymentException("Invoice retrieval failed: " + e.getMessage(), e.getCode(), e.getResponseBody());
        } catch (Exception e) {
            throw new PaymentException("Invoice retrieval processing failed", e);
        }
    }
}
