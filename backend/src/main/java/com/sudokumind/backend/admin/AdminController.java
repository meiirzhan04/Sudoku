package com.sudokumind.backend.admin;

import com.sudokumind.backend.admin.dto.AdminActionResponse;
import com.sudokumind.backend.admin.dto.AdminPasswordResetRequest;
import com.sudokumind.backend.admin.dto.AdminUserCreateRequest;
import com.sudokumind.backend.admin.dto.AdminUserResponse;
import com.sudokumind.backend.admin.dto.AdminUserUpdateRequest;
import com.sudokumind.backend.common.util.CurrentUser;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users")
    public List<AdminUserResponse> users(@RequestParam(required = false) String q) {
        return adminService.users(CurrentUser.id(), q);
    }

    @PostMapping("/users")
    public AdminUserResponse createUser(@RequestBody AdminUserCreateRequest request) {
        return adminService.createUser(CurrentUser.id(), request);
    }

    @PutMapping("/users/{id}")
    public AdminUserResponse updateUser(@PathVariable UUID id, @RequestBody AdminUserUpdateRequest request) {
        return adminService.updateUser(CurrentUser.id(), id, request);
    }

    @PostMapping("/users/{id}/reset-password")
    public AdminUserResponse resetPassword(@PathVariable UUID id, @RequestBody AdminPasswordResetRequest request) {
        return adminService.resetPassword(CurrentUser.id(), id, request);
    }

    @DeleteMapping("/users/{id}")
    public AdminActionResponse deleteUser(@PathVariable UUID id) {
        return adminService.deleteUser(CurrentUser.id(), id);
    }
}
