package com.syncplay.server;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserSubscriptionService {

    private final UserSubscriptionRepository userSubscriptionRepository;

    public UserSubscriptionService(UserSubscriptionRepository userSubscriptionRepository) {
        this.userSubscriptionRepository = userSubscriptionRepository;
    }

    public List<String> getSubscriptions(String email) {
        return userSubscriptionRepository.findByUserEmail(normalizeEmail(email))
                .stream()
                .map(UserSubscription::getPlatformId)
                .sorted(Comparator.naturalOrder())
                .toList();
    }

    @Transactional
    public void updateSubscriptions(String email, List<String> subscriptions) {
        String normalizedEmail = normalizeEmail(email);
        userSubscriptionRepository.deleteByUserEmail(normalizedEmail);

        List<UserSubscription> newSubs = subscriptions.stream()
                .filter(s -> s != null && !s.isBlank())
                .map(s -> new UserSubscription(normalizedEmail, s.trim()))
                .collect(Collectors.toList());
        userSubscriptionRepository.saveAll(newSubs);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
