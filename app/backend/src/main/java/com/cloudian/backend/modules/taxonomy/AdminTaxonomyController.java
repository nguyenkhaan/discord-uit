package com.cloudian.backend.modules.taxonomy;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.cloudian.backend.modules.taxonomy.dto.CollectionRequest;
import com.cloudian.backend.modules.taxonomy.dto.CollectionResponse;
import com.cloudian.backend.modules.taxonomy.dto.TagRequest;
import com.cloudian.backend.modules.taxonomy.dto.TagResponse;
import com.cloudian.backend.modules.taxonomy.dto.TaxonomyListResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminTaxonomyController {

    private final TaxonomyService taxonomyService;

    @GetMapping("/collections")
    public TaxonomyListResponse<CollectionResponse> listCollections(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String query) {
        return taxonomyService.listCollections(page, size, query);
    }

    @GetMapping("/collections/{id}")
    public CollectionResponse getCollection(@PathVariable("id") UUID id) {
        return taxonomyService.getCollectionById(id);
    }

    @PostMapping("/collections")
    @ResponseStatus(HttpStatus.CREATED)
    public CollectionResponse createCollection(@Valid @RequestBody CollectionRequest request) {
        return taxonomyService.createCollection(request);
    }

    @PatchMapping("/collections/{id}")
    public CollectionResponse updateCollection(
            @PathVariable("id") UUID id,
            @Valid @RequestBody CollectionRequest request) {
        return taxonomyService.updateCollection(id, request);
    }

    @DeleteMapping("/collections/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCollection(@PathVariable("id") UUID id) {
        taxonomyService.deleteCollection(id);
    }

    @GetMapping("/tags")
    public TaxonomyListResponse<TagResponse> listTags(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String query) {
        return taxonomyService.listTags(page, size, query);
    }

    @GetMapping("/tags/{id}")
    public TagResponse getTag(@PathVariable("id") UUID id) {
        return taxonomyService.getTagById(id);
    }

    @PostMapping("/tags")
    @ResponseStatus(HttpStatus.CREATED)
    public TagResponse createTag(@Valid @RequestBody TagRequest request) {
        return taxonomyService.createTag(request);
    }

    @PatchMapping("/tags/{id}")
    public TagResponse updateTag(
            @PathVariable("id") UUID id,
            @Valid @RequestBody TagRequest request) {
        return taxonomyService.updateTag(id, request);
    }

    @DeleteMapping("/tags/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTag(@PathVariable("id") UUID id) {
        taxonomyService.deleteTag(id);
    }
}
