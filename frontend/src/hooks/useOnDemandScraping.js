import { useState, useEffect, useCallback } from 'react';
import { jobsAPI } from '../api/endpoints';

/**
 * Custom hook for handling on-demand job scraping with status polling
 * @param {Function} onComplete - Callback when scraping completes successfully
 * @returns {Object} - { triggerScraping, status, error, isLoading, progress }
 */
export function useOnDemandScraping(onComplete) {
    const [status, setStatus] = useState(null); // 'pending', 'processing', 'completed', 'failed'
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [scrapingJobId, setScrapingJobId] = useState(null);
    const [progress, setProgress] = useState(null);

    // Poll scraping status
    useEffect(() => {
        if (!scrapingJobId || status === 'completed' || status === 'failed') {
            return;
        }

        const pollInterval = setInterval(async () => {
            try {
                const response = await jobsAPI.checkScrapingStatus(scrapingJobId);
                const data = response.data.data || response.data;

                setStatus(data.status);
                setProgress(data.progress || null);

                if (data.status === 'completed') {
                    clearInterval(pollInterval);
                    setIsLoading(false);
                    if (onComplete) {
                        onComplete(data);
                    }
                } else if (data.status === 'failed') {
                    clearInterval(pollInterval);
                    setIsLoading(false);
                    setError(data.error || 'Scraping task failed');
                }
            } catch (err) {
                console.error('Failed to check scraping status:', err);
                setError('Failed to check scraping status');
                clearInterval(pollInterval);
                setIsLoading(false);
            }
        }, 3000); // Poll every 3 seconds

        return () => clearInterval(pollInterval);
    }, [scrapingJobId, status, onComplete]);

    const triggerScraping = useCallback(async (jobTitle, maxResults = 30) => {
        try {
            setIsLoading(true);
            setError('');
            setStatus('pending');

            const response = await jobsAPI.scrapeJobIfMissing(jobTitle, maxResults);
            const data = response.data.data || response.data;

            if (data.already_exists) {
                // Jobs already exist, no need to scrape
                setStatus('completed');
                setIsLoading(false);
                if (onComplete) {
                    onComplete(data);
                }
            } else {
                // Scraping initiated
                setScrapingJobId(data.scraping_job_id);
                setStatus(data.status);
            }
        } catch (err) {
            console.error('Failed to trigger scraping:', err);
            setError(err.response?.data?.message || 'Failed to start job scraping');
            setStatus('failed');
            setIsLoading(false);
        }
    }, [onComplete]);

    const reset = useCallback(() => {
        setStatus(null);
        setError('');
        setIsLoading(false);
        setScrapingJobId(null);
        setProgress(null);
    }, []);

    return {
        triggerScraping,
        status,
        error,
        isLoading,
        progress,
        reset,
    };
}
