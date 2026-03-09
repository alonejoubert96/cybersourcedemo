package com.example.cybersourcedemo.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.Properties;

@Configuration
@ConfigurationProperties(prefix = "cybersource")
@Getter
@Setter
public class CybersourceConfig {

    private String merchantId;
    private String runEnvironment;
    private String authenticationType;
    private String merchantKeyId;
    private String merchantSecretKey;

    public Properties toSdkProperties() {
        Properties props = new Properties();
        props.setProperty("authenticationType", authenticationType);
        props.setProperty("merchantID", merchantId);
        props.setProperty("runEnvironment", runEnvironment);
        props.setProperty("merchantKeyId", merchantKeyId);
        props.setProperty("merchantsecretKey", merchantSecretKey);
        return props;
    }
}
