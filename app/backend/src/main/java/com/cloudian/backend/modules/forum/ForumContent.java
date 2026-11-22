package com.cloudian.backend.modules.forum;

import java.util.Set;

import org.springframework.http.HttpStatus;

import com.cloudian.backend.exceptions.ApiException;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Nội dung bài là JSON của trình soạn Tiptap: {"type":"doc","content":[...]}.
 * Kiểm tra node/mark được phép và lấy chữ thuần để làm đoạn trích.
 */
public final class ForumContent {

    public static final int MAX_JSON_LENGTH = 200_000;
    public static final int MAX_TEXT_LENGTH = 20_000;
    public static final int EXCERPT_LENGTH = 200;

    private static final int MAX_DEPTH = 20;
    private static final JsonMapper JSON = JsonMapper.builder().build();

    private static final Set<String> NODE_TYPES = Set.of(
            "doc", "paragraph", "text", "heading", "bulletList", "orderedList",
            "listItem", "blockquote", "codeBlock", "hardBreak", "horizontalRule");
    private static final Set<String> MARK_TYPES = Set.of(
            "bold", "italic", "underline", "strike", "code", "link");
    private static final Set<String> BLOCK_TYPES = Set.of(
            "paragraph", "heading", "listItem", "blockquote", "codeBlock");

    private ForumContent() {
    }

    /** Kiểm tra nội dung khi đăng/sửa, trả về chữ thuần */
    public static String validate(String json) {
        if (json == null || json.isBlank() || json.length() > MAX_JSON_LENGTH) {
            throw invalid();
        }
        JsonNode root = parse(json);
        if (root == null || !"doc".equals(root.path("type").asString(""))) {
            throw invalid();
        }
        validateNode(root, 0);

        String text = plainText(root).strip();
        if (text.isEmpty() || text.length() > MAX_TEXT_LENGTH) {
            throw invalid();
        }
        return text;
    }

    /** Đoạn trích chữ thuần; đọc được cả dữ liệu cũ dạng {"text": "..."} */
    public static String excerpt(String json) {
        JsonNode root;
        try {
            root = parse(json);
        } catch (ApiException exception) {
            return "";
        }
        if (root == null) {
            return "";
        }
        String text = root.has("type")
                ? plainText(root)
                : root.path("text").asString("");
        String collapsed = text.replaceAll("\\s+", " ").strip();
        return collapsed.length() > EXCERPT_LENGTH
                ? collapsed.substring(0, EXCERPT_LENGTH).stripTrailing() + "…"
                : collapsed;
    }

    private static void validateNode(JsonNode node, int depth) {
        if (depth > MAX_DEPTH || !node.isObject()) {
            throw invalid();
        }
        String type = node.path("type").asString("");
        if (!NODE_TYPES.contains(type)) {
            throw invalid();
        }
        if ("text".equals(type) && !node.path("text").isString()) {
            throw invalid();
        }
        JsonNode marks = node.path("marks");
        if (!marks.isMissingNode()) {
            if (!marks.isArray()) {
                throw invalid();
            }
            for (JsonNode mark : marks) {
                validateMark(mark);
            }
        }
        JsonNode children = node.path("content");
        if (!children.isMissingNode()) {
            if (!children.isArray()) {
                throw invalid();
            }
            for (JsonNode child : children) {
                validateNode(child, depth + 1);
            }
        }
    }

    /** Link chỉ cho http, https, mailto để chặn javascript: */
    private static void validateMark(JsonNode mark) {
        String type = mark.path("type").asString("");
        if (!MARK_TYPES.contains(type)) {
            throw invalid();
        }
        if ("link".equals(type)) {
            String href = mark.path("attrs").path("href").asString("").strip().toLowerCase();
            if (!(href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:"))) {
                throw invalid();
            }
        }
    }

    private static String plainText(JsonNode root) {
        StringBuilder builder = new StringBuilder();
        appendText(root, builder, 0);
        return builder.toString();
    }

    private static void appendText(JsonNode node, StringBuilder builder, int depth) {
        if (depth > MAX_DEPTH) {
            return;
        }
        String type = node.path("type").asString("");
        if ("text".equals(type)) {
            builder.append(node.path("text").asString(""));
            return;
        }
        if ("hardBreak".equals(type)) {
            builder.append('\n');
            return;
        }
        for (JsonNode child : node.path("content")) {
            appendText(child, builder, depth + 1);
        }
        if (BLOCK_TYPES.contains(type)) {
            builder.append('\n');
        }
    }

    private static JsonNode parse(String json) {
        try {
            return JSON.readTree(json);
        } catch (JacksonException exception) {
            throw invalid();
        }
    }

    private static ApiException invalid() {
        return new ApiException(HttpStatus.BAD_REQUEST, "Invalid post content.");
    }
}
