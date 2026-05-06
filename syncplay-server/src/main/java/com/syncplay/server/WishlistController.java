package com.syncplay.server;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/wishlist")
public class WishlistController {

    private final WishlistRepository wishlistRepository;

    public WishlistController(WishlistRepository wishlistRepository) {
        this.wishlistRepository = wishlistRepository;
    }

    @GetMapping
    public List<Map<String, Object>> getWishlist(@RequestParam String email) {
        return toResponseList(wishlistRepository.findByUserEmailOrderByIdDesc(normalize(email)));
    }

    @PostMapping
    @Transactional
    public List<Map<String, Object>> toggleWishlist(@RequestParam String email, @RequestBody Map<String, Object> item) {
        String normalizedEmail = normalize(email);
        Long tmdbId = ((Number) item.get("id")).longValue();

        Optional<WishlistItem> existing = wishlistRepository.findByUserEmailAndTmdbId(normalizedEmail, tmdbId);
        if (existing.isPresent()) {
            wishlistRepository.deleteByUserEmailAndTmdbId(normalizedEmail, tmdbId);
        } else {
            WishlistItem newItem = new WishlistItem();
            newItem.setUserEmail(normalizedEmail);
            newItem.setTmdbId(tmdbId);
            newItem.setTitle((String) item.get("title"));
            newItem.setMediaType((String) item.get("mediaType"));
            newItem.setPosterUrl((String) item.get("posterUrl"));
            newItem.setReleaseDate((String) item.get("releaseDate"));
            wishlistRepository.save(newItem);
        }

        return toResponseList(wishlistRepository.findByUserEmailOrderByIdDesc(normalizedEmail));
    }

    private List<Map<String, Object>> toResponseList(List<WishlistItem> items) {
        return items.stream().map(this::toResponse).collect(Collectors.toList());
    }

    private Map<String, Object> toResponse(WishlistItem item) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", item.getTmdbId());
        map.put("title", item.getTitle());
        map.put("mediaType", item.getMediaType());
        map.put("posterUrl", item.getPosterUrl());
        map.put("releaseDate", item.getReleaseDate());
        return map;
    }

    private String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
