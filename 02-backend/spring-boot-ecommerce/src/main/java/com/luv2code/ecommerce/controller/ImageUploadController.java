package com.luv2code.ecommerce.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

/**
 * POST /api/admin/uploads (multipart, field "file") saves a product image in the upload folder
 * and returns its public URL, e.g. {"url": "http://localhost:8080/uploads/3f2a....png"}.
 * Admin only (everything under /api/admin requires ROLE_ADMIN). The files are served by UploadConfig.
 */
@RestController
@RequestMapping("/api/admin/uploads")
public class ImageUploadController {

    // allowed image types and the file extension used for each
    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/png", ".png",
            "image/jpeg", ".jpg",
            "image/webp", ".webp",
            "image/gif", ".gif");

    private final Path uploadDir;

    public ImageUploadController(@Value("${app.upload-dir:uploads}") String uploadDir) throws IOException {
        this.uploadDir = Path.of(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(this.uploadDir);
    }

    @PostMapping
    public Map<String, String> upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose an image to upload");
        }
        String extension = EXTENSIONS.get(file.getContentType());
        if (extension == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only PNG, JPG, WebP or GIF images are allowed");
        }

        // a random name: never trust the uploaded file name
        String fileName = UUID.randomUUID() + extension;
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, uploadDir.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
        }

        String url = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/uploads/")
                .path(fileName)
                .toUriString();
        return Map.of("url", url);
    }
}
