package com.example.repository;

import com.example.model.UserAccount;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsersRepository extends JpaRepository<UserAccount, Integer> {
    Optional<UserAccount> findByEmail(String email);
}
