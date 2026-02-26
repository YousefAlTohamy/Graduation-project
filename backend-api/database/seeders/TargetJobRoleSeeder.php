<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TargetJobRoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            'PHP Developer',
            'Python Developer',
            'Full Stack Developer',
            'Frontend Developer',
            'Backend Developer',
            'DevOps Engineer',
            'Data Scientist',
            'Mobile Developer',
        ];

        foreach ($roles as $role) {
            \App\Models\TargetJobRole::firstOrCreate(
                ['name' => $role],
                ['is_active' => true]
            );
        }
    }
}
