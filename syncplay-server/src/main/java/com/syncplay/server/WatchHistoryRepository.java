package com.syncplay.server;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WatchHistoryRepository extends JpaRepository<WatchHistory, Long> {
    List<WatchHistory> findByUserEmailOrderByIdDesc(String userEmail);
    Optional<WatchHistory> findByTitleAndUserEmail(String title, String userEmail);
    Optional<WatchHistory> findByIdAndUserEmail(Long id, String userEmail);
}