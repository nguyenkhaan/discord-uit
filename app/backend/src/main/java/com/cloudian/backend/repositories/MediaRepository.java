package com.cloudian.backend.repositories;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cloudian.backend.models.Media;

public interface MediaRepository extends JpaRepository<Media, UUID> {
}
