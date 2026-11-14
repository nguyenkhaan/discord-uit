
package com.cloudian.backend.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cloudian.backend.models.ReactIcon;

public interface ReactIconRepository extends JpaRepository<ReactIcon, UUID> {

    List<ReactIcon> findAllByOrderByNameAsc();
}
