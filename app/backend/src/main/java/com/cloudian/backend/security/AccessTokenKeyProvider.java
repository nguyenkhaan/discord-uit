package com.cloudian.backend.security;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

@Component
public class AccessTokenKeyProvider {

    private static final String PRIVATE_KEY_BEGIN =
            "-----BEGIN PRIVATE KEY-----";

    private static final String PRIVATE_KEY_END =
            "-----END PRIVATE KEY-----";

    private static final String PUBLIC_KEY_BEGIN =
            "-----BEGIN PUBLIC KEY-----";

    private static final String PUBLIC_KEY_END =
            "-----END PUBLIC KEY-----";

    private static final int MINIMUM_RSA_KEY_SIZE = 2048;

    private final RSAPrivateKey privateKey;
    private final RSAPublicKey publicKey;
    private final String keyId;

    public AccessTokenKeyProvider(
            @Value("${app.jwt.access-private-key}")
            Resource privateKeyResource,
            @Value("${app.jwt.access-public-key}")
            Resource publicKeyResource,
            @Value("${app.jwt.access-key-id}")
            String keyId) {

        if (keyId == null || keyId.isBlank()) {
            throw new IllegalStateException(
                    "The access-token key ID must be configured.");
        }

        this.privateKey = readPrivateKey(
                privateKeyResource);

        this.publicKey = readPublicKey(
                publicKeyResource);

        this.keyId = keyId;

        validateKeyPair();
    }

    public RSAPrivateKey privateKey() {
        return privateKey;
    }

    public RSAPublicKey publicKey() {
        return publicKey;
    }

    public String keyId() {
        return keyId;
    }

    private void validateKeyPair() {
        if (!privateKey.getModulus()
                .equals(publicKey.getModulus())) {

            throw new IllegalStateException(
                    "The configured RSA private and public keys "
                            + "do not form a matching key pair.");
        }

        if (publicKey.getModulus().bitLength()
                < MINIMUM_RSA_KEY_SIZE) {

            throw new IllegalStateException(
                    "The access-token RSA key must contain "
                            + "at least 2048 bits.");
        }
    }

    private static RSAPrivateKey readPrivateKey(
            Resource resource) {

        try {
            String pem = readResource(resource);

            byte[] encodedKey = decodePem(
                    pem,
                    PRIVATE_KEY_BEGIN,
                    PRIVATE_KEY_END);

            KeyFactory keyFactory =
                    KeyFactory.getInstance("RSA");

            return (RSAPrivateKey)
                    keyFactory.generatePrivate(
                            new PKCS8EncodedKeySpec(
                                    encodedKey));
        } catch (
                IOException
                | GeneralSecurityException
                | IllegalArgumentException exception) {

            throw new IllegalStateException(
                    "Could not load the access-token private key.",
                    exception);
        }
    }

    private static RSAPublicKey readPublicKey(
            Resource resource) {

        try {
            String pem = readResource(resource);

            byte[] encodedKey = decodePem(
                    pem,
                    PUBLIC_KEY_BEGIN,
                    PUBLIC_KEY_END);

            KeyFactory keyFactory =
                    KeyFactory.getInstance("RSA");

            return (RSAPublicKey)
                    keyFactory.generatePublic(
                            new X509EncodedKeySpec(
                                    encodedKey));
        } catch (
                IOException
                | GeneralSecurityException
                | IllegalArgumentException exception) {

            throw new IllegalStateException(
                    "Could not load the access-token public key.",
                    exception);
        }
    }

    private static String readResource(
            Resource resource) throws IOException {

        try (InputStream inputStream =
                     resource.getInputStream()) {

            return new String(
                    inputStream.readAllBytes(),
                    StandardCharsets.UTF_8);
        }
    }

    private static byte[] decodePem(
            String pem,
            String beginMarker,
            String endMarker) {

        if (!pem.contains(beginMarker)
                || !pem.contains(endMarker)) {

            throw new IllegalArgumentException(
                    "The configured PEM key has an unexpected format.");
        }

        String base64Content = pem
                .replace(beginMarker, "")
                .replace(endMarker, "")
                .replaceAll("\\s", "");

        if (base64Content.isBlank()) {
            throw new IllegalArgumentException(
                    "The configured PEM key contains no key data.");
        }

        return Base64.getDecoder()
                .decode(base64Content);
    }
}