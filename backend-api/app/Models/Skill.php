<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Skill extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'type',
        'normalized_name',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'type' => 'string',
    ];

    /**
     * Get the users that have this skill.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_skills')
            ->withTimestamps();
    }

    /**
     * Get the jobs that require this skill.
     */
    public function jobs(): BelongsToMany
    {
        return $this->belongsToMany(Job::class, 'job_skills')
            ->withTimestamps();
    }

    /**
     * Ensure normalized_name is set on create/update.
     */
    protected static function booted(): void
    {
        static::creating(function (Skill $skill) {
            $skill->normalized_name = mb_strtolower(trim($skill->name));
        });

        static::updating(function (Skill $skill) {
            $skill->normalized_name = mb_strtolower(trim($skill->name));
        });
    }
}
