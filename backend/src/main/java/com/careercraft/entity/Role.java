package com.careercraft.entity;

/**
 * Application roles. Spring Security expects authorities prefixed with "ROLE_",
 * which is added in {@link com.careercraft.security.UserPrincipal}.
 */
public enum Role {
    USER,
    ADMIN
}
