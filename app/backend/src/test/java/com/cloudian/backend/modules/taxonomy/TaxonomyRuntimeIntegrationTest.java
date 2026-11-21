package com.cloudian.backend.modules.taxonomy;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class TaxonomyRuntimeIntegrationTest {

    @Autowired
    private TaxonomyService taxonomyService;

    @Test
    void listsCollectionsAgainstTheConfiguredDatabase() {
        var response = taxonomyService.listCollections(0, 20, null);

        assertThat(response.items()).isNotEmpty();
    }
}
