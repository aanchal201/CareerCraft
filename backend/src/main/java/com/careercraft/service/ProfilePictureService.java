package com.careercraft.service;

import com.careercraft.entity.ProfilePicture;
import com.careercraft.exception.InvalidRequestException;
import com.careercraft.exception.ResourceNotFoundException;
import com.careercraft.repository.ProfilePictureRepository;
import com.careercraft.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * Upload, remove and serve profile pictures.
 *
 * Security: we don't trust the file name or the Content-Type the browser
 * sends - we inspect the first bytes of the file ("magic numbers") to confirm
 * it really is a JPEG, PNG or WEBP image.
 */
@Service
public class ProfilePictureService {

    public static final long MAX_SIZE_BYTES = 2L * 1024 * 1024; // 2 MB

    private final ProfilePictureRepository pictureRepository;
    private final UserRepository userRepository;

    public ProfilePictureService(ProfilePictureRepository pictureRepository, UserRepository userRepository) {
        this.pictureRepository = pictureRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void upload(Long userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidRequestException("file", "Please choose an image to upload");
        }
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new InvalidRequestException("file", "Image must be 2 MB or smaller");
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException ex) {
            throw new InvalidRequestException("file", "Could not read the uploaded file");
        }

        String contentType = detectImageType(bytes);
        if (contentType == null) {
            throw new InvalidRequestException("file", "Only JPG, PNG or WEBP images are allowed");
        }

        ProfilePicture picture = pictureRepository.findByUserId(userId)
                .orElseGet(() -> new ProfilePicture(userRepository.getReferenceById(userId)));
        picture.replaceImage(contentType, bytes);
        pictureRepository.save(picture);
    }

    @Transactional
    public void delete(Long userId) {
        pictureRepository.findByUserId(userId).ifPresent(pictureRepository::delete);
    }

    @Transactional(readOnly = true)
    public ProfilePicture getForUser(Long userId) {
        return pictureRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile picture for user", userId));
    }

    /**
     * API-relative URL of the user's avatar, or null if there is none.
     * The "?v=" timestamp changes on every upload, so browsers can cache the
     * image for a long time yet still pick up a new one immediately.
     */
    @Transactional(readOnly = true)
    public String getAvatarPath(Long userId) {
        return pictureRepository.findUpdatedAtByUserId(userId)
                .map(updatedAt -> "/users/" + userId + "/avatar?v=" + updatedAt.toEpochMilli())
                .orElse(null);
    }

    /** Returns the MIME type based on the file signature, or null if unsupported. */
    static String detectImageType(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        if (b.length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G'
                && b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A) {
            return "image/png";
        }
        if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') {
            return "image/webp";
        }
        return null;
    }
}
