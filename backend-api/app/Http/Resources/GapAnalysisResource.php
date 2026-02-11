<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GapAnalysisResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'job' => [
                'id' => $this->resource['job']->id,
                'title' => $this->resource['job']->title,
                'company' => $this->resource['job']->company,
                'url' => $this->resource['job']->url,
            ],
            'analysis' => [
                'match_percentage' => round($this->resource['match_percentage'], 1),
                'match_level' => $this->getMatchLevel($this->resource['match_percentage']),
                'total_required_skills' => $this->resource['total_required'],
                'matched_skills_count' => $this->resource['matched_count'],
                'missing_skills_count' => $this->resource['missing_count'],
                'matched_skills' => SkillResource::collection($this->resource['matched_skills']),
                'missing_skills' => SkillResource::collection($this->resource['missing_skills']),
                'breakdown' => [
                    'technical' => [
                        'required' => $this->resource['technical_required'],
                        'matched' => $this->resource['technical_matched'],
                        'percentage' => $this->resource['technical_required'] > 0
                            ? round(($this->resource['technical_matched'] / $this->resource['technical_required']) * 100, 1)
                            : 0,
                    ],
                    'soft' => [
                        'required' => $this->resource['soft_required'],
                        'matched' => $this->resource['soft_matched'],
                        'percentage' => $this->resource['soft_required'] > 0
                            ? round(($this->resource['soft_matched'] / $this->resource['soft_required']) * 100, 1)
                            : 0,
                    ],
                ],
            ],
            'recommendations' => $this->resource['recommendations'] ?? [],
        ];
    }

    /**
     * Get match level based on percentage.
     */
    private function getMatchLevel(float $percentage): string
    {
        if ($percentage >= 90) return 'Excellent Match';
        if ($percentage >= 75) return 'Good Match';
        if ($percentage >= 60) return 'Fair Match';
        if ($percentage >= 40) return 'Moderate Gap';
        return 'Large Gap';
    }
}
