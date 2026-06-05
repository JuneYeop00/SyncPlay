package com.syncplay.server;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class PasswordMailService {

    private final JavaMailSender javaMailSender;

    public PasswordMailService(JavaMailSender javaMailSender) {
        this.javaMailSender = javaMailSender;
    }

    public void sendTemporaryPassword(String email, String temporaryPassword) {
        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(email);
        message.setSubject("[SyncPlay] 임시 비밀번호 안내");
        message.setText(
                "SyncPlay 임시 비밀번호가 발급되었습니다.\n\n" +
                "임시 비밀번호: " + temporaryPassword + "\n\n" +
                "로그인 후 설정 화면에서 비밀번호를 변경해주세요."
        );

        javaMailSender.send(message);
    }
}