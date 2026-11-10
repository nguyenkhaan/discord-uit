package com.cloudian.backend.models;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Field;

import org.junit.jupiter.api.Test;

import jakarta.persistence.Column;

class ServerDescriptionTest {

    @Test
    void mapsDescriptionToAnOptional500CharacterColumn() throws NoSuchFieldException {
        Field description = Server.class.getDeclaredField("description");

        Column column = description.getAnnotation(Column.class);

        assertThat(column).isNotNull();
        assertThat(column.name()).isEqualTo("description");
        assertThat(column.length()).isEqualTo(500);
        assertThat(column.nullable()).isTrue();
    }
}
