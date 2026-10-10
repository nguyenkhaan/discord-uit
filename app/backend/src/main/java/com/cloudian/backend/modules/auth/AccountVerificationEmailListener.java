package com.cloudian.backend.modules.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.util.UriComponentsBuilder;

import com.cloudian.backend.events.AccountVerificationRequestedEvent;

/**
 * Sends the verification link once the registration transaction has committed.
 *
 * TODO: The project has no mail dependency yet, so for now the link is only written to the log
 * (development use). To send real email, add spring-boot-starter-mail, configure spring.mail.*,
 * inject JavaMailSender here and replace the log statement. Never log the link in production.
 */
@Component
public class AccountVerificationEmailListener {

    private static final Logger LOGGER = LoggerFactory.getLogger(AccountVerificationEmailListener.class);

    private final String verifyEmailUrl;

    public AccountVerificationEmailListener(
            @Value("${app.verify-email-url:http://localhost:3000/verify-email}") String verifyEmailUrl
    ) {
        this.verifyEmailUrl = verifyEmailUrl;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onVerificationRequested(AccountVerificationRequestedEvent event) {
        String link = UriComponentsBuilder.fromUriString(verifyEmailUrl)
                .queryParam("token", event.rawToken())
                .build()
                .toUriString();

        LOGGER.info("[DEV ONLY] Email verification link for {}: {}", event.email(), link);
    }
}
