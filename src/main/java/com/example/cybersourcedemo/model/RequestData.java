package com.example.cybersourcedemo.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public class RequestData {
    private String payload;
    private Map<String, String> headers;

    public RequestData() {
    }

    public RequestData(String payload, Map<String, String> headers) {
        this.payload = payload;
        this.headers = headers;
    }

    public String getPayload() {
        return payload;
    }

    public void setPayload(String payload) {
        this.payload = payload;
    }

    public Map<String, String> getHeaders() {
        return headers;
    }

    public void setHeaders(Map<String, String> headers) {
        this.headers = headers;
    }

    public HttpHeaders toHttpHeaders() {
        HttpHeaders httpHeaders = new HttpHeaders();
        if (headers != null) {
            headers.forEach((key, value) -> {
                if (key.equalsIgnoreCase("Content-Type")) {
                    httpHeaders.setContentType(MediaType.valueOf(value));
                } else {
                    httpHeaders.set(key, value);
                }
            });
        }
        return httpHeaders;
    }
}
