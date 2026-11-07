package com.pipre.backend.application.dto;

public record GameScoreDTO(int points,int bestPoints,int pointsGained,long totalPoints,int dailyXpAwarded,String version) {}
