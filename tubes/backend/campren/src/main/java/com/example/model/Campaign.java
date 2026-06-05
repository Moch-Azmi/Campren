package com.example.model;

import jakarta.persistence.*;
import java.sql.Date;

@Entity
@Table(name="campaigns")
public class Campaign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="campaign_id")
    private Integer campaignId;

    private Integer userId;
    private Integer platformId;
    private String namaCampaign;
    private Integer budget;
    private Date tanggalMulai;
    private Date tanggalAkhir;
    @Column(name = "targetViews")
    private Long targetViews;
    @Column(name = "targetClicks")
    private Long targetClicks;
    @Column(name = "targetIncome")
    private Long targetIncome;

    public Integer getCampaignId() {
        return campaignId;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public Integer getPlatformId() {
        return platformId;
    }

    public void setPlatformId(Integer platformId) {
        this.platformId = platformId;
    }

    public String getNamaCampaign() {
        return namaCampaign;
    }

    public void setNamaCampaign(String namaCampaign) {
        this.namaCampaign = namaCampaign;
    }

    public Integer getBudget() {
        return budget;
    }

    public void setBudget(Integer budget) {
        this.budget = budget;
    }

    public Date getTanggalMulai() {
        return tanggalMulai;
    }

    public void setTanggalMulai(Date tanggalMulai) {
        this.tanggalMulai = tanggalMulai;
    }

    public Date getTanggalAkhir() {
        return tanggalAkhir;
    }

    public void setTanggalAkhir(Date tanggalAkhir) {
        this.tanggalAkhir = tanggalAkhir;
    }
    
    public Long getTargetViews() {
        return targetViews;
    }

    public void setTargetViews(Long targetViews) {
        this.targetViews = targetViews;
    }
    
    public Long getTargetClicks() {
        return targetClicks;
    }

    public void setTargetClicks(Long targetClicks) {
        this.targetClicks = targetClicks;
    }
    
    public Long getTargetIncome() {
        return targetIncome;
    }

    public void setTargetIncome(Long targetIncome) {
        this.targetIncome = targetIncome;
    }
}