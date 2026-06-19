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
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private PelangganRepository pelangganRepository;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private UsersRepository usersRepository;

    // ==========================
    // REGISTER
    // POST : /api/auth/register
    // ==========================
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Pelanggan req) {

        try {

            // cek email sudah terdaftar atau belum
            if (pelangganRepository.existsByEmail(req.getEmail())
                    || adminRepository.existsByEmail(req.getEmail())
                    || usersRepository.findByEmail(req.getEmail()).isPresent()) {
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
            user.setEmail(req.getEmail());
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

        Optional<Pelanggan> pelanggan = pelangganRepository.findByEmail(req.getEmail());
        Optional<Admin> admin = adminRepository.findByEmail(req.getEmail());

        boolean pelangganValid = pelanggan.isPresent()
                && pelanggan.get().getPassword().equals(req.getPassword());

        boolean adminValid = admin.isPresent()
                && admin.get().getPassword().equals(req.getPassword());

        if (pelangganValid || adminValid) {

            Optional<UserAccount> user =
                    usersRepository.findByEmail(req.getEmail());

            Map<String, Object> response = new HashMap<>();

            response.put("status", "success");
            response.put("userId", user.map(UserAccount::getUserId).orElse(null));
            response.put("roleId", user.map(UserAccount::getRoleId).orElse(adminValid ? 2 : 1));
            response.put("email", req.getEmail());
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

        Optional<Pelanggan> pelanggan = pelangganRepository.findByEmail(req.getEmail());

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

        Optional<Admin> admin = adminRepository.findByEmail(req.getEmail());

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
