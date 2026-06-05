package com.example.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.model.Campaign;
import java.util.List;

public interface CampaignRepository extends JpaRepository<Campaign, Integer> {
    List<Campaign> findByUserId(Integer userId);
}