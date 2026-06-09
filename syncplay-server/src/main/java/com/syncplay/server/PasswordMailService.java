package com.syncplay.server;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

@Service
public class PasswordMailService {

```
private final HttpClient httpClient;
private final ObjectMapper objectMapper;
private final String scriptUrl;
private final String scriptSecret;

public PasswordMailService(
        @Value("${mail.script.url}") String scriptUrl,
        @Value("${mail.script.secret}") String scriptSecret
) {
    this.scriptUrl = scriptUrl;
    this.scriptSecret = scriptSecret;
    this.objectMapper = new ObjectMapper();

    this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .followRedirects(HttpClient.Redirect.ALWAYS)
            .build();
}

public void sendTemporaryPassword(
        String email,
        String temporaryPassword
) {
    try {
        String requestBody = objectMapper.writeValueAsString(
                Map.of(
                        "secret", scriptSecret,
                        "email", email,
                        "temporaryPassword", temporaryPassword
                )
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(scriptUrl))
                .timeout(Duration.ofSeconds(30))
                .header(
                        "Content-Type",
                        "application/json; charset=UTF-8"
                )
                .POST(
                        HttpRequest.BodyPublishers.ofString(
                                requestBody
                        )
                )
                .build();

        HttpResponse<String> response =
                httpClient.send(
                        request,
                        HttpResponse.BodyHandlers.ofString()
                );

        if (response.statusCode() < 200
                || response.statusCode() >= 300) {
            throw new RuntimeException(
                    "Apps Script 응답 오류: "
                            + response.statusCode()
            );
        }

        JsonNode result =
                objectMapper.readTree(response.body());

        if (!result.path("success").asBoolean(false)) {
            throw new RuntimeException(
                    result.path("message")
                            .asText("메일 전송에 실패했습니다.")
            );
        }
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();

        throw new RuntimeException(
                "메일 전송이 중단되었습니다.",
                e
        );
    } catch (Exception e) {
        throw new RuntimeException(
                "메일 전송에 실패했습니다.",
                e
        );
    }
}
```

}
