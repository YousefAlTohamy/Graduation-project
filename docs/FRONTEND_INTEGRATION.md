# Frontend Integration Guide - Market Intelligence & On-Demand Scraping

## Overview

This guide provides the React/Next.js implementation patterns for integrating the Market Intelligence features into your CareerCompass frontend.

---

## 1. On-Demand Job Scraping with Loading UI

### Hook: `useOnDemandScraping`

```typescript
// hooks/useOnDemandScraping.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';

interface ScrapingResponse {
  success: boolean;
  message: string;
  scraping_job_id: number;
  status_url: string;
}

interface ScrapingStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
  progress?: string;
  results?: {
    jobs_found: number;
    jobs_stored: number;
  };
  jobs?: any[];
  error?: string;
}

export function useOnDemandScraping() {
  const [isScrap](file:///D:/Graduation/Graduation-project/frontend/docs/FRONTEND_INTEGRATION.md)ping, setIsScraping] = useState(false);
  const [status, setStatus] = useState<ScrapingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const checkStatus = useCallback(async (jobId: number, statusUrl: string) => {
    try {
      const response = await axios.get<ScrapingStatus>(statusUrl);
      setStatus(response.data);

      if (response.data.status === 'completed' || response.data.status === 'failed') {
        clearPolling();
        setIsScraping(false);
      }
    } catch (err) {
      console.error('Error checking status:', err);
      clearPolling();
      setError('Failed to check scraping status');
      setIsScraping(false);
    }
  }, [clearPolling]);

  const triggerScraping = useCallback(async (jobTitle: string, maxResults: number = 30) => {
    setIsScraping(true);
    setError(null);
    setStatus(null);

    try {
      const response = await axios.post<ScrapingResponse>('/api/jobs/scrape-if-missing', {
job_title: jobTitle,
        max_results: maxResults,
      });

      if (response.status === 200) {
        // Jobs already exist
        return response.data;
      }

      if (response.status === 202) {
        // Scraping triggered, start polling
        const { scraping_job_id, status_url } = response.data;

        pollingIntervalRef.current = setInterval(() => {
          checkStatus(scraping_job_id, status_url);
        }, 3000); // Poll every 3 seconds

        return response.data;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to trigger scraping');
      setIsScraping(false);
    }
  }, [checkStatus]);

  useEffect(() => {
    return () => clearPolling();
  }, [clearPolling]);

  return {
    triggerScraping,
    isScraping,
    status,
    error,
  };
}
```

### Component: On-Demand Scraping UI

```tsx
// components/OnDemandJobSearch.tsx
import React, { useState } from "react";
import { useOnDemandScraping } from "@/hooks/useOnDemandScraping";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export function OnDemandJobSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const { triggerScraping, isScraping, status, error } = useOnDemandScraping();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    await triggerScraping(searchQuery);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for job title (e.g., React Developer)"
          className="flex-1 px-4 py-2 border rounded-lg"
          disabled={isScraping}
        />
        <button
          onClick={handleSearch}
          disabled={isScraping}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {isScraping ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Loading State */}
      {isScraping && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="animate-spin text-blue-600" size={20} />
            <div>
              <p className="font-medium text-blue-900">
                {status?.status === "processing"
                  ? "Scraping jobs..."
                  : "Checking database..."}
              </p>
              <p className="text-sm text-blue-700">
                {status?.message || "Please wait..."}
              </p>
            </div>
          </div>

          {status?.progress && (
            <div className="mt-3 text-sm text-blue-600">{status.progress}</div>
          )}
        </div>
      )}

      {/* Success State */}
      {status?.status === "completed" && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="text-green-600 mt-1" size={20} />
            <div>
              <p className="font-medium text-green-900">Jobs Found!</p>
              <p className="text-sm text-green-700">
                Found {status.results?.jobs_found} jobs,{" "}
                {status.results?.jobs_stored} added to database
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {(error || status?.status === "failed") && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <XCircle className="text-red-600 mt-1" size={20} />
            <div>
              <p className="font-medium text-red-900">Scraping Failed</p>
              <p className="text-sm text-red-700">{error || status?.error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 2. Priority-Based Skill Roadmap Display

### Component: Skill Roadmap with Priority Indicators

```tsx
// components/SkillRoadmap.tsx
import React from "react";
import { AlertCircle, TrendingUp, Star } from "lucide-react";

interface Skill {
  id: number;
  name: string;
  type: "technical" | "soft";
  importance_score: number;
  importance_category: "essential" | "important" | "nice_to_have";
}

interface SkillRoadmapProps {
  essentialSkills: Skill[];
  importantSkills: Skill[];
  niceToHaveSkills: Skill[];
  recommendations: string[];
}

const CATEGORY_CONFIG = {
  essential: {
    icon: AlertCircle,
    color: "red",
    label: "Essential",
    badgeBg: "bg-red-100",
    badgeText: "text-red-800",
    borderColor: "border-red-300",
    emoji: "🔴",
  },
  important: {
    icon: TrendingUp,
    color: "amber",
    label: "Important",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-800",
    borderColor: "border-amber-300",
    emoji: "🟡",
  },
  nice_to_have: {
    icon: Star,
    color: "blue",
    label: "Nice to Have",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-800",
    borderColor: "border-blue-300",
    emoji: "💼",
  },
};

