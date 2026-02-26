<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreScrapingSourceRequest;
use App\Http\Resources\ScrapingSourceResource;
use App\Models\ScrapingSource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Log;

class ScrapingSourceController extends Controller
{
    /**
     * List all scraping sources (paginated).
     */
    public function index(): AnonymousResourceCollection
    {
        $sources = ScrapingSource::orderBy('status')
            ->orderBy('name')
            ->paginate(20);

        return ScrapingSourceResource::collection($sources);
    }

    /**
     * Create a new scraping source.
     */
    public function store(StoreScrapingSourceRequest $request): JsonResponse
    {
        try {
            $source = ScrapingSource::create($request->validated());

            Log::info('Scraping source created', ['id' => $source->id, 'name' => $source->name]);

            return response()->json([
                'message' => 'Scraping source created successfully.',
                'data'    => new ScrapingSourceResource($source),
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to create scraping source', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to create scraping source.'], 500);
        }
    }

    /**
     * Show a single scraping source.
     */
    public function show(int $id): JsonResponse
    {
        $source = ScrapingSource::findOrFail($id);
        return response()->json(['data' => new ScrapingSourceResource($source)]);
    }

    /**
     * Update an existing scraping source.
     */
    public function update(StoreScrapingSourceRequest $request, int $id): JsonResponse
    {
        try {
            $source = ScrapingSource::findOrFail($id);
            $source->update($request->validated());

            Log::info('Scraping source updated', ['id' => $source->id, 'name' => $source->name]);

            return response()->json([
                'message' => 'Scraping source updated successfully.',
                'data'    => new ScrapingSourceResource($source->fresh()),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update scraping source', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to update scraping source.'], 500);
        }
    }

    /**
     * Delete a scraping source.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $source = ScrapingSource::findOrFail($id);
            $name   = $source->name;
            $source->delete();

            Log::info('Scraping source deleted', ['id' => $id, 'name' => $name]);

            return response()->json(['message' => 'Scraping source deleted successfully.']);
        } catch (\Exception $e) {
            Log::error('Failed to delete scraping source', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to delete scraping source.'], 500);
        }
    }

    /**
     * Toggle the active / inactive status of a source.
     */
    public function toggleStatus(int $id): JsonResponse
    {
        try {
            $source = ScrapingSource::findOrFail($id);
            $source->toggle();

            Log::info('Scraping source status toggled', [
                'id'     => $source->id,
                'name'   => $source->name,
                'status' => $source->status,
            ]);

            return response()->json([
                'message' => "Source '{$source->name}' is now {$source->status}.",
                'data'    => new ScrapingSourceResource($source),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to toggle scraping source', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to toggle source status.'], 500);
        }
    }
}
