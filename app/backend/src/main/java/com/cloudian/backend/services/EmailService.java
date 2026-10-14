package com.cloudian.backend.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
public class EmailService {

    private static final String VERIFICATION_TEMPLATE = "email/email-verification";
    private static final String VERIFICATION_SUBJECT = "Verify your UIT Connect email";
    private static final String EMAIL_CHANGE_TEMPLATE = "email/email-change";
    private static final String EMAIL_CHANGED_TEMPLATE = "email/email-change-notification";
    private static final String EMAIL_CHANGE_SUBJECT = "Confirm your new UIT Connect email";
    private static final String EMAIL_CHANGED_SUBJECT = "Your UIT Connect email was changed";
    private static final String PASSWORD_RESET_TEMPLATE = "email/password-reset";
    private static final String PASSWORD_RESET_SUBJECT = "Reset your UIT Connect password";
    private static final String PASSWORD_CHANGED_TEMPLATE = "email/password-changed-notification";
    private static final String PASSWORD_CHANGED_SUBJECT = "Your UIT Connect password was changed";

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final String fromAddress;
    private final String fromName;

    public EmailService(
            JavaMailSender mailSender,
            TemplateEngine templateEngine,
            @Value("${app.mail.from}") String fromAddress,
            @Value("${app.mail.from-name}") String fromName
    ) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
        this.fromAddress = fromAddress;
        this.fromName = fromName;
    }

    public void sendVerificationEmail(String recipient, String fullName, String verificationUrl) {
        Context context = new Context();
        context.setVariable("fullName", fullName);
        context.setVariable("verificationUrl", verificationUrl);
        send(recipient, VERIFICATION_SUBJECT, templateEngine.process(VERIFICATION_TEMPLATE, context));
    }

    public void sendEmailChangeConfirmation(String recipient, String fullName, String confirmationUrl) {
        Context context = new Context();
        context.setVariable("fullName", fullName);
        context.setVariable("confirmationUrl", confirmationUrl);
        send(recipient, EMAIL_CHANGE_SUBJECT, templateEngine.process(EMAIL_CHANGE_TEMPLATE, context));
    }

    public void sendEmailChangedNotice(String oldEmail, String fullName, String newEmail) {
        Context context = new Context();
        context.setVariable("fullName", fullName);
        context.setVariable("newEmail", newEmail);
        send(oldEmail, EMAIL_CHANGED_SUBJECT,templateEngine.process(EMAIL_CHANGED_TEMPLATE, context));
    }

    public void sendPasswordResetEmail(String recipient, String fullName, String resetUrl) {
        Context context = new Context();
        context.setVariable("fullName", fullName);
        context.setVariable("resetUrl", resetUrl);
        send(recipient, PASSWORD_RESET_SUBJECT, templateEngine.process(PASSWORD_RESET_TEMPLATE, context));
    }

    public void sendPasswordChangedNotice(String recipient, String fullName) {
        Context context = new Context();
        context.setVariable("fullName", fullName);
        send(recipient, PASSWORD_CHANGED_SUBJECT, templateEngine.process(PASSWORD_CHANGED_TEMPLATE, context));
    }

    public void send(String recipient, String subject, String htmlBody) {
        mailSender.send(mimeMessage -> {
            MimeMessageHelper message = new MimeMessageHelper(mimeMessage, false, "UTF-8");
            message.setFrom(fromAddress, fromName);
            message.setTo(recipient);
            message.setSubject(subject);
            message.setText(htmlBody, true);
        });
    }
}
