package com.cloudian.backend.models;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.annotation.CreatedDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "react_icon")
@Getter
@Setter
@NoArgsConstructor
public class ReactIcon {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "icon_image", nullable = false)
    private String iconImage;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "summary")
    private String summary;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
