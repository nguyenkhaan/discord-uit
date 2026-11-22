package com.cloudian.backend.modules.forum;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;

import com.cloudian.backend.exceptions.ApiException;

/** Chuẩn hoá chủ đề tự do: bỏ khoảng trắng thừa, chữ thường, bỏ trùng */
public final class ForumTopicNormalizer {

    public static final int MAX_TOPICS = 5;
    public static final int MAX_TOPIC_LENGTH = 30;

    /** Chỉ cho chữ, số, khoảng trắng và - _ . + # */
    private static final Pattern ALLOWED = Pattern.compile("[\\p{L}\\p{N} ._+#-]+");
    private static final Pattern SPACES = Pattern.compile("\\s+");

    private ForumTopicNormalizer() {
    }

    /** Chủ đề khi đăng/sửa bài; sai quy tắc thì báo lỗi 400 */
    public static List<String> normalizeForWrite(List<String> topics) {
        List<String> normalized = normalize(topics);
        if (normalized.size() > MAX_TOPICS) {
            throw invalid("A post can have at most " + MAX_TOPICS + " topics.");
        }
        return normalized;
    }

    /** Chủ đề khi tìm kiếm; bỏ qua chủ đề sai, chỉ lấy tối đa MAX_TOPICS */
    public static List<String> normalizeForSearch(List<String> topics) {
        List<String> result = new ArrayList<>();
        for (String topic : topics == null ? List.<String>of() : topics) {
            try {
                result.addAll(normalize(List.of(topic)));
            } catch (ApiException ignored) {
                // Chủ đề tìm kiếm không hợp lệ thì bỏ qua
            }
        }
        return result.stream().distinct().limit(MAX_TOPICS).toList();
    }

    /** Mảng Postgres dạng {"a","b"}; các ký tự cho phép không cần escape */
    public static String toPostgresArray(List<String> topics) {
        StringBuilder builder = new StringBuilder("{");
        for (int i = 0; i < topics.size(); i++) {
            if (i > 0) {
                builder.append(',');
            }
            builder.append('"').append(topics.get(i)).append('"');
        }
        return builder.append('}').toString();
    }

    private static List<String> normalize(List<String> topics) {
        Set<String> result = new LinkedHashSet<>();
        for (String topic : topics == null ? List.<String>of() : topics) {
            if (topic == null) {
                continue;
            }
            String value = SPACES.matcher(topic.strip()).replaceAll(" ").toLowerCase(Locale.ROOT);
            if (value.isEmpty()) {
                continue;
            }
            if (value.length() > MAX_TOPIC_LENGTH || !ALLOWED.matcher(value).matches()) {
                throw invalid("Invalid topic: " + value);
            }
            result.add(value);
        }
        return List.copyOf(result);
    }

    private static ApiException invalid(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, message);
    }
}
