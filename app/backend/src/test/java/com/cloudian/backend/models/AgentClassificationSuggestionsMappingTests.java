package com.cloudian.backend.models;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Field;

import org.junit.jupiter.api.Test;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

class AgentClassificationSuggestionsMappingTests {

    @Test
    void mapsTagSuggestionsAsAnAssociationEntity() throws NoSuchFieldException {
        assertThat(AgentClassificationTag.class.isAnnotationPresent(Entity.class)).isTrue();
        assertThat(AgentClassificationTag.class.getAnnotation(Table.class).name())
                .isEqualTo("agent_classification_tag");
        assertThat(AgentClassificationTag.class.getDeclaredField("id")
                .isAnnotationPresent(EmbeddedId.class)).isTrue();
    }

    @Test
    void exposesBothSuggestionAssociationsFromTheClassificationRun()
            throws NoSuchFieldException {
        assertThat(AgentClassification.class.getDeclaredField("collectionSuggestions")
                .getAnnotation(OneToMany.class).mappedBy())
                .isEqualTo("agentClassification");
        assertThat(AgentClassification.class.getDeclaredField("tagSuggestions")
                .getAnnotation(OneToMany.class).mappedBy())
                .isEqualTo("agentClassification");
    }

    @Test
    void keepsCollectionAndTagSuggestionInverseMappings() throws NoSuchFieldException {
        Field collectionSuggestions = Collection.class
                .getDeclaredField("agentClassificationCollections");
        Field tagSuggestions = Tag.class.getDeclaredField("agentClassificationTags");

        assertThat(collectionSuggestions.getAnnotation(OneToMany.class).mappedBy())
                .isEqualTo("collection");
        assertThat(tagSuggestions.getAnnotation(OneToMany.class).mappedBy())
                .isEqualTo("tag");
    }
}
