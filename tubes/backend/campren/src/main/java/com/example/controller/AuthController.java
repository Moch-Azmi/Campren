package com.example.controller;

import com.example.model.Campaign;
import com.example.model.Pelanggan;
import com.example.model.Users;
import com.example.model.PerformanceMetrics;
import com.example.repository.CampaignRepository;

import com.example.repository.PelangganRepository;
import com.example.repository.UsersRepository;
import com.example.repository.PerformanceMetricsRepository;
import jakarta.transaction.Transactional;
import java.util.ArrayList;
import java.util.HashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private PelangganRepository userRepository;

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private CampaignRepository campaignsRepository;

    @Autowired
    private PerformanceMetricsRepository performanceRepository;
    
    @Autowired
    private CampaignRepository campaignRepository;
    
    @Autowired
    private PerformanceMetricsRepository performanceMetricsRepository;


    // ==================================================
    // REGISTER
    // POST /api/register
    // ==================================================
    @PostMapping("/register")
    public String register(@RequestBody Pelanggan req) {

        try {

            if (userRepository.existsByEmail(req.getEmail())) {
                return "email exists";
            }

            userRepository.save(req);

            Users user = new Users();
            user.setRoleId(1);
            user.setEmail(req.getEmail());
            user.setNama(req.getNama());

            usersRepository.save(user);

            return "registered";

        } catch (Exception e) {
            e.printStackTrace();
            return "failed";
        }
    }


    // ==================================================
    // LOGIN
    // POST /api/login
    // ==================================================
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Pelanggan req) {

    Optional<Pelanggan> pelanggan =
            userRepository.findByEmail(req.getEmail());

    if (pelanggan.isPresent() &&
        pelanggan.get().getPassword().equals(req.getPassword())) {

        Optional<Users> user =
                usersRepository.findByEmail(req.getEmail());

        if (user.isPresent()) {

            Map<String, Object> response = new HashMap<>();

            response.put("status", "registered");
            response.put("userId", user.get().getUserId());
            response.put("email", user.get().getEmail());
            response.put("nama", user.get().getNama());

            return ResponseEntity.ok(response);
        }
    }

    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("status", "not registered"));
    }


    // ==================================================
    // CHANGE PASSWORD
    // PUT /api/change-password
    // ==================================================
    @PutMapping("/change-password")
    public String changePassword(@RequestBody Pelanggan req) {

        Optional<Pelanggan> user =
                userRepository.findByEmail(req.getEmail());

        if (user.isPresent()) {

            Pelanggan pelanggan = user.get();
            pelanggan.setPassword(req.getPassword());

            userRepository.save(pelanggan);

            return "success";
        }

        return "email not found";
    }


    // ==================================================
    // CREATE CAMPAIGN
    // POST /api/campaign
    // ==================================================
    @PostMapping("/campaign")
    public String createCampaign(@RequestBody Campaign req) {

        try {
            campaignsRepository.save(req);
            return "campaign created";
        } catch (Exception e) {
            e.printStackTrace();
            return "failed";
        }
    }


    // ==================================================
    // GET ROAS + CTR + CPC
    // GET /api/roas/{id}
    // ==================================================
    @GetMapping("/roas/{id}")
    public String getMetrics(@PathVariable Integer id) {

        try {

            List<PerformanceMetrics> data =
                    performanceRepository.findByCampaignId(id);

            if (data.isEmpty()) {
                return "campaign not found";
            }

            long revenue = 0;
            long cost = 0;
            long clicks = 0;
            long impression = 0;

            for (PerformanceMetrics p : data) {
                revenue += p.getRevenue();
                cost += p.getCost();
                clicks += p.getClicks();
                impression += p.getImpression();
            }

            double roas = cost > 0 ? (double) revenue / cost : 0;
            double ctr = impression > 0 ? ((double) clicks / impression) * 100 : 0;
            double cpc = clicks > 0 ? (double) cost / clicks : 0;

            String json =
            "{"
            + "\"roas\": " + String.format("%.2f", roas) + ","
            + "\"ctr\": " + String.format("%.2f", ctr) + ","
            + "\"cpc\": " + String.format("%.2f", cpc)
            + "}";

return json;

        } catch (Exception e) {
            e.printStackTrace();
            return "failed";
        }
    }


    // ==================================================
    // PERFORMANCE REPORT
    // GET /api/PerformanceReport/{id}
    // ==================================================
    @GetMapping("/PerformanceReport/{id}")
    public String performanceReport(@PathVariable Integer id) {

        try {

            Optional<Campaign> campaign =
                    campaignsRepository.findById(id);

            if (!campaign.isPresent()) {
                return "campaign not found";
            }

            List<PerformanceMetrics> metrics =
                    performanceRepository.findByCampaignId(id);

            String json =
            "{"
            + "\"campaign\": {"
            + "\"campaignId\": " + campaign.get().getCampaignId() + ","
            + "\"userId\": " + campaign.get().getUserId() + ","
            + "\"platformId\": " + campaign.get().getPlatformId() + ","
            + "\"namaCampaign\": \"" + campaign.get().getNamaCampaign() + "\","
            + "\"budget\": " + campaign.get().getBudget() + ","
            + "\"tanggalAwal\": " + campaign.get().getTanggalMulai() + ","
            + "\"tanggalAkhir\": " + campaign.get().getTanggalAkhir() + ","
            + "\"targetViews\": " + campaign.get().getTargetViews() + ","
            + "\"targetClicks\": " + campaign.get().getTargetClicks() + ","
            + "\"targetIncome\": " + campaign.get().getTargetIncome()
            + "},"

            + "\"performance\": [";

            for (int i = 0; i < metrics.size(); i++) {

                PerformanceMetrics p = metrics.get(i);

                json +=
                "{"
                + "\"tanggal\": \"" + p.getTanggal() + "\","
                + "\"impression\": " + p.getImpression() + ","
                + "\"clicks\": " + p.getClicks() + ","
                + "\"cost\": " + p.getCost() + ","
                + "\"conversions\": " + p.getConversions() + ","
                + "\"revenue\": " + p.getRevenue()
                + "}";

                if (i < metrics.size() - 1) {
                    json += ",";
                }
            }

            json += "]}";

            return json;

        } catch (Exception e) {
            e.printStackTrace();
            return "failed";
        }
    }
    @GetMapping("/GetUserCampaigns/{userId}")
    public ResponseEntity<?> getUserCampaigns(
        @PathVariable Integer userId) {

        List<Campaign> campaigns =
            campaignRepository.findByUserId(userId);

        List<Map<String, Object>> response =
            new ArrayList<>();

        for (Campaign campaign : campaigns) {

            Map<String, Object> data =
                new HashMap<>();

            data.put("campaignId",
                campaign.getCampaignId());

            response.add(data);
        }

        return ResponseEntity.ok(response);
    }
    @Transactional
    @DeleteMapping("/campaign/{campaignId}")
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

        // Delete all performance metrics that belong to this campaign
        performanceMetricsRepository.deleteByCampaignId(campaignId);

        // Delete the campaign itself
        campaignRepository.deleteById(campaignId);

        return ResponseEntity.ok(
                Map.of(
                        "status", "success",
                        "message", "Campaign deleted",
                        "campaignId", campaignId
                )
        );
    }
    @PutMapping("/campaign/{campaignId}")
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

        // Only editable fields
        campaign.setNamaCampaign(updatedCampaign.getNamaCampaign());
        campaign.setBudget(updatedCampaign.getBudget());
        campaign.setTanggalAkhir(updatedCampaign.getTanggalAkhir());
        campaign.setTargetClicks(updatedCampaign.getTargetClicks());
        campaign.setTargetIncome(updatedCampaign.getTargetIncome());
        campaign.setTargetViews(updatedCampaign.getTargetViews());

        campaignRepository.save(campaign);

        return ResponseEntity.ok(
            Map.of(
                    "status", "success",
                    "message", "Campaign updated",
                    "campaignId", campaignId
            )
        );
    }
}