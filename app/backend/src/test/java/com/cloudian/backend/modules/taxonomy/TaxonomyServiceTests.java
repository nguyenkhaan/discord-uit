package com.cloudian.backend.modules.taxonomy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.models.Collection;
import com.cloudian.backend.models.Tag;
import com.cloudian.backend.modules.taxonomy.dto.CollectionRequest;
import com.cloudian.backend.modules.taxonomy.dto.TagRequest;
import com.cloudian.backend.repositories.AgentClassificationCollectionRepository;
import com.cloudian.backend.repositories.AgentClassificationTagRepository;
import com.cloudian.backend.repositories.CollectionRepository;
import com.cloudian.backend.repositories.DocumentCollectionRepository;
import com.cloudian.backend.repositories.DocumentTagRepository;
import com.cloudian.backend.repositories.TagRepository;

@ExtendWith(MockitoExtension.class)
class TaxonomyServiceTests {

    @Mock
    private CollectionRepository collectionRepository;

    @Mock
    private TagRepository tagRepository;

    @Mock
    private DocumentCollectionRepository documentCollectionRepository;

    @Mock
    private DocumentTagRepository documentTagRepository;

    @Mock
    private AgentClassificationCollectionRepository agentClassificationCollectionRepository;

    @Mock
    private AgentClassificationTagRepository agentClassificationTagRepository;

    @Test
    void createsCollectionWithTrimmedAndDistinctKeywords() {
        Collection saved = collection();
        when(collectionRepository.existsByNameIgnoreCase("Data Science")).thenReturn(false);
        when(collectionRepository.existsBySlug("data-science")).thenReturn(false);
        when(collectionRepository.saveAndFlush(any(Collection.class))).thenReturn(saved);

        TaxonomyService service = taxonomyService();

        service.createCollection(new CollectionRequest(
                "  Data Science ",
                "  Data resources ",
                "data-science",
                java.util.List.of(" SQL ", "AI", "SQL")));

        org.mockito.ArgumentCaptor<Collection> captor =
                org.mockito.ArgumentCaptor.forClass(Collection.class);
        verify(collectionRepository).saveAndFlush(captor.capture());
        Collection created = captor.getValue();
        assertThat(created.getName()).isEqualTo("Data Science");
        assertThat(created.getDescription()).isEqualTo("Data resources");
        assertThat(created.getSlug()).isEqualTo("data-science");
        assertThat(created.getKeywords()).containsExactly("SQL", "AI");
    }

    @Test
    void rejectsDuplicateTagSlugBeforeWriting() {
        when(tagRepository.existsBySlug("programming")).thenReturn(true);

        assertThatThrownBy(() -> taxonomyService().createTag(
                new TagRequest("Programming", "programming", "Software code")))
                .isInstanceOfSatisfying(ApiException.class, exception ->
                        assertThat(exception.getStatus().value()).isEqualTo(409));

        verify(tagRepository, never()).saveAndFlush(any(Tag.class));
    }

    @Test
    void refusesCollectionDeleteWhenOfficialDocumentLinkExists() {
        UUID collectionId = UUID.randomUUID();
        Collection collection = collection();
        collection.setId(collectionId);
        when(collectionRepository.findById(collectionId)).thenReturn(Optional.of(collection));
        when(documentCollectionRepository.existsByCollection_Id(collectionId)).thenReturn(true);

        assertThatThrownBy(() -> taxonomyService().deleteCollection(collectionId))
                .isInstanceOfSatisfying(ApiException.class, exception ->
                        assertThat(exception.getStatus().value()).isEqualTo(409));

        verify(collectionRepository, never()).delete(any(Collection.class));
        verify(agentClassificationCollectionRepository, never()).existsByCollection_Id(collectionId);
    }

    @Test
    void refusesTagDeleteWhenClassificationSuggestionLinkExists() {
        UUID tagId = UUID.randomUUID();
        Tag tag = tag();
        tag.setId(tagId);
        when(tagRepository.findById(tagId)).thenReturn(Optional.of(tag));
        when(documentTagRepository.existsByTag_Id(tagId)).thenReturn(false);
        when(agentClassificationTagRepository.existsByTag_Id(tagId)).thenReturn(true);

        assertThatThrownBy(() -> taxonomyService().deleteTag(tagId))
                .isInstanceOfSatisfying(ApiException.class, exception ->
                        assertThat(exception.getStatus().value()).isEqualTo(409));

        verify(tagRepository, never()).delete(any(Tag.class));
    }

    private TaxonomyService taxonomyService() {
        return new TaxonomyService(
                collectionRepository,
                tagRepository,
                documentCollectionRepository,
                documentTagRepository,
                agentClassificationCollectionRepository,
                agentClassificationTagRepository);
    }

    private static Collection collection() {
        Collection collection = new Collection();
        collection.setId(UUID.randomUUID());
        collection.setName("Data Science");
        collection.setDescription("Data resources");
        collection.setSlug("data-science");
        collection.setKeywords(java.util.List.of("SQL", "AI"));
        return collection;
    }

    private static Tag tag() {
        Tag tag = new Tag();
        tag.setId(UUID.randomUUID());
        tag.setName("Programming");
        tag.setSlug("programming");
        tag.setDescription("Software code");
        return tag;
    }
}
