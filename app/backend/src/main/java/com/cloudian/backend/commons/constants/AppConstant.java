package com.cloudian.backend.commons.constants;

import lombok.Data;

@Data 
public class AppConstant {
    public static Long accessTokenTTL = 100 * 60 * 1000L; //miliseconds -> 10000 phut. Test cho no da 
    public static Long refreshTokenTTL = 24 * 3600 * 7 * 1000L; 
}
