package com.example.controller;

import com.example.model.Pelanggan;
import com.example.model.Users;
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
    private UsersRepository usersRepository;

    // ==========================
    // REGISTER
    // POST : /api/auth/register
    // ==========================
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Pelanggan req) {

        try {

            // cek email sudah terdaftar atau belum
            if (pelangganRepository.existsByEmail(req.getEmail())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of(
                                "status", "failed",
                                "message", "Email sudah terdaftar"
                        ));
            }

            // simpan ke tabel pelanggan
            pelangganRepository.save(req);

            // simpan ke tabel users
            Users user = new Users();
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

        Optional<Pelanggan> pelanggan =
                pelangganRepository.findByEmail(req.getEmail());

        if (pelanggan.isPresent()
                && pelanggan.get().getPassword().equals(req.getPassword())) {

            Optional<Users> user =
                    usersRepository.findByEmail(req.getEmail());

            if (user.isPresent()) {

                Map<String, Object> response = new HashMap<>();

                response.put("status", "success");
                response.put("userId", user.get().getUserId());
                response.put("roleId", user.get().getRoleId());
                response.put("email", user.get().getEmail());
                response.put("nama", user.get().getNama());

                return ResponseEntity.ok(response);
            }
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

        Optional<Pelanggan> pelanggan =
                pelangganRepository.findByEmail(req.getEmail());

        if (pelanggan.isPresent()) {

            Pelanggan user = pelanggan.get();
            user.setPassword(req.getPassword());

            pelangganRepository.save(user);

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