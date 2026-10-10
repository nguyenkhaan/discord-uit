package com.cloudian.backend.services;

import java.time.Duration;
import java.time.Instant;
import java.util.Date;

import org.springframework.stereotype.Service;

import com.cloudian.backend.commons.constants.RedisKey;
import com.cloudian.backend.commons.enums.TokenType;
import com.cloudian.backend.utils.JwtUtil;

@Service
public class AccessTokenRevocationService {

    private static final String REVOKED_VALUE = "1";

    private final JwtUtil jwtUtil;
    private final RedisService redisService;

    public AccessTokenRevocationService(JwtUtil jwtUtil, RedisService redisService) {
        this.jwtUtil = jwtUtil;
        this.redisService = redisService;
    }

    public void revoke(String accessToken) {
        String tokenId = requiredTokenId(accessToken);
        Date expiration = jwtUtil.extractExpiration(accessToken, TokenType.ACCESS);
        Duration remaining = Duration.between(Instant.now(), expiration.toInstant());
        if (remaining.isNegative() || remaining.isZero()) {
            throw new IllegalArgumentException("Access token is expired");
        }

        redisService.set(
                RedisKey.revokedAccessToken(tokenId),
                REVOKED_VALUE,
                roundUpToWholeSeconds(remaining));
    }
    //Dung de kiem tra xem access token nay hien tai co bij revoke chua 
    public boolean isRevoked(String accessToken) {
        String tokenId = requiredTokenId(accessToken);
        System.out.println(tokenId); 
        //Kiem, tra no co that su luu vao ben trong redis khong 
        return redisService.get(RedisKey.revokedAccessToken(tokenId)).isPresent();
    }
    //Access token phai co jti de co the luu tru vao ben trong redis 
    private String requiredTokenId(String accessToken) {
        String tokenId = jwtUtil.extractTokenId(accessToken, TokenType.ACCESS);
        if (tokenId == null || tokenId.isBlank()) {
            throw new IllegalArgumentException("Access token is missing jti");
        }
        return tokenId;
    }

    private Duration roundUpToWholeSeconds(Duration duration) {
        long seconds = duration.getSeconds() + (duration.getNano() == 0 ? 0 : 1);
        return Duration.ofSeconds(seconds);
    }
}