export function SkillRoadmap({
  essentialSkills,
  importantSkills,
  niceToHaveSkills,
  recommendations,
}: SkillRoadmapProps) {
  const renderSkillCategory = (
    skills: Skill[],
    category: keyof typeof CATEGORY_CONFIG,
  ) => {
    if (skills.length === 0) return null;

    const config = CATEGORY_CONFIG[category];
    const Icon = config.icon;

    return (
      <div className={`border-l-4 ${config.borderColor} pl-4 mb-6`}>
        <div className="flex items-center gap-2 mb-3">
          <Icon className={`text-${config.color}-600`} size={20} />
          <h3 className="text-lg font-semibold">
            {config.emoji} {config.label} Skills
          </h3>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${config.badgeBg} ${config.badgeText}`}
          >
            {skills.length} {skills.length === 1 ? "skill" : "skills"}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="bg-white border rounded-lg p-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="font-medium text-gray-900">{skill.name}</span>
                <span
                  className={`px-2 py-0.5 rounded text-xs ${config.badgeBg} ${config.badgeText}`}
                >
                  {skill.importance_score.toFixed(0)}%
                </span>
              </div>
              <span className="text-xs text-gray-500 capitalize">
                {skill.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 rounded-xl">
      <h2 className="text-2xl font-bold mb-6">Your Learning Roadmap</h2>

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <div className="bg-white border rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-3">
            📚 Personalized Recommendations
          </h3>
          <ul className="space-y-2">
            {recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Priority-Based Skills */}
      {renderSkillCategory(essentialSkills, "essential")}
      {renderSkillCategory(importantSkills, "important")}
      {renderSkillCategory(niceToHaveSkills, "nice_to_have")}

      {/* Learning Tips */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Pro Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            • Focus on Essential skills first - they appear in 70%+ of job
            postings
          </li>
          <li>
            • Complete at least 80% of Essential + Important skills to be
            competitive
          </li>
          <li>• Nice-to-have skills can set you apart from other candidates</li>
        </ul>
      </div>
    </div>
  );
}
```

### Enhanced Gap Analysis Component

```tsx
// components/EnhancedGapAnalysis.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { SkillRoadmap } from "./SkillRoadmap";

interface GapAnalysisResult {
  match_percentage: number;
  missing_essential_skills: any[];
  missing_important_skills: any[];
  missing_nice_to_have_skills: any[];
  recommendations: string[];
}

export function EnhancedGapAnalysis({ jobId }: { jobId: number }) {
  const [analysis, setAnalysis] = useState<GapAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await axios.get(`/api/gap-analysis/job/${jobId}`);
        setAnalysis(response.data);
      } catch (error) {
        console.error("Failed to fetch gap analysis:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [jobId]);

  if (loading) return <div>Loading analysis...</div>;
  if (!analysis) return <div>Failed to load analysis</div>;

  return (
    <div>
      {/* Match Percentage */}
      <div className="mb-6 p-6 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl">
        <h2 className="text-3xl font-bold mb-2">
          {analysis.match_percentage.toFixed(0)}% Match
        </h2>
        <p className="text-gray-700">
          {analysis.match_percentage >= 75
            ? "You're a great fit for this role!"
            : "Let's work on closing the skill gap"}
        </p>
      </div>

      {/* Skill Roadmap */}
      <SkillRoadmap
        essentialSkills={analysis.missing_essential_skills}
        importantSkills={analysis.missing_important_skills}
        niceToHaveSkills={analysis.missing_nice_to_have_skills}
        recommendations={analysis.recommendations}
      />
    </div>
  );
}
```

---

## 3. Market Intelligence Dashboard

### Component: Trending Skills Widget

```tsx
// components/TrendingSkillsWidget.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { TrendingUp } from "lucide-react";

interface TrendingSkill {
  id: number;
  name: string;
  demand_count: number;
  average_importance: number;
  category: string;
}

export function TrendingSkillsWidget() {
  const [skills, setSkills] = useState<TrendingSkill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingSkills = async () => {
      try {
        const response = await axios.get(
          "/api/market/trending-skills?limit=10&type=technical",
        );
        setSkills(response.data.skills);
      } catch (error) {
        console.error("Failed to fetch trending skills:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingSkills();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="text-green-600" size={24} />
        <h3 className="text-xl font-bold">Trending Technical Skills</h3>
      </div>

      <div className="space-y-3">
        {skills.map((skill, index) => (
          <div
            key={skill.id}
            className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <span className="text-2xl font-bold text-gray-400">
              #{index + 1}
            </span>
            <div className="flex-1">
              <p className="font-medium">{skill.name}</p>
              <p className="text-sm text-gray-500">
                {skill.demand_count} job postings
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                skill.category === "essential"
                  ? "bg-red-100 text-red-800"
                  : skill.category === "important"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-blue-100 text-blue-800"
              }`}
            >
              {skill.average_importance.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

##Summary

These frontend components provide:

1. **On-Demand Scraping**: Real-time job scraping with polling and status updates
2. **Priority Roadmap**: Visual skill categorization with importance indicators
3. **Market Intelligence**: Trending skills and market statistics

Integration is straightforward with the backend APIs and provides an excellent user experience for career guidance.
