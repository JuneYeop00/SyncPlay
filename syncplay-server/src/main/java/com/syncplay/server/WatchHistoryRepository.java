package com.syncplay.server;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface WatchHistoryRepository extends JpaRepository<WatchHistory, Long> {
    List<WatchHistory> findByUserEmailOrderByIdDesc(String userEmail);
    Optional<WatchHistory> findByTitleAndUserEmail(String title, String userEmail);
    Optional<WatchHistory> findByIdAndUserEmail(Long id, String userEmail);

    @Modifying
    @Transactional
    @Query("UPDATE WatchHistory w SET w.userEmail = :newEmail WHERE w.userEmail = :oldEmail")
    void updateUserEmail(@Param("oldEmail") String oldEmail, @Param("newEmail") String newEmail);
}