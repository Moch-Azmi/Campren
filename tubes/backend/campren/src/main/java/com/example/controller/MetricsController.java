package com.example.controller;

import com.example.model.PerformanceMetrics;
import com.example.repository.PerformanceMetricsRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/metrics")
@CrossOrigin(origins = "*")
public class MetricsController {

    @Autowired
    private PerformanceMetricsRepository performanceRepository;

    // ==================================
    // GET ROAS + CTR + CPC
    // GET /api/metrics/{campaignId}
    // ==================================
    @GetMapping("/{campaignId}")
    public ResponseEntity<?> getMetrics(
            @PathVariable Integer campaignId) {

        try {

            List<PerformanceMetrics> data =
                    performanceRepository.findByCampaignId(campaignId);

            if (data.isEmpty()) {

                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of(
                                "status", "failed",
                                "message", "Campaign metrics not found"
                        ));
            }

            long revenue = 0;
            long cost = 0;
            long clicks = 0;
            long impressions = 0;

            for (PerformanceMetrics p : data) {

                revenue += p.getRevenue();
                cost += p.getCost();
                clicks += p.getClicks();
                impressions += p.getImpression();
            }

            double roas =
                    cost > 0
                            ? (double) revenue / cost
                            : 0;

            double ctr =
                    impressions > 0
                            ? ((double) clicks / impressions) * 100
                            : 0;

            double cpc =
                    clicks > 0
                            ? (double) cost / clicks
                            : 0;

            Map<String, Object> response =
                    new HashMap<>();

            response.put("status", "success");
            response.put("campaignId", campaignId);
            response.put("totalRevenue", revenue);
            response.put("totalCost", cost);
            response.put("totalClicks", clicks);
            response.put("totalImpressions", impressions);

            response.put("roas",
                    String.format("%.2f", roas));

            response.put("ctr",
                    String.format("%.2f", ctr));

            response.put("cpc",
                    String.format("%.2f", cpc));

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