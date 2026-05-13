package com.syncplay.server;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface WishlistRepository extends JpaRepository<WishlistItem, Long> {
    List<WishlistItem> findByUserEmailOrderByIdDesc(String userEmail);
    Optional<WishlistItem> findByUserEmailAndTmdbId(String userEmail, Long tmdbId);

    @Transactional
    void deleteByUserEmailAndTmdbId(String userEmail, Long tmdbId);

    @Modifying
    @Transactional
    @Query("UPDATE WishlistItem w SET w.userEmail = :newEmail WHERE w.userEmail = :oldEmail")
    void updateUserEmail(@Param("oldEmail") String oldEmail, @Param("newEmail") String newEmail);
}
