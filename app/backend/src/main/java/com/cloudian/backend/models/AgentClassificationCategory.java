package com.cloudian.backend.models;

import java.time.Instant;

import org.springframework.data.annotation.CreatedDate;

import com.cloudian.backend.models.ids.AgentClassificationCategoryId;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Confidence must be between 0 and 1 inclusive. */
@Entity
@Table(name = "agent_classification_category")
@Getter
@Setter
@NoArgsConstructor
public class AgentClassificationCategory {

    @EmbeddedId
    private AgentClassificationCategoryId id = new AgentClassificationCategoryId();

    @MapsId("agentClassificationId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "agent_classification_id", nullable = false, updatable = false)
    private AgentClassification agentClassification;

    @MapsId("categoryId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false, updatable = false)
    private Category category;

    @Column(name = "confidence", nullable = false, updatable = false)
    private Double confidence;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
