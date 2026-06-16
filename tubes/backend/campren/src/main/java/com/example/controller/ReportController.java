package com.example.controller;

import com.example.model.Campaign;
import com.example.model.PerformanceMetrics;
import com.example.repository.CampaignRepository;
import com.example.repository.PerformanceMetricsRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    @Autowired
    private CampaignRepository campaignRepository;

    @Autowired
    private PerformanceMetricsRepository performanceRepository;

    // ==================================
    // GET PERFORMANCE REPORT
    // GET /api/reports/{campaignId}
    // ==================================
    @GetMapping("/{campaignId}")
    public ResponseEntity<?> performanceReport(
            @PathVariable Integer campaignId) {

        try {

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

            List<PerformanceMetrics> metrics =
                    performanceRepository.findByCampaignId(campaignId);

            Map<String, Object> response =
                    new HashMap<>();

            response.put("status", "success");

            // =====================
            // Campaign Information
            // =====================
            Map<String, Object> campaignData =
                    new HashMap<>();

            campaignData.put("campaignId",
                    campaign.getCampaignId());

            campaignData.put("userId",
                    campaign.getUserId());

            campaignData.put("platformId",
                    campaign.getPlatformId());

            campaignData.put("namaCampaign",
                    campaign.getNamaCampaign());

            campaignData.put("budget",
                    campaign.getBudget());

            campaignData.put("tanggalMulai",
                    campaign.getTanggalMulai());

            campaignData.put("tanggalAkhir",
                    campaign.getTanggalAkhir());

            campaignData.put("targetViews",
                    campaign.getTargetViews());

            campaignData.put("targetClicks",
                    campaign.getTargetClicks());

            campaignData.put("targetIncome",
                    campaign.getTargetIncome());

            response.put("campaign", campaignData);

            // =====================
            // Performance List
            // =====================
            response.put("performance", metrics);

            return ResponseEntity.ok(response);

        } catch (Exception e) {

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "status", "failed",
                            "message", e.getMessage()
                    ));
        }
    }
}