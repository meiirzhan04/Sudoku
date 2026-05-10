package com.sudokumind.backend.user.controller;

import com.sudokumind.backend.common.util.CurrentUser;
import com.sudokumind.backend.user.dto.PublicUserResponse;
import com.sudokumind.backend.user.dto.UpdateProfileRequest;
import com.sudokumind.backend.user.dto.UserResponse;
import com.sudokumind.backend.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public UserResponse me() {
        return userService.me(CurrentUser.id());
    }

    @PutMapping("/me")
    public UserResponse update(@Valid @RequestBody UpdateProfileRequest request) {
        return userService.update(CurrentUser.id(), request);
    }

    @DeleteMapping("/me")
    public void delete() {
        userService.delete(CurrentUser.id());
    }

    @GetMapping("/search")
    public List<PublicUserResponse> search(@RequestParam String username) {
        return userService.search(username);
    }

    @GetMapping("/{id}/public-profile")
    public PublicUserResponse publicProfile(@PathVariable UUID id) {
        return userService.publicProfile(id);
    }
}
