package com.cloudian.backend.services;

import java.io.InputStream;
import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import com.cloudian.backend.exceptions.StorageException;

import io.minio.BucketExistsArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
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

    public StorageService(
            MinioClient minioClient,
            @Value("${app.storage.bucket}") String bucket,
            @Value("${app.storage.presigned-url-ttl:PT1H}") Duration presignedUrlTtl
    ) {
        this.minioClient = minioClient;
        this.bucket = bucket;
        this.presignedUrlTtl = presignedUrlTtl;
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

    public void delete(String objectKey) {
        try {
            minioClient.removeObject(RemoveObjectArgs.builder().bucket(bucket).object(objectKey).build());
        } catch (Exception exception) {
            LOGGER.warn("Could not delete file {}", objectKey, exception);
        }
    }
}