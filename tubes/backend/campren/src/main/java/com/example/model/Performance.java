/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.example.model;

/**
 *
 * @author 4sl1
 */
public class Performance {

    private String date;
    private int impressions;
    private int clicks;
    private int cost;
    private int conversions;
    private int revenue;

    // Getter for date
    public String getDate() {
        return date;
    }

    // Setter for date
    public void setDate(String date) {
        this.date = date;
    }

    // Getter for impressions
    public int getImpressions() {
        return impressions;
    }

    // Setter for impressions
    public void setImpressions(int impressions) {
        this.impressions = impressions;
    }

    // Getter for clicks
    public int getClicks() {
        return clicks;
    }

    // Setter for clicks
    public void setClicks(int clicks) {
        this.clicks = clicks;
    }

    // Getter for cost
    public int getCost() {
        return cost;
    }

    // Setter for cost
    public void setCost(int cost) {
        this.cost = cost;
    }

    // Getter for conversions
    public int getConversions() {
        return conversions;
    }

    // Setter for conversions
    public void setConversions(int conversions) {
        this.conversions = conversions;
    }

    // Getter for revenue
    public int getRevenue() {
        return revenue;
    }

    // Setter for revenue
    public void setRevenue(int revenue) {
        this.revenue = revenue;
    }
}
