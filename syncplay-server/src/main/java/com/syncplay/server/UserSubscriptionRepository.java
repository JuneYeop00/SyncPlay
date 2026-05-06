package com.syncplay.server;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, Long> {
    List<UserSubscription> findByUserEmail(String userEmail);

    @Transactional
    void deleteByUserEmail(String userEmail);
}
