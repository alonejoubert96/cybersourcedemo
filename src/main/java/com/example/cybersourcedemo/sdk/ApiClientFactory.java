package com.example.cybersourcedemo.sdk;

import com.example.cybersourcedemo.config.CybersourceConfig;
import Invokers.ApiClient;
import com.cybersource.authsdk.core.MerchantConfig;
import com.google.gson.Gson;
import com.google.gson.TypeAdapter;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonToken;
import com.google.gson.stream.JsonWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class ApiClientFactory {

    private final CybersourceConfig config;

    /**
     * Creates a new ApiClient per request — the SDK ApiClient is mutable and not thread-safe.
     */
    public ApiClient create() throws Exception {
        ApiClient apiClient = new ApiClient();
        MerchantConfig merchantConfig = new MerchantConfig(config.toSdkProperties());
        apiClient.merchantConfig = merchantConfig;
        installLenientIntegerAdapter(apiClient);
        return apiClient;
    }

    /**
     * Works around CyberSource SDK bug where some response fields (e.g. definitionId)
     * are declared as Integer but the API returns values exceeding Integer.MAX_VALUE.
     */
    private void installLenientIntegerAdapter(ApiClient apiClient) {
        try {
            Gson original = apiClient.getJSON().getGson();
            Gson patched = original.newBuilder()
                    .registerTypeAdapter(Integer.class, new TypeAdapter<Integer>() {
                        @Override
                        public void write(JsonWriter out, Integer value) throws IOException {
                            if (value == null) {
                                out.nullValue();
                            } else {
                                out.value(value);
                            }
                        }

                        @Override
                        public Integer read(JsonReader in) throws IOException {
                            if (in.peek() == JsonToken.NULL) {
                                in.nextNull();
                                return null;
                            }
                            try {
                                long value = in.nextLong();
                                if (value > Integer.MAX_VALUE || value < Integer.MIN_VALUE) {
                                    return 0;
                                }
                                return (int) value;
                            } catch (NumberFormatException e) {
                                return 0;
                            }
                        }
                    })
                    .create();
            apiClient.getJSON().setGson(patched);
        } catch (Exception e) {
            log.warn("Could not install lenient Integer adapter on ApiClient Gson", e);
        }
    }
}
