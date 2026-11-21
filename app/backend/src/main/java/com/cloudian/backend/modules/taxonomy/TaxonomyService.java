package com.cloudian.backend.modules.taxonomy;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.regex.Pattern;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.models.Collection;
import com.cloudian.backend.models.Tag;
import com.cloudian.backend.modules.taxonomy.dto.CollectionRequest;
import com.cloudian.backend.modules.taxonomy.dto.CollectionResponse;
import com.cloudian.backend.modules.taxonomy.dto.TagRequest;
import com.cloudian.backend.modules.taxonomy.dto.TagResponse;
import com.cloudian.backend.modules.taxonomy.dto.TaxonomyListResponse;
import com.cloudian.backend.repositories.AgentClassificationCollectionRepository;
import com.cloudian.backend.repositories.AgentClassificationTagRepository;
import com.cloudian.backend.repositories.CollectionRepository;
import com.cloudian.backend.repositories.DocumentCollectionRepository;
import com.cloudian.backend.repositories.DocumentTagRepository;
import com.cloudian.backend.repositories.TagRepository;

@Service
public class TaxonomyService {

    private static final Pattern SLUG_PATTERN = Pattern.compile("[a-z0-9]+(?:-[a-z0-9]+)*");
    private static final int MAX_PAGE_SIZE = 100;

    private final CollectionRepository collectionRepository;
    private final TagRepository tagRepository;
    private final DocumentCollectionRepository documentCollectionRepository;
    private final DocumentTagRepository documentTagRepository;
    private final AgentClassificationCollectionRepository agentClassificationCollectionRepository;
    private final AgentClassificationTagRepository agentClassificationTagRepository;

    public TaxonomyService(
            CollectionRepository collectionRepository,
            TagRepository tagRepository,
            DocumentCollectionRepository documentCollectionRepository,
            DocumentTagRepository documentTagRepository,
            AgentClassificationCollectionRepository agentClassificationCollectionRepository,
            AgentClassificationTagRepository agentClassificationTagRepository) {
        this.collectionRepository = collectionRepository;
        this.tagRepository = tagRepository;
        this.documentCollectionRepository = documentCollectionRepository;
        this.documentTagRepository = documentTagRepository;
        this.agentClassificationCollectionRepository = agentClassificationCollectionRepository;
        this.agentClassificationTagRepository = agentClassificationTagRepository;
    }

    @Transactional(readOnly = true)
    public TaxonomyListResponse<CollectionResponse> listCollections(int page, int size, String query) {
        Pageable pageable = pageRequest(page, size);
        String normalizedQuery = normalizeQuery(query);
        Page<Collection> collections = normalizedQuery == null
                ? collectionRepository.findAll(pageable)
                : collectionRepository.findByNameContainingIgnoreCaseOrSlugContainingIgnoreCase(
                        normalizedQuery, normalizedQuery, pageable);
        return toPageResponse(collections, this::toCollectionResponse);
    }

    @Transactional(readOnly = true)
    public CollectionResponse getCollection(String slug) {
        String normalizedSlug = normalizeSlug(slug);
        return collectionRepository.findBySlug(normalizedSlug)
                .map(this::toCollectionResponse)
                .orElseThrow(() -> notFound("Collection not found."));
    }

    @Transactional(readOnly = true)
    public CollectionResponse getCollectionById(UUID id) {
        return collectionRepository.findById(id)
                .map(this::toCollectionResponse)
                .orElseThrow(() -> notFound("Collection not found."));
    }

    @Transactional
    public CollectionResponse createCollection(CollectionRequest request) {
        String name = requiredText(request.name(), "Collection name");
        String slug = normalizeSlug(request.slug());
        ensureCollectionAvailable(name, slug, null);

        Collection collection = new Collection();
        applyCollection(collection, name, normalizeOptionalText(request.description()), slug,
                normalizeKeywords(request.keywords()));
        try {
            return toCollectionResponse(collectionRepository.saveAndFlush(collection));
        } catch (DataIntegrityViolationException exception) {
            throw collectionConflict();
        }
    }

    @Transactional
    public CollectionResponse updateCollection(UUID id, CollectionRequest request) {
        Collection collection = collectionRepository.findById(id)
                .orElseThrow(() -> notFound("Collection not found."));
        String name = requiredText(request.name(), "Collection name");
        String slug = normalizeSlug(request.slug());
        ensureCollectionAvailable(name, slug, id);
        applyCollection(collection, name, normalizeOptionalText(request.description()), slug,
                normalizeKeywords(request.keywords()));
        try {
            return toCollectionResponse(collectionRepository.saveAndFlush(collection));
        } catch (DataIntegrityViolationException exception) {
            throw collectionConflict();
        }
    }

