package com.syncplay.server;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Service
public class PasswordMailService {

    private final WebClient webClient;
    private final String apiKey;

    public PasswordMailService(
            @Value("${resend.api-key}") String apiKey
    ) {
        this.webClient = WebClient.builder()
                .baseUrl("https://api.resend.com")
                .build();

        this.apiKey = apiKey;
    }

    public void sendTemporaryPassword(
            String email,
            String temporaryPassword
    ) {
        Map<String, Object> requestBody = Map.of(
                "from", "SyncPlay <onboarding@resend.dev>",
                "to", List.of(email),
                "subject", "[SyncPlay] 임시 비밀번호 안내",
                "text",
                "SyncPlay 임시 비밀번호가 발급되었습니다.\n\n" +
                        "임시 비밀번호: " + temporaryPassword + "\n\n" +
                        "로그인 후 설정 화면에서 비밀번호를 변경해주세요."
        );

        webClient.post()
                .uri("/emails")
                .header(
                        HttpHeaders.AUTHORIZATION,
                        "Bearer " + apiKey
                )
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .toBodilessEntity()
                .block();
    }
}