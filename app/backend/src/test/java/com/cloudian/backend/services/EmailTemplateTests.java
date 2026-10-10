package com.cloudian.backend.services;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;
import org.thymeleaf.templatemode.TemplateMode;

class EmailTemplateTests {

    @Test
    void rendersVerificationParametersAndEscapesUserContent() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding(StandardCharsets.UTF_8.name());

        SpringTemplateEngine templateEngine = new SpringTemplateEngine();
        templateEngine.setTemplateResolver(resolver);
        Context context = new Context();
        context.setVariable("fullName", "<script>alert('x')</script>");
        context.setVariable("verificationUrl", "http://localhost:3000/verify-email?token=test.token");

        String html = templateEngine.process("email/email-verification", context);

        assertThat(html)
                .contains("&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;")
                .contains("http://localhost:3000/verify-email?token=test.token")
                .doesNotContain("<script>alert('x')</script>");
    }
}
