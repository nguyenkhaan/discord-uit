package com.cloudian.backend.modules.taxonomy;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Method;
import java.util.stream.Stream;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.web.bind.annotation.RequestParam;

class TaxonomyRequestParameterNameTest {

    @ParameterizedTest
    @MethodSource("listEndpoints")
    void listEndpointsDeclareRequestParameterNames(Class<?> controllerType, String methodName)
            throws NoSuchMethodException {
        Method method = controllerType.getDeclaredMethod(methodName, int.class, int.class, String.class);
        RequestParam page = (RequestParam) method.getParameterAnnotations()[0][0];
        RequestParam size = (RequestParam) method.getParameterAnnotations()[1][0];
        RequestParam query = (RequestParam) method.getParameterAnnotations()[2][0];

        assertThat(page.name()).isEqualTo("page");
        assertThat(size.name()).isEqualTo("size");
        assertThat(query.name()).isEqualTo("query");
    }

    private static Stream<Arguments> listEndpoints() {
        return Stream.of(
                Arguments.of(TaxonomyController.class, "listCollections"),
                Arguments.of(TaxonomyController.class, "listTags"),
                Arguments.of(AdminTaxonomyController.class, "listCollections"),
                Arguments.of(AdminTaxonomyController.class, "listTags"));
    }
}
