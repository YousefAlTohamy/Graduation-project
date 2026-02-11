<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SkillSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();

        $technicalSkills = [
            // Programming Languages
            'PHP',
            'Python',
            'JavaScript',
            'Java',
            'C++',
            'C#',
            'Ruby',
            'Go',
            'TypeScript',
            'Swift',
            'Kotlin',
            'Scala',

            // Web Frameworks
            'Laravel',
            'Django',
            'Flask',
            'FastAPI',
            'React',
            'Vue.js',
            'Angular',
            'Node.js',
            'Express.js',
            'Spring Boot',
            'ASP.NET',
            'Next.js',
            'Nuxt.js',

            // Databases
            'MySQL',
            'PostgreSQL',
            'MongoDB',
            'Redis',
            'SQLite',
            'Oracle',
            'SQL Server',
            'MariaDB',
            'Elasticsearch',

            // DevOps & Tools
            'Docker',
            'Kubernetes',
            'Git',
            'GitHub',
            'GitLab',
            'Jenkins',
            'CI/CD',
            'AWS',
            'Azure',
            'Google Cloud',
            'Terraform',
            'Ansible',

            // Frontend
            'HTML',
            'CSS',
            'SASS',
            'Bootstrap',
            'Tailwind CSS',
            'jQuery',
            'Webpack',

            // Mobile
            'React Native',
            'Flutter',
            'iOS',
            'Android',

            // Other
            'REST API',
            'GraphQL',
            'Microservices',
            'OAuth',
            'JWT',
            'Unit Testing',
            'TDD',
            'Agile',
            'Scrum'
        ];

        $softSkills = [
            'Communication',
            'Teamwork',
            'Leadership',
            'Problem Solving',
            'Time Management',
            'Critical Thinking',
            'Creativity',
            'Adaptability',
            'Work Ethic',
            'Attention to Detail',
            'Collaboration',
            'Interpersonal Skills',
            'Organizational Skills',
            'Decision Making',
            'Conflict Resolution',
            'Presentation Skills',
            'Analytical Skills',
            'Self-Motivation'
        ];

        // Prepare technical skills data
        $technicalSkillsData = array_map(function ($skill) use ($now) {
            return [
                'name' => $skill,
                'type' => 'technical',
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }, $technicalSkills);

        // Prepare soft skills data
        $softSkillsData = array_map(function ($skill) use ($now) {
            return [
                'name' => $skill,
                'type' => 'soft',
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }, $softSkills);

        // Insert all skills
        DB::table('skills')->insert(array_merge($technicalSkillsData, $softSkillsData));

        $this->command->info('Successfully seeded ' . count($technicalSkills) . ' technical skills and ' . count($softSkills) . ' soft skills.');
    }
}
