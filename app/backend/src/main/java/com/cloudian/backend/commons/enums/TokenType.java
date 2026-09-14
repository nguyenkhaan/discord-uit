package com.cloudian.backend.commons.enums;

public enum TokenType {

    ACCESS("access"),
    REFRESH("refresh");

    private final String value;
    TokenType(String value) {
        this.value = value;
    }
    public String getValue() {
        return value;
    }
    public boolean equalsValue(String value) {
        return this.value.equals(value);
    }
    public String toString() {
        return value; 
    }
}