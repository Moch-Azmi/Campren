package com.example.repository;

import com.example.model.Users;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsersRepository extends JpaRepository<Users, Integer> {
    Optional<Users> findByEmail(String email);
}