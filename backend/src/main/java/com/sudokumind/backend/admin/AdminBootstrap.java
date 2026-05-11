package com.sudokumind.backend.admin;

import com.sudokumind.backend.common.enums.UserRole;
import com.sudokumind.backend.user.entity.User;
import com.sudokumind.backend.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class AdminBootstrap implements ApplicationRunner {
    private final UserRepository userRepository;
    private final String adminEmails;

    public AdminBootstrap(UserRepository userRepository, @Value("${app.admin.emails:}") String adminEmails) {
        this.userRepository = userRepository;
        this.adminEmails = adminEmails;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        for (String email : configuredEmails()) {
            userRepository.findByEmailIgnoreCase(email).ifPresent(this::promote);
        }
    }

    public boolean shouldPromote(String email) {
        if (email == null || email.isBlank()) return false;
        return configuredEmails().contains(email.trim().toLowerCase(Locale.ROOT));
    }

    public User promote(User user) {
        if (user.getRole() != UserRole.ADMIN) {
            user.setRole(UserRole.ADMIN);
            return userRepository.save(user);
        }
        return user;
    }

    private Set<String> configuredEmails() {
        return Arrays.stream(adminEmails.split(","))
                .map(value -> value.trim().toLowerCase(Locale.ROOT))
                .filter(value -> !value.isBlank())
                .collect(Collectors.toSet());
    }
}
