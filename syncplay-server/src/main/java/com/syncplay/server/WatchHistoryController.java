package com.syncplay.server;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/history")
@CrossOrigin(origins = "*")
public class WatchHistoryController {

    private final WatchHistoryRepository watchHistoryRepository;

    public WatchHistoryController(WatchHistoryRepository watchHistoryRepository) {
        this.watchHistoryRepository = watchHistoryRepository;
    }

    @GetMapping
    public ResponseEntity<?> getHistory(@RequestParam String email) {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();

        if (normalizedEmail.isEmpty()) {
            return ResponseEntity.badRequest().body("email이 필요합니다.");
        }

        List<WatchHistory> list = watchHistoryRepository.findByUserEmailOrderByIdDesc(normalizedEmail);
        return ResponseEntity.ok(list);
    }

    @PostMapping
    public ResponseEntity<?> saveOrUpdateHistory(@RequestBody WatchHistory payload) {
        String userEmail = payload.getUserEmail() == null ? "" : payload.getUserEmail().trim().toLowerCase();
        String title = payload.getTitle() == null ? "" : payload.getTitle().trim();

        if (userEmail.isEmpty()) {
            return ResponseEntity.badRequest().body("userEmail이 필요합니다.");
        }

        if (title.isEmpty()) {
            return ResponseEntity.badRequest().body("title이 필요합니다.");
        }

        Optional<WatchHistory> existing =
                watchHistoryRepository.findByTitleAndUserEmail(title, userEmail);

        if (existing.isPresent()) {
            WatchHistory target = existing.get();
            target.setUserEmail(userEmail);
            target.setPlatform(payload.getPlatform());
            target.setTitle(payload.getTitle());
            target.setSubTitle(payload.getSubTitle());
            target.setProgress(payload.getProgress());
            target.setCurrentTime(payload.getCurrentTime());
            target.setDuration(payload.getDuration());
            target.setUrl(payload.getUrl());
            target.setWatchedAt(payload.getWatchedAt());

            return ResponseEntity.ok(watchHistoryRepository.save(target));
        } else {
            payload.setUserEmail(userEmail);
            return ResponseEntity.ok(watchHistoryRepository.save(payload));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteHistory(@PathVariable Long id, @RequestParam String email) {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();

        if (normalizedEmail.isEmpty()) {
            return ResponseEntity.badRequest().body("email이 필요합니다.");
        }

        Optional<WatchHistory> target =
                watchHistoryRepository.findByIdAndUserEmail(id, normalizedEmail);

        if (target.isEmpty()) {
            return ResponseEntity.badRequest().body("삭제 실패: 데이터를 찾을 수 없습니다.");
        }

        watchHistoryRepository.delete(target.get());
        return ResponseEntity.ok("삭제 완료");
    }
}