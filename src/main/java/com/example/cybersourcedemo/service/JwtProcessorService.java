package com.example.cybersourcedemo.service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.example.cybersourcedemo.model.JWK;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigInteger;
import java.security.KeyFactory;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.RSAPublicKeySpec;
import java.util.*;

@Service
public class JwtProcessorService {

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(JwtProcessorService.class);

    private final String requestHost;

    public JwtProcessorService(@Value("${app.request-host:apitest.cybersource.com}") String requestHost) {
        this.requestHost = requestHost;
    }

    /**
     * Verifies and decodes the JWT returned by Unified Checkout.
     *
     * @param jwt The JWT string from the client.
     * @return The decoded JWT body as a String.
     * @throws Exception if verification or decoding fails.
     */
    public String verifyJwtAndGetDecodedBody(final String jwt) throws Exception {
        // 1) Extract the "kid" from the JWT header
        final String[] jwtChunks = jwt.split("\\.");
        final Base64.Decoder decoder = Base64.getUrlDecoder();
        final String header = new String(decoder.decode(jwtChunks[0]));
        final String body = new String(decoder.decode(jwtChunks[1]));

        // 2) Retrieve the public key from CyberSource, based on 'kid'
        final JWK publicKeyJWK = getPublicKeyFromHeader(header);

        // 3) Construct an RSA Key out of the response we got from the /public-keys endpoint
        final BigInteger modulus = new BigInteger(1, decoder.decode(publicKeyJWK.getN()));
        final BigInteger exponent = new BigInteger(1, decoder.decode(publicKeyJWK.getE()));
        final RSAPublicKey rsaPublicKey = (RSAPublicKey) KeyFactory.getInstance("RSA").generatePublic(new RSAPublicKeySpec(modulus, exponent));

        // 4) Verify the JWT's signature using the public key
        final Algorithm algorithm = Algorithm.RSA256(rsaPublicKey, null);
        final JWTVerifier verifier = JWT.require(algorithm).acceptLeeway(20).build();
        verifier.verify(jwt); // This throws an exception if the signature is invalid

        return body;
    }

    /**
     * Retrieves the public key from the JWT header.
     *
     * @param jwtHeader The JWT header.
     * @return The JWK containing the public key.
     * @throws Exception if retrieval or parsing fails.
     */
    private JWK getPublicKeyFromHeader(final String jwtHeader) throws Exception {
        // Extract the 'kid' from the header
        final String keyId = new ObjectMapper().readTree(jwtHeader).get("kid").textValue();

        // Fetch the JWK from the /public-keys endpoint
        final ResponseEntity<String> response = new RestTemplate().getForEntity(
                "https://" + requestHost + "/flex/v2/public-keys/" + keyId,
                String.class);
        return new ObjectMapper().readValue(response.getBody(), JWK.class);
    }

    /**
     * Process and print the JWT claims.
     *
     * @param jwt The JWT string from the client.
     */
    public Map<String, String> processAndPrintJwt(String jwt) {
        Map<String, String> jwtDetails = new HashMap<>();
        try {
            String decodedBody = verifyJwtAndGetDecodedBody(jwt);
            logger.debug("Decoded JWT Body: {}", decodedBody);

            Map<String, Object> decodedJwt = new ObjectMapper().readValue(decodedBody, HashMap.class);
            logger.debug("Decoded JWT Map: {}", decodedJwt);

            // Extract the ctx array from the decoded JWT
            if (decodedJwt.containsKey("ctx")) {
                List<Map<String, Object>> ctxArray = (List<Map<String, Object>>) decodedJwt.get("ctx");
                if (!ctxArray.isEmpty()) {
                    Map<String, Object> ctx = ctxArray.get(0);
                    Map<String, Object> data = (Map<String, Object>) ctx.get("data");

                    // Extract clientLibrary and clientLibraryIntegrity
                    String clientLibrary = (String) data.get("clientLibrary");
                    String clientLibraryIntegrity = (String) data.get("clientLibraryIntegrity");

                    jwtDetails.put("clientLibrary", clientLibrary);
                    jwtDetails.put("clientLibraryIntegrity", clientLibraryIntegrity);
                }
            }

        } catch (Exception e) {
            logger.error("Error processing JWT", e);
        }
        return jwtDetails;
    }
}
