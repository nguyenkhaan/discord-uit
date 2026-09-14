package com.cloudian.backend.commons.constants;

import lombok.Data;

@Data 
public class AppConstant {
    public static Long accessTokenTTL = 10 * 60 * 1000L; //miliseconds 
    public static Long refreshTokenTTL = 24 * 3600 * 7 * 1000L; 
}
