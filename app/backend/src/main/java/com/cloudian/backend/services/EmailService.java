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
