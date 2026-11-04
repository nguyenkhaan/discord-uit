package com.cloudian.backend.modules.auth.dto;

import java.util.List;

public record JwkSetResponse(List<JsonWebKey> keys) {

    public JwkSetResponse {
        keys = List.copyOf(keys);
    }

    public record JsonWebKey(
            String kty,
            String use,
            String alg,
            String kid,
            String n,
            String e) {
    }
}
