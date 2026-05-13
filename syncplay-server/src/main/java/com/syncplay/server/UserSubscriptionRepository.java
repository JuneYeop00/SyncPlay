package com.syncplay.server;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, Long> {
    List<UserSubscription> findByUserEmail(String userEmail);

    @Transactional
    void deleteByUserEmail(String userEmail);

    @Modifying
    @Transactional
    @Query("UPDATE UserSubscription u SET u.userEmail = :newEmail WHERE u.userEmail = :oldEmail")
    void updateUserEmail(@Param("oldEmail") String oldEmail, @Param("newEmail") String newEmail);
}
