package com.cloudian.backend.modules.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.util.UriComponentsBuilder;

import com.cloudian.backend.events.AccountVerificationRequestedEvent;
import com.cloudian.backend.services.EmailService;

/**
 * Sends the verification link once the registration transaction has committed.
 */
@Component
public class AccountVerificationEmailListener {

    private final EmailService emailService;
    private final String verifyEmailUrl;

    public AccountVerificationEmailListener(
            EmailService emailService,
            @Value("${app.verify-email-url:http://localhost:5173/verify-email}") String verifyEmailUrl
    ) {
        this.emailService = emailService;
        this.verifyEmailUrl = verifyEmailUrl;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onVerificationRequested(AccountVerificationRequestedEvent event) {
        String link = UriComponentsBuilder.fromUriString(verifyEmailUrl)
                .queryParam("token", event.rawToken())
                .build()
                .encode()
                .toUriString();

        emailService.sendVerificationEmail(event.email(), event.fullName(), link);
    }
}
