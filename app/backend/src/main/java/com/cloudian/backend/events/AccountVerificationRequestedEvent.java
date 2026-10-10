package com.cloudian.backend.events;

/**
 * Published after a verification token is issued. Listeners send the email
 * only after the registration transaction commits.
 */
public record AccountVerificationRequestedEvent(String email, String fullName, String rawToken) {

    @Override
    public String toString() {
        // Never print the raw token in logs by accident.
        return "AccountVerificationRequestedEvent[email=" + email + "]";
    }
}
