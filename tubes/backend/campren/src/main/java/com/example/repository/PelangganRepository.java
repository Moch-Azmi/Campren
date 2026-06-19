package com.example.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.model.Pelanggan;
import java.util.Optional;

public interface PelangganRepository extends JpaRepository<Pelanggan, String> {

    boolean existsByEmail(String email);
    boolean existsByEmailIgnoreCase(String email);
    Optional<Pelanggan> findByEmail(String email);
    Optional<Pelanggan> findByEmailIgnoreCase(String email);
}
