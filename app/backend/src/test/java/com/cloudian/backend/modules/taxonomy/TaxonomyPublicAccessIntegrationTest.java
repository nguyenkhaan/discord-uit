package com.cloudian.backend.modules.taxonomy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.cloudian.backend.modules.taxonomy.dto.TaxonomyListResponse;
import com.cloudian.backend.modules.taxonomy.dto.CollectionResponse;

class TaxonomyPublicAccessIntegrationTest {

    @Test
    void publicControllerDelegatesCollectionReadsWithoutAnAuthenticatedPrincipal() {
        TaxonomyService service = mock(TaxonomyService.class);
        TaxonomyListResponse<CollectionResponse> expected =
                new TaxonomyListResponse<>(List.of(), 0, 20, 0, 0);
        when(service.listCollections(0, 20, null)).thenReturn(expected);

        TaxonomyListResponse<CollectionResponse> actual =
                new TaxonomyController(service).listCollections(0, 20, null);

        assertThat(actual).isSameAs(expected);
    }
}
