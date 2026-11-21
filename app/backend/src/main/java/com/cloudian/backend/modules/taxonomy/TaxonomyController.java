package com.cloudian.backend.modules.taxonomy;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cloudian.backend.modules.taxonomy.dto.CollectionResponse;
import com.cloudian.backend.modules.taxonomy.dto.TagResponse;
import com.cloudian.backend.modules.taxonomy.dto.TaxonomyListResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class TaxonomyController {

    private final TaxonomyService taxonomyService;

    @GetMapping("/collections")
    public TaxonomyListResponse<CollectionResponse> listCollections(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "query", required = false) String query) {
        return taxonomyService.listCollections(page, size, query);
    }

    @GetMapping("/collections/{slug}")
    public CollectionResponse getCollection(@PathVariable("slug") String slug) {
        return taxonomyService.getCollection(slug);
    }

    @GetMapping("/tags")
    public TaxonomyListResponse<TagResponse> listTags(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "query", required = false) String query) {
        return taxonomyService.listTags(page, size, query);
    }

    @GetMapping("/tags/{slug}")
    public TagResponse getTag(@PathVariable("slug") String slug) {
        return taxonomyService.getTag(slug);
    }
}
