package com.cloudian.backend.modules.auth;

import java.math.BigInteger;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cloudian.backend.modules.auth.dto.JwkSetResponse;
import com.cloudian.backend.modules.auth.dto.JwkSetResponse.JsonWebKey;
import com.cloudian.backend.security.AccessTokenKeyProvider;

import io.swagger.v3.oas.annotations.security.SecurityRequirements;

@SecurityRequirements
@RestController
@RequestMapping("/.well-known")
public class JwksController {

    private final AccessTokenKeyProvider accessTokenKeys;

    public JwksController(AccessTokenKeyProvider accessTokenKeys) {
        this.accessTokenKeys = accessTokenKeys;
    }

    @GetMapping("/jwks.json")
    public JwkSetResponse getKeys() {
        JsonWebKey accessKey = new JsonWebKey(
                "RSA",
                "sig",
                "RS256",
                accessTokenKeys.keyId(),
                encodeUnsigned(accessTokenKeys.publicKey().getModulus()),
                encodeUnsigned(accessTokenKeys.publicKey().getPublicExponent()));

        return new JwkSetResponse(List.of(accessKey));
    }

    private static String encodeUnsigned(BigInteger value) {
        byte[] bytes = value.toByteArray();
        if (bytes.length > 1 && bytes[0] == 0) {
            bytes = Arrays.copyOfRange(bytes, 1, bytes.length);
        }
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
