package com.example.cybersourcedemo.controller.ui;

import com.example.cybersourcedemo.model.RequestData;
import com.example.cybersourcedemo.service.CaptureContextService;
import com.example.cybersourcedemo.service.JwtProcessorService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

@Controller
public class CheckoutUiController {

    private final CaptureContextService captureContextService;
    private final JwtProcessorService jwtProcessorService;
    private final ObjectMapper objectMapper;

    private RequestData requestData;
    private JsonNode payloadJson;

    @Autowired
    public CheckoutUiController(CaptureContextService captureContextService,
                                JwtProcessorService jwtProcessorService) {
        this.captureContextService = captureContextService;
        this.jwtProcessorService = jwtProcessorService;
        this.objectMapper = new ObjectMapper();
    }

    @PostConstruct
    public void initializeRequestData() {
        try {
            String payload = Files.readString(Path.of(
                    new ClassPathResource("request-payload.json").getURI()));
            String headersJson = Files.readString(Path.of(
                    new ClassPathResource("request-headers.json").getURI()));
            Map<String, String> headers = objectMapper.readValue(headersJson, Map.class);

            this.payloadJson = objectMapper.readTree(payload);
            this.requestData = new RequestData(payload, headers);
        } catch (Exception e) {
            System.err.println("Error loading request data: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @GetMapping("/")
    public String index() {
        return "index";
    }

    @GetMapping("/cart")
    public String cart() {
        return "cart";
    }

    /**
     * 3DS Step-Up callback — Cardinal POSTs here after challenge completion.
     * Renders a tiny page that posts a message to the parent window.
     */
    @PostMapping("/3ds/callback")
    public String threeDsCallback(@RequestParam(value = "TransactionId", required = false) String transactionId,
                                  @RequestParam(value = "MD", required = false) String md,
                                  Model model) {
        model.addAttribute("transactionId", transactionId != null ? transactionId : "");
        model.addAttribute("md", md != null ? md : "");
        return "3ds-callback";
    }

    @GetMapping("/checkout")
    public String checkout(@RequestParam(value = "amount", required = false) String amount,
                           Model model) {
        try {
            // Override the amount in the payload if provided from the cart
            RequestData requestToUse = this.requestData;
            String totalAmount = payloadJson.path("orderInformation")
                    .path("amountDetails")
                    .path("totalAmount")
                    .asText("0.01");

            if (amount != null && !amount.isBlank()) {
                totalAmount = amount;
                ObjectNode payloadCopy = (ObjectNode) objectMapper.readTree(requestData.getPayload());
                ((ObjectNode) payloadCopy.path("orderInformation").path("amountDetails"))
                        .put("totalAmount", amount);
                requestToUse = new RequestData(objectMapper.writeValueAsString(payloadCopy),
                        requestData.getHeaders());
            }

            // CyberSource round-trip: get capture context JWT
            String jwt = captureContextService.getCaptureContext(requestToUse);

            // Extract client library URL + integrity hash from JWT
            Map<String, String> jwtDetails = jwtProcessorService.processAndPrintJwt(jwt);

            // Populate view model
            model.addAttribute("jwt", jwt);
            model.addAttribute("clientLibrary", jwtDetails.get("clientLibrary"));
            model.addAttribute("clientLibraryIntegrity", jwtDetails.get("clientLibraryIntegrity"));
            model.addAttribute("totalAmount", totalAmount);

            return "checkout";

        } catch (Exception e) {
            e.printStackTrace();
            model.addAttribute("error", "Failed to get capture context: " + e.getMessage());
            return "checkout";
        }
    }
}
