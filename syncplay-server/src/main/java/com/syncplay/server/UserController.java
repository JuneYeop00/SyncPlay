package com.syncplay.server;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserRepository userRepository;
    private final WatchHistoryRepository watchHistoryRepository;
    private final WishlistRepository wishlistRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final PasswordMailService passwordMailService;

    public UserController(UserRepository userRepository,
                          WatchHistoryRepository watchHistoryRepository,
                          WishlistRepository wishlistRepository,
                          UserSubscriptionRepository userSubscriptionRepository,
                          PasswordMailService passwordMailService) {
        this.userRepository = userRepository;
        this.watchHistoryRepository = watchHistoryRepository;
        this.wishlistRepository = wishlistRepository;
        this.userSubscriptionRepository = userSubscriptionRepository;
        this.passwordMailService = passwordMailService;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody User request) {
        String name = request.getName() == null ? "" : request.getName().trim();
        String email = request.getEmail() == null
                ? ""
                : request.getEmail().trim().toLowerCase();
        String password = request.getPassword() == null
                ? ""
                : request.getPassword().trim();

        if (name.isEmpty() || email.isEmpty() || password.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "모든 항목을 입력해주세요."));
        }

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "이미 사용 중인 이메일입니다."));
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(password);

        User saved = userRepository.save(user);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "회원가입 완료");
        result.put("user", toSafeUser(saved));

        return ResponseEntity.ok(result);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        String email = request.getEmail() == null
                ? ""
                : request.getEmail().trim().toLowerCase();
        String password = request.getPassword() == null
                ? ""
                : request.getPassword().trim();

        if (email.isEmpty() || password.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "이메일과 비밀번호를 입력해주세요."));
        }

        Optional<User> optionalUser = userRepository.findByEmail(email);

        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "이메일 또는 비밀번호가 일치하지 않습니다."));
        }

        User user = optionalUser.get();

        if (!user.getPassword().equals(password)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "이메일 또는 비밀번호가 일치하지 않습니다."));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "로그인 성공");
        result.put("user", toSafeUser(user));
        result.put("password", user.getPassword());

        return ResponseEntity.ok(result);
    }

    @PutMapping("/update")
    public ResponseEntity<?> updateUser(@RequestBody UpdateUserRequest request) {
        String currentEmail = request.getCurrentEmail() == null
                ? ""
                : request.getCurrentEmail().trim().toLowerCase();

        Optional<User> optionalUser = userRepository.findByEmail(currentEmail);

        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "사용자를 찾을 수 없습니다."));
        }

        User user = optionalUser.get();

        String newEmail = request.getNewEmail() == null
                ? currentEmail
                : request.getNewEmail().trim().toLowerCase();

        if (!newEmail.equals(currentEmail)
                && userRepository.existsByEmail(newEmail)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "이미 사용 중인 이메일입니다."));
        }

        String name = request.getName() == null
                ? ""
                : request.getName().trim();

        if (name.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "이름을 입력해주세요."));
        }

        user.setName(name);
        user.setEmail(newEmail);

        if (request.getNewPassword() != null
                && !request.getNewPassword().isBlank()) {
            user.setPassword(request.getNewPassword().trim());
        }

        User saved = userRepository.save(user);

        if (!newEmail.equals(currentEmail)) {
            watchHistoryRepository.updateUserEmail(currentEmail, newEmail);
            wishlistRepository.updateUserEmail(currentEmail, newEmail);
            userSubscriptionRepository.updateUserEmail(currentEmail, newEmail);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "수정 완료");
        result.put("user", toSafeUser(saved));
        result.put("password", saved.getPassword());

        return ResponseEntity.ok(result);
    }

    @PostMapping("/find-password")
    public ResponseEntity<?> findPassword(
            @RequestBody FindPasswordRequest request
    ) {
        String name = request.getName() == null
                ? ""
                : request.getName().trim();

        String email = request.getEmail() == null
                ? ""
                : request.getEmail().trim().toLowerCase();

        if (name.isEmpty() || email.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            "이름과 이메일을 모두 입력해주세요."
                    ));
        }

        Optional<User> optionalUser =
                userRepository.findByNameAndEmail(name, email);

        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            "등록되지 않은 이름 또는 이메일입니다."
                    ));
        }

        User user = optionalUser.get();

        String temporaryPassword =
                "SP" + UUID.randomUUID()
                        .toString()
                        .replace("-", "")
                        .substring(0, 8);

        try {
            // 메일이 성공한 뒤에만 DB 비밀번호 변경
            passwordMailService.sendTemporaryPassword(
                    email,
                    temporaryPassword
            );

            user.setPassword(temporaryPassword);
            userRepository.saveAndFlush(user);

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "임시 비밀번호가 이메일로 전송되었습니다."
                    )
            );

        } catch (Exception e) {
            System.err.println(
                    "메일 전송 실패 유형: " + e.getClass().getName()
            );
            System.err.println(
                    "메일 전송 실패 메시지: " + e.getMessage()
            );
            e.printStackTrace();

            return ResponseEntity.internalServerError()
                    .body(Map.of(
                            "message",
                            "메일 전송에 실패했습니다. 잠시 후 다시 시도해주세요."
                    ));
        }
    }
    private Map<String, Object> toSafeUser(User user) {
        Map<String, Object> safeUser = new LinkedHashMap<>();

        safeUser.put("id", user.getId());
        safeUser.put("name", user.getName());
        safeUser.put("email", user.getEmail());

        return safeUser;
    }

    public static class FindPasswordRequest {

        private String name;
        private String email;

        public FindPasswordRequest() {
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }
    }

    public static class UpdateUserRequest {

        private String currentEmail;
        private String name;
        private String newEmail;
        private String newPassword;

        public UpdateUserRequest() {
        }

        public String getCurrentEmail() {
            return currentEmail;
        }

        public void setCurrentEmail(String currentEmail) {
            this.currentEmail = currentEmail;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getNewEmail() {
            return newEmail;
        }

        public void setNewEmail(String newEmail) {
            this.newEmail = newEmail;
        }

        public String getNewPassword() {
            return newPassword;
        }

        public void setNewPassword(String newPassword) {
            this.newPassword = newPassword;
        }
    }

    public static class LoginRequest {

        private String email;
        private String password;

        public LoginRequest() {
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }
}

