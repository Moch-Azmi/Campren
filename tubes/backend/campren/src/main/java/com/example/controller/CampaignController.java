package com.example.controller;

import com.example.model.Campaign;
import com.example.repository.CampaignRepository;
import com.example.repository.PerformanceMetricsRepository;

import jakarta.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/campaigns")
@CrossOrigin(origins = "*")
public class CampaignController {

    @Autowired
    private CampaignRepository campaignRepository;

    @Autowired
    private PerformanceMetricsRepository performanceMetricsRepository;

    // ==================================
    // CREATE CAMPAIGN
    // POST /api/campaigns
    // ==================================
    @PostMapping
    public ResponseEntity<?> createCampaign(
            @RequestBody Campaign campaign) {

        try {

            Campaign savedCampaign =
                    campaignRepository.save(campaign);

            return ResponseEntity.ok(
                    Map.of(
                            "status", "success",
                            "message", "Campaign created",
                            "campaignId", savedCampaign.getCampaignId()
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

    // ==================================
    // GET ALL CAMPAIGNS
    // GET /api/campaigns
    // ==================================
    @GetMapping
    public ResponseEntity<?> getAllCampaigns() {

        List<Campaign> campaigns =
                campaignRepository.findAll();

        return ResponseEntity.ok(campaigns);
    }

    // ==================================
    // GET USER CAMPAIGNS
    // GET /api/campaigns/user/{userId}
    // ==================================
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserCampaigns(
            @PathVariable Integer userId) {

        List<Campaign> campaigns =
                campaignRepository.findByUserId(userId);

        return ResponseEntity.ok(campaigns);
    }

    // ==================================
    // GET CAMPAIGN BY ID
    // GET /api/campaigns/{campaignId}
    // ==================================
    @GetMapping("/{campaignId}")
    public ResponseEntity<?> getCampaignById(
            @PathVariable Integer campaignId) {

        Optional<Campaign> campaign =
                campaignRepository.findById(campaignId);

        if (campaign.isPresent()) {
            return ResponseEntity.ok(campaign.get());
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of(
                        "status", "failed",
                        "message", "Campaign not found"
                ));
    }

    // ==================================
    // UPDATE CAMPAIGN
    // PUT /api/campaigns/{campaignId}
    // ==================================
    @PutMapping("/{campaignId}")
    public ResponseEntity<?> editCampaign(
            @PathVariable Integer campaignId,
            @RequestBody Campaign updatedCampaign) {

        Optional<Campaign> campaignOpt =
                campaignRepository.findById(campaignId);

        if (campaignOpt.isEmpty()) {

            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "status", "failed",
                            "message", "Campaign not found"
                    ));
        }

        Campaign campaign = campaignOpt.get();

        campaign.setNamaCampaign(
                updatedCampaign.getNamaCampaign());

        campaign.setBudget(
                updatedCampaign.getBudget());

        campaign.setTanggalAkhir(
                updatedCampaign.getTanggalAkhir());

        campaign.setTargetViews(
                updatedCampaign.getTargetViews());

        campaign.setTargetClicks(
                updatedCampaign.getTargetClicks());

        campaign.setTargetIncome(
                updatedCampaign.getTargetIncome());

        campaignRepository.save(campaign);

        return ResponseEntity.ok(
                Map.of(
                        "status", "success",
                        "message", "Campaign updated",
                        "campaignId", campaignId
                )
        );
    }

    // ==================================
    // DELETE CAMPAIGN
    // DELETE /api/campaigns/{campaignId}
    // ==================================
    @Transactional
    @DeleteMapping("/{campaignId}")
    public ResponseEntity<?> deleteCampaign(
            @PathVariable Integer campaignId) {

        Optional<Campaign> campaign =
                campaignRepository.findById(campaignId);

        if (campaign.isEmpty()) {

            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "status", "failed",
                            "message", "Campaign not found"
                    ));
        }

        // hapus performance metrics
        performanceMetricsRepository
                .deleteByCampaignId(campaignId);

        // hapus campaign
        campaignRepository.deleteById(campaignId);

        return ResponseEntity.ok(
                Map.of(
                        "status", "success",
                        "message", "Campaign deleted",
                        "campaignId", campaignId
                )
        );
    }
}