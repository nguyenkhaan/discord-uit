package com.cloudian.backend.services;

import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.unit.DataSize;
import org.springframework.web.multipart.MultipartFile;

import com.cloudian.backend.exceptions.ApiException;

/**
 * Validates an uploaded image by its real content (magic bytes), then stores it in MinIO.
 * Never trusts the file name or the Content-Type sent by the client.
 */
@Service
public class ImageUploadService {

    private static final String EMPTY_FILE_MESSAGE = "Please choose an image.";
    private static final String TOO_LARGE_MESSAGE = "The image is too large.";
    private static final String UNSUPPORTED_TYPE_MESSAGE = "Only PNG, JPEG or WEBP images are allowed.";

    private static final int HEADER_LENGTH = 12;

    private static final byte[] PNG_SIGNATURE = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'};
    private static final byte[] JPEG_SIGNATURE = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] RIFF_SIGNATURE = {'R', 'I', 'F', 'F'};
    private static final byte[] WEBP_SIGNATURE = {'W', 'E', 'B', 'P'};

    private record ImageType(String contentType, String extension) {
    }

    private final StorageService storageService;
    private final long maxSizeBytes;

    public ImageUploadService(
            StorageService storageService,
            @Value("${app.upload.image.max-size:2MB}") DataSize maxSize
    ) {
        this.storageService = storageService;
        this.maxSizeBytes = maxSize.toBytes();
    }

    public String uploadImage(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, EMPTY_FILE_MESSAGE);
        }
        if (file.getSize() > maxSizeBytes) {
            throw new ApiException(HttpStatus.BAD_REQUEST, TOO_LARGE_MESSAGE);
        }

        ImageType type = detectType(file);
        String objectKey = folder + "/" + UUID.randomUUID() + "." + type.extension();

        try (InputStream content = file.getInputStream()) {
            storageService.upload(objectKey, content, file.getSize(), type.contentType());
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, EMPTY_FILE_MESSAGE);
        }
        return objectKey;
    }

    private static ImageType detectType(MultipartFile file) {
        byte[] header;
        try (InputStream content = file.getInputStream()) {
            header = content.readNBytes(HEADER_LENGTH);
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, UNSUPPORTED_TYPE_MESSAGE);
        }

        if (startsWith(header, 0, PNG_SIGNATURE)) {
            return new ImageType("image/png", "png");
        }
        if (startsWith(header, 0, JPEG_SIGNATURE)) {
            return new ImageType("image/jpeg", "jpg");
        }
        if (startsWith(header, 0, RIFF_SIGNATURE) && startsWith(header, 8, WEBP_SIGNATURE)) {
            return new ImageType("image/webp", "webp");
        }
        throw new ApiException(HttpStatus.BAD_REQUEST, UNSUPPORTED_TYPE_MESSAGE);
    }

    private static boolean startsWith(byte[] data, int offset, byte[] signature) {
        if (data.length < offset + signature.length) {
            return false;
        }
        return Arrays.equals(data, offset, offset + signature.length, signature, 0, signature.length);
    }
}