package com.example.repository;

import com.example.model.Admin;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminRepository extends JpaRepository<Admin, String> {

    boolean existsByEmail(String email);
    boolean existsByEmailIgnoreCase(String email);
    Optional<Admin> findByEmail(String email);
    Optional<Admin> findByEmailIgnoreCase(String email);
}
