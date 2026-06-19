package com.example.model;

import jakarta.persistence.*;

@Entity
@Table(name = "admin")
public class Admin extends Users {

    private String password;

    public Admin() {
    }

    public Admin(String email, String nama, String password) {
        setEmail(email);
        setNama(nama);
        this.password = password;
    }

    @Override
    @Id
    @Column(name = "email")
    public String getEmail() {
        return super.getEmail();
    }

    @Override
    public void setEmail(String email) {
        super.setEmail(email);
    }

    @Override
    @Column(name = "nama")
    public String getNama() {
        return super.getNama();
    }

    @Override
    public void setNama(String nama) {
        super.setNama(nama);
    }

    @Column(name = "password")
    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