    @Transactional
    public void deleteCollection(UUID id) {
        Collection collection = collectionRepository.findById(id)
                .orElseThrow(() -> notFound("Collection not found."));
        if (documentCollectionRepository.existsByCollection_Id(id)
                || agentClassificationCollectionRepository.existsByCollection_Id(id)) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Collection is still referenced by documents or classification suggestions.");
        }
        collectionRepository.delete(collection);
    }

    @Transactional(readOnly = true)
    public TaxonomyListResponse<TagResponse> listTags(int page, int size, String query) {
        Pageable pageable = pageRequest(page, size);
        String normalizedQuery = normalizeQuery(query);
        Page<Tag> tags = normalizedQuery == null
                ? tagRepository.findAll(pageable)
                : tagRepository.findByNameContainingIgnoreCaseOrSlugContainingIgnoreCase(
                        normalizedQuery, normalizedQuery, pageable);
        return toPageResponse(tags, this::toTagResponse);
    }

    @Transactional(readOnly = true)
    public TagResponse getTag(String slug) {
        String normalizedSlug = normalizeSlug(slug);
        return tagRepository.findBySlug(normalizedSlug)
                .map(this::toTagResponse)
                .orElseThrow(() -> notFound("Tag not found."));
    }

    @Transactional(readOnly = true)
    public TagResponse getTagById(UUID id) {
        return tagRepository.findById(id)
                .map(this::toTagResponse)
                .orElseThrow(() -> notFound("Tag not found."));
    }

    @Transactional
    public TagResponse createTag(TagRequest request) {
        String name = requiredText(request.name(), "Tag name");
        String slug = normalizeSlug(request.slug());
        ensureTagAvailable(name, slug, null);

        Tag tag = new Tag();
        applyTag(tag, name, slug, requiredText(request.description(), "Tag description"));
        try {
            return toTagResponse(tagRepository.saveAndFlush(tag));
        } catch (DataIntegrityViolationException exception) {
            throw tagConflict();
        }
    }

    @Transactional
    public TagResponse updateTag(UUID id, TagRequest request) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> notFound("Tag not found."));
        String name = requiredText(request.name(), "Tag name");
        String slug = normalizeSlug(request.slug());
        ensureTagAvailable(name, slug, id);
        applyTag(tag, name, slug, requiredText(request.description(), "Tag description"));
        try {
            return toTagResponse(tagRepository.saveAndFlush(tag));
        } catch (DataIntegrityViolationException exception) {
            throw tagConflict();
        }
    }

    @Transactional
    public void deleteTag(UUID id) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> notFound("Tag not found."));
        if (documentTagRepository.existsByTag_Id(id)
                || agentClassificationTagRepository.existsByTag_Id(id)) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Tag is still referenced by documents or classification suggestions.");
        }
        tagRepository.delete(tag);
    }

    private void ensureCollectionAvailable(String name, String slug, UUID currentId) {
        boolean duplicateName = currentId == null
                ? collectionRepository.existsByNameIgnoreCase(name)
                : collectionRepository.existsByNameIgnoreCaseAndIdNot(name, currentId);
        boolean duplicateSlug = currentId == null
                ? collectionRepository.existsBySlug(slug)
                : collectionRepository.existsBySlugAndIdNot(slug, currentId);
        if (duplicateName || duplicateSlug) {
            throw collectionConflict();
        }
    }

    private void ensureTagAvailable(String name, String slug, UUID currentId) {
        boolean duplicateName = currentId == null
                ? tagRepository.existsByNameIgnoreCase(name)
                : tagRepository.existsByNameIgnoreCaseAndIdNot(name, currentId);
        boolean duplicateSlug = currentId == null
                ? tagRepository.existsBySlug(slug)
                : tagRepository.existsBySlugAndIdNot(slug, currentId);
        if (duplicateName || duplicateSlug) {
            throw tagConflict();
        }
    }

    private static void applyCollection(
            Collection collection,
            String name,
            String description,
            String slug,
            List<String> keywords) {
        collection.setName(name);
        collection.setDescription(description);
        collection.setSlug(slug);
        collection.setKeywords(keywords);
    }

    private static void applyTag(Tag tag, String name, String slug, String description) {
        tag.setName(name);
        tag.setSlug(slug);
        tag.setDescription(description);
    }

    private static List<String> normalizeKeywords(List<String> keywords) {
        if (keywords == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Collection keywords are required.");
        }
        Set<String> normalized = new LinkedHashSet<>();
        for (String keyword : keywords) {
            String value = requiredText(keyword, "Collection keyword");
            normalized.add(value);
        }
        return List.copyOf(normalized);
    }

    private static String requiredText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, field + " is required.");
        }
        return value.strip();
    }

    private static String normalizeOptionalText(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }

    private static String normalizeSlug(String value) {
        String slug = requiredText(value, "Slug");
        if (!SLUG_PATTERN.matcher(slug).matches()) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Slug must contain only lowercase letters, numbers and single hyphens.");
        }
        return slug;
    }

    private static String normalizeQuery(String query) {
        return query == null || query.isBlank() ? null : query.strip();
    }

    private static Pageable pageRequest(int page, int size) {
        if (page < 0 || size < 1 || size > MAX_PAGE_SIZE) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Page must be non-negative and size must be between 1 and 100.");
        }
        return PageRequest.of(page, size, Sort.by(Sort.Order.asc("name"), Sort.Order.asc("id")));
    }

    private static <T, R> TaxonomyListResponse<R> toPageResponse(Page<T> page, Function<T, R> mapper) {
        return new TaxonomyListResponse<>(
                page.getContent().stream().map(mapper).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages());
    }

    private static ApiException notFound(String message) {
        return new ApiException(HttpStatus.NOT_FOUND, message);
    }

    private static ApiException collectionConflict() {
        return new ApiException(HttpStatus.CONFLICT, "Collection name or slug already exists.");
    }

    private static ApiException tagConflict() {
        return new ApiException(HttpStatus.CONFLICT, "Tag name or slug already exists.");
    }

    private CollectionResponse toCollectionResponse(Collection collection) {
        UUID id = collection.getId();
        return CollectionResponse.from(
                collection,
                documentCollectionRepository.countByCollection_Id(id),
                agentClassificationCollectionRepository.countByCollection_Id(id),
                collectionRepository.findTagSlugsByCollectionId(id));
    }

    private TagResponse toTagResponse(Tag tag) {
        UUID id = tag.getId();
        return TagResponse.from(
                tag,
                documentTagRepository.countByTag_Id(id),
                agentClassificationTagRepository.countByTag_Id(id));
    }
}
