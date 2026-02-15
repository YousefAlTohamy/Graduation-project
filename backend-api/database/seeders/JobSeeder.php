<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class JobSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        $jobs = [
            ['title' => 'Senior PHP/Laravel Developer', 'company' => 'Vodafone Egypt', 'description' => 'Experienced PHP developer needed. Laravel, MySQL, Redis, Git required.', 'location' => 'Cairo', 'salary_range' => '15000-25000 EGP', 'job_type' => 'Full-time', 'experience' => '3+ years', 'source' => 'wuzzuf', 'url' => 'https://wuzzuf.net/jobs/vodafone-php', 'created_at' => $now, 'updated_at' => $now],
            ['title' => 'Frontend Developer (React)', 'company' => 'Techneous', 'description' => 'React.js developer needed. JavaScript, HTML, CSS required.', 'location' => 'Remote', 'salary_range' => '12000-20000 EGP', 'job_type' => 'Full-time', 'experience' => '2+ years', 'source' => 'wuzzuf', 'url' => 'https://wuzzuf.net/jobs/react-dev', 'created_at' => $now, 'updated_at' => $now],
            ['title' => 'Full Stack Developer', 'company' => 'Fawry', 'description' => 'Node.js, React, MongoDB. Microservices experience required.', 'location' => 'Cairo', 'salary_range' => '20000-35000 EGP', 'job_type' => 'Full-time', 'experience' => '3+ years', 'source' => 'linkedin', 'url' => 'https://linkedin.com/jobs/fawry-fullstack', 'created_at' => $now, 'updated_at' => $now],
            ['title' => 'Python/Django Developer', 'company' => 'Arab Technology', 'description' => 'Python developer with Django experience. PostgreSQL required.', 'location' => 'Giza', 'salary_range' => '15000-28000 EGP', 'job_type' => 'Full-time', 'experience' => '2+ years', 'source' => 'wuzzuf', 'url' => 'https://wuzzuf.net/jobs/python-django', 'created_at' => $now, 'updated_at' => $now],
            ['title' => 'DevOps Engineer', 'company' => 'Telecom Egypt', 'description' => 'Kubernetes, Docker, CI/CD, AWS required.', 'location' => 'Cairo', 'salary_range' => '25000-40000 EGP', 'job_type' => 'Full-time', 'experience' => '4+ years', 'source' => 'wuzzuf', 'url' => 'https://wuzzuf.net/jobs/devops', 'created_at' => $now, 'updated_at' => $now],
            ['title' => 'Mobile Developer (Flutter)', 'company' => 'Sheikh Technology', 'description' => 'Flutter developer needed. Firebase, REST APIs required.', 'location' => 'Alexandria', 'salary_range' => '12000-22000 EGP', 'job_type' => 'Full-time', 'experience' => '2+ years', 'source' => 'wuzzuf', 'url' => 'https://wuzzuf.net/jobs/flutter-dev', 'created_at' => $now, 'updated_at' => $now],
            ['title' => 'Junior Web Developer', 'company' => 'WebTec Solutions', 'description' => 'HTML, CSS, JavaScript. Will train on Laravel.', 'location' => 'Mansoura', 'salary_range' => '5000-10000 EGP', 'job_type' => 'Full-time', 'experience' => '0-1 years', 'source' => 'wuzzuf', 'url' => 'https://wuzzuf.net/jobs/junior-web', 'created_at' => $now, 'updated_at' => $now],
            ['title' => 'Backend Developer (Node.js)', 'company' => 'Elmenus', 'description' => 'Node.js, Express, TypeScript required.', 'location' => 'Cairo', 'salary_range' => '15000-25000 EGP', 'job_type' => 'Full-time', 'experience' => '2+ years', 'source' => 'linkedin', 'url' => 'https://linkedin.com/jobs/nodejs', 'created_at' => $now, 'updated_at' => $now],
            ['title' => 'Software Engineer', 'company' => 'MENA Energy', 'description' => 'React, Node.js, Cloud services required.', 'location' => 'Smart Village', 'salary_range' => '20000-30000 EGP', 'job_type' => 'Full-time', 'experience' => '3+ years', 'source' => 'wuzzuf', 'url' => 'https://wuzzuf.net/jobs/software-eng', 'created_at' => $now, 'updated_at' => $now],
            ['title' => 'Lead Developer', 'company' => 'Wuzzuf', 'description' => 'PHP, Laravel, MySQL, Leadership required.', 'location' => 'Cairo', 'salary_range' => '35000-50000 EGP', 'job_type' => 'Full-time', 'experience' => '5+ years', 'source' => 'linkedin', 'url' => 'https://linkedin.com/jobs/lead-dev', 'created_at' => $now, 'updated_at' => $now],
        ];

        DB::table('job_postings')->insert($jobs);

        $skills = DB::table('skills')->pluck('id', 'name')->toArray();

        $jobSkills = [];
        $map = [
            1 => ['PHP', 'Laravel', 'MySQL', 'Redis', 'Git', 'Docker'],
            2 => ['React', 'JavaScript', 'HTML', 'CSS'],
            3 => ['React', 'Node.js', 'MongoDB', 'Git'],
            4 => ['Python', 'Django', 'PostgreSQL'],
            5 => ['Docker', 'Kubernetes', 'AWS', 'CI/CD'],
            6 => ['Flutter', 'REST API'],
            7 => ['HTML', 'CSS', 'JavaScript', 'PHP'],
            8 => ['Node.js', 'JavaScript', 'MongoDB'],
            9 => ['React', 'Node.js', 'AWS', 'Git'],
            10 => ['PHP', 'Laravel', 'MySQL', 'Communication'],
        ];

        foreach ($map as $jobId => $skillNames) {
            foreach ($skillNames as $name) {
                if (isset($skills[$name])) {
                    $jobSkills[] = ['job_id' => $jobId, 'skill_id' => $skills[$name], 'required' => true];
                }
            }
        }

        DB::table('job_skills')->insert($jobSkills);
        $this->command->info('Seeded 10 real jobs with skills.');
    }
}
