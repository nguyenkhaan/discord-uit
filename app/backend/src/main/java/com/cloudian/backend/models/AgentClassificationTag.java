package com.cloudian.backend.models;

import java.time.Instant;

import org.springframework.data.annotation.CreatedDate;

import com.cloudian.backend.models.ids.AgentClassificationTagId;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** AI-suggested tag for a classification run; not an official document tag. */
@Entity
@Table(name = "agent_classification_tag")
@Getter
@Setter
@NoArgsConstructor
public class AgentClassificationTag {

    @EmbeddedId
    private AgentClassificationTagId id = new AgentClassificationTagId();

    @MapsId("agentClassificationId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "agent_classification_id",
            nullable = false,
            updatable = false,
            foreignKey = @ForeignKey(name = "fk_agent_classification_tag_classification")
    )
    private AgentClassification agentClassification;

    @MapsId("tagId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "tag_id",
            nullable = false,
            updatable = false,
            foreignKey = @ForeignKey(name = "fk_agent_classification_tag_tag")
    )
    private Tag tag;

    @Column(name = "confidence", nullable = false, updatable = false)
    private Double confidence;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
