package com.cloudian.backend.configs;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Enables Spring Data JPA auditing. The AuditingEntityListener is registered globally
 * in src/main/resources/META-INF/orm.xml, so @CreatedDate and @LastModifiedDate fields
 * are populated on every entity.
 */
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig {
}
