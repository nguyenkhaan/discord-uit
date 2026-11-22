package com.cloudian.backend.services;

import java.io.InputStream;
import java.time.Duration;
import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import com.cloudian.backend.exceptions.StorageException;

import io.minio.BucketExistsArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.GetObjectArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.StatObjectArgs;
import io.minio.StatObjectResponse;
import io.minio.http.Method;

/**
 * Stores files in MinIO. The bucket is PRIVATE: files are never public,
 * the frontend views them through short-lived presigned URLs.
 */
@Service
public class StorageService {

    private static final Logger LOGGER = LoggerFactory.getLogger(StorageService.class);

    private final MinioClient minioClient;
    private final String bucket;
    private final Duration presignedUrlTtl;
    private final Duration uploadUrlTtl;

    public StorageService(
            MinioClient minioClient,
            @Value("${app.storage.bucket}") String bucket,
            @Value("${app.storage.presigned-url-ttl:PT1H}") Duration presignedUrlTtl,
            @Value("${app.storage.upload-url-ttl:PT15M}") Duration uploadUrlTtl
    ) {
        this.minioClient = minioClient;
        this.bucket = bucket;
        this.presignedUrlTtl = presignedUrlTtl;
        this.uploadUrlTtl = uploadUrlTtl;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void ensureBucketExists() {
        try {
            boolean exists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
            if (!exists) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
                LOGGER.info("Created MinIO bucket '{}'", bucket);
            }
        } catch (Exception exception) {
            // Do not crash the whole app: teammates who do not work on uploads may not run MinIO.
            LOGGER.warn("MinIO is not reachable, uploads will fail until it is started", exception);
        }
    }

    public void upload(String objectKey, InputStream content, long size, String contentType) {
        try {
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectKey)
                    .stream(content, size, -1)   // -1: let the SDK pick the part size
                    .contentType(contentType)
                    .build());
        } catch (Exception exception) {
            throw new StorageException("Could not upload file " + objectKey, exception);
        }
    }

    public String presignedGetUrl(String objectKey) {
        try {
            return minioClient.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                    .method(Method.GET)
                    .bucket(bucket)
                    .object(objectKey)
                    .expiry((int) presignedUrlTtl.toSeconds())
                    .build());
        } catch (Exception exception) {
            throw new StorageException("Could not create a link for " + objectKey, exception);
        }
    }

    public String presignedPutUrl(String objectKey, String contentType) {
        try {
            return minioClient.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                    .method(Method.PUT)
                    .bucket(bucket)
                    .object(objectKey)
                    .expiry((int) uploadUrlTtl.toSeconds())
                    .build());
        } catch (Exception exception) {
            throw new StorageException("Could not create an upload link for " + objectKey, exception);
        }
    }

    public Instant uploadUrlExpiresAt() {
        return Instant.now().plus(uploadUrlTtl);
    }

    public StorageObjectMetadata statObject(String objectKey) {
        try {
            StatObjectResponse response = minioClient.statObject(StatObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectKey)
                    .build());
            return new StorageObjectMetadata(
                    response.size(),
                    response.contentType(),
                    response.etag(),
                    readPrefix(objectKey));
        } catch (Exception exception) {
            throw new StorageException("Could not inspect file " + objectKey, exception);
        }
    }

    private byte[] readPrefix(String objectKey) throws Exception {
        try (InputStream content = minioClient.getObject(GetObjectArgs.builder()
                .bucket(bucket)
                .object(objectKey)
                .build())) {
            byte[] prefix = new byte[8];
            int length = content.read(prefix);
            if (length <= 0) {
                return new byte[0];
            }
            byte[] result = new byte[length];
            System.arraycopy(prefix, 0, result, 0, length);
            return result;
        }
    }

    public record StorageObjectMetadata(long size, String contentType, String etag, byte[] prefix) {
    }

    public void delete(String objectKey) {
        try {
            minioClient.removeObject(RemoveObjectArgs.builder().bucket(bucket).object(objectKey).build());
        } catch (Exception exception) {
            LOGGER.warn("Could not delete file {}", objectKey, exception);
        }
    }
}
