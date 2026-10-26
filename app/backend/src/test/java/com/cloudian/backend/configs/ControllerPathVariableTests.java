package com.cloudian.backend.configs;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Method;
import java.lang.reflect.Parameter;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.type.filter.AnnotationTypeFilter;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

class ControllerPathVariableTests {

    @Test
    void everyPathVariableDeclaresItsNameExplicitly() throws ClassNotFoundException {
        ClassPathScanningCandidateComponentProvider scanner =
                new ClassPathScanningCandidateComponentProvider(false);
        scanner.addIncludeFilter(new AnnotationTypeFilter(RestController.class));

        List<String> unnamedPathVariables = new ArrayList<>();

        for (var beanDefinition : scanner.findCandidateComponents("com.cloudian.backend")) {
            Class<?> controllerClass = Class.forName(beanDefinition.getBeanClassName());

            for (Method method : controllerClass.getDeclaredMethods()) {
                collectUnnamedPathVariables(controllerClass, method, unnamedPathVariables);
            }
        }

        assertThat(unnamedPathVariables)
                .as("@PathVariable must declare a name and not depend on compiler parameter metadata")
                .isEmpty();
    }

    private void collectUnnamedPathVariables(
            Class<?> controllerClass,
            Method method,
            List<String> unnamedPathVariables) {
        for (Parameter parameter : method.getParameters()) {
            PathVariable pathVariable = parameter.getAnnotation(PathVariable.class);
            if (pathVariable == null || hasExplicitName(pathVariable)) {
                continue;
            }

            unnamedPathVariables.add(
                    controllerClass.getSimpleName() + "." + method.getName() + "(" + parameter.getName() + ")");
        }
    }

    private boolean hasExplicitName(PathVariable pathVariable) {
        return !pathVariable.value().isBlank() || !pathVariable.name().isBlank();
    }
}
