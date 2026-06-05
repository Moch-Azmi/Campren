package com.example.repository;

import com.example.model.PerformanceMetrics;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PerformanceMetricsRepository
        extends JpaRepository<PerformanceMetrics, Integer> {

    List<PerformanceMetrics> findByCampaignId(Integer campaignId);
    void deleteByCampaignId(Integer campaignId);
}
