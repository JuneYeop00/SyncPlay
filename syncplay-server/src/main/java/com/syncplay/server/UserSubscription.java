package com.syncplay.server;

import jakarta.persistence.*;

@Entity
@Table(name = "user_subscriptions")
public class UserSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_email")
    private String userEmail;

    @Column(name = "platform_id")
    private String platformId;

    public UserSubscription() {}

    public UserSubscription(String userEmail, String platformId) {
        this.userEmail = userEmail;
        this.platformId = platformId;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getPlatformId() { return platformId; }
    public void setPlatformId(String platformId) { this.platformId = platformId; }
}
