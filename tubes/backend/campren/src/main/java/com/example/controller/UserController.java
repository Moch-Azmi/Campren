package com.example.controller;

import com.example.model.UserAccount;
import com.example.repository.UsersRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UsersRepository usersRepository;

    // ==================================
    // GET ALL USERS
    // GET /api/users
    // ==================================
    @GetMapping
    public ResponseEntity<?> getAllUsers() {

        List<UserAccount> users = usersRepository.findAll();

        return ResponseEntity.ok(users);
    }

    // ==================================
    // GET USER BY ID
    // GET /api/users/{userId}
    // ==================================
    @GetMapping("/{userId}")
    public ResponseEntity<?> getUserById(
            @PathVariable Integer userId) {

        Optional<UserAccount> user =
                usersRepository.findById(userId);

        if (user.isPresent()) {
            return ResponseEntity.ok(user.get());
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of(
                        "status", "failed",
                        "message", "User not found"
                ));
    }

    // ==================================
    // GET USER BY EMAIL
    // GET /api/users/email/{email}
    // ==================================
    @GetMapping("/email/{email}")
    public ResponseEntity<?> getUserByEmail(
            @PathVariable String email) {

        Optional<UserAccount> user =
                usersRepository.findByEmail(email);

        if (user.isPresent()) {
            return ResponseEntity.ok(user.get());
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of(
                        "status", "failed",
                        "message", "User not found"
                ));
    }

    // ==================================
    // UPDATE USER
    // PUT /api/users/{userId}
    // ==================================
    @PutMapping("/{userId}")
    public ResponseEntity<?> updateUser(
            @PathVariable Integer userId,
            @RequestBody UserAccount updatedUser) {

        Optional<UserAccount> userOpt =
                usersRepository.findById(userId);

        if (userOpt.isEmpty()) {

            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "status", "failed",
                            "message", "User not found"
                    ));
        }

        UserAccount user = userOpt.get();

        user.setNama(updatedUser.getNama());
        user.setEmail(updatedUser.getEmail());
        user.setRoleId(updatedUser.getRoleId());

        usersRepository.save(user);

        return ResponseEntity.ok(
                Map.of(
                        "status", "success",
                        "message", "User updated",
                        "userId", userId
                )
        );
    }

    // ==================================
    // DELETE USER
    // DELETE /api/users/{userId}
    // ==================================
    @DeleteMapping("/{userId}")
    public ResponseEntity<?> deleteUser(
            @PathVariable Integer userId) {

        Optional<UserAccount> user =
                usersRepository.findById(userId);

        if (user.isEmpty()) {

            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "status", "failed",
                            "message", "User not found"
                    ));
        }

        usersRepository.deleteById(userId);

        return ResponseEntity.ok(
                Map.of(
                        "status", "success",
                        "message", "User deleted",
                        "userId", userId
                )
        );
    }
}
