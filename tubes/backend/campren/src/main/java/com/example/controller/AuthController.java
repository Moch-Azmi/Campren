package com.example.controller;

import com.example.model.Admin;
import com.example.model.Pelanggan;
import com.example.model.UserAccount;
import com.example.repository.AdminRepository;
import com.example.repository.PelangganRepository;
import com.example.repository.UsersRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private PelangganRepository pelangganRepository;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private UsersRepository usersRepository;

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim();
    }

    private boolean passwordMatches(String savedPassword, String inputPassword) {
        return savedPassword != null && savedPassword.equals(inputPassword);
    }

    // ==========================
    // REGISTER
    // POST : /api/auth/register
    // ==========================
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Pelanggan req) {

        try {
            String email = normalizeEmail(req.getEmail());
            req.setEmail(email);

            // cek email sudah terdaftar atau belum
            if (pelangganRepository.existsByEmailIgnoreCase(email)
                    || adminRepository.existsByEmailIgnoreCase(email)
                    || usersRepository.findByEmailIgnoreCase(email).isPresent()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of(
                                "status", "failed",
                                "message", "Email sudah terdaftar"
                        ));
            }

            // simpan ke tabel pelanggan
            pelangganRepository.save(req);

            // simpan ke tabel users
            UserAccount user = new UserAccount();
            user.setRoleId(1); // 1 = Advertiser
            user.setEmail(email);
            user.setNama(req.getNama());

            usersRepository.save(user);

            return ResponseEntity.ok(
                    Map.of(
                            "status", "success",
                            "message", "Registrasi berhasil"
                    )
            );

        } catch (Exception e) {

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "status", "failed",
                            "message", e.getMessage()
                    ));
        }
    }

    // ==========================
    // LOGIN
    // POST : /api/auth/login
    // ==========================
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Pelanggan req) {

        String email = normalizeEmail(req.getEmail());
        String password = req.getPassword();

        Optional<UserAccount> user = usersRepository.findByEmailIgnoreCase(email);
        Optional<Pelanggan> pelanggan = pelangganRepository.findByEmailIgnoreCase(email);
        Optional<Admin> admin = adminRepository.findByEmailIgnoreCase(email);

        boolean pelangganValid = pelanggan.isPresent()
                && passwordMatches(pelanggan.get().getPassword(), password);

        boolean adminValid = admin.isPresent()
                && passwordMatches(admin.get().getPassword(), password);

        logger.info(
                "Login check email={}, userFound={}, roleId={}, pelangganFound={}, adminFound={}, pelangganPasswordMatch={}, adminPasswordMatch={}",
                email,
                user.isPresent(),
                user.map(UserAccount::getRoleId).orElse(null),
                pelanggan.isPresent(),
                admin.isPresent(),
                pelangganValid,
                adminValid
        );

        boolean loginValid = false;
        Integer roleId = user.map(UserAccount::getRoleId).orElse(null);

        if (roleId != null && roleId == 2) {
            loginValid = adminValid;
        } else if (roleId != null && roleId == 1) {
            loginValid = pelangganValid;
        } else {
            loginValid = pelangganValid || adminValid;
        }

        if (loginValid) {

            Map<String, Object> response = new HashMap<>();

            response.put("status", "success");
            response.put("userId", user.map(UserAccount::getUserId).orElse(null));
            response.put("roleId", user.map(UserAccount::getRoleId).orElse(adminValid ? 2 : 1));
            response.put("email", email);
            response.put("nama", user.map(UserAccount::getNama)
                    .orElse(adminValid ? admin.get().getNama() : pelanggan.get().getNama()));

            return ResponseEntity.ok(response);
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of(
                        "status", "failed",
                        "message", "Email atau password salah"
                ));
    }

    // ==========================
    // CHANGE PASSWORD
    // PUT : /api/auth/change-password
    // ==========================
    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestBody Pelanggan req) {

        String email = normalizeEmail(req.getEmail());

        Optional<Pelanggan> pelanggan = pelangganRepository.findByEmailIgnoreCase(email);

        if (pelanggan.isPresent()) {

            Pelanggan pelangganData = pelanggan.get();
            pelangganData.setPassword(req.getPassword());

            pelangganRepository.save(pelangganData);

            return ResponseEntity.ok(
                    Map.of(
                            "status", "success",
                            "message", "Password berhasil diubah"
                    )
            );
        }

        Optional<Admin> admin = adminRepository.findByEmailIgnoreCase(email);

        if (admin.isPresent()) {

            Admin adminData = admin.get();
            adminData.setPassword(req.getPassword());

            adminRepository.save(adminData);

            return ResponseEntity.ok(
                    Map.of(
                            "status", "success",
                            "message", "Password berhasil diubah"
                    )
            );
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of(
                        "status", "failed",
                        "message", "Email tidak ditemukan"
                ));
    }
}
