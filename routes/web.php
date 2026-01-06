<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Maintenance route to clear all caches
Route::get('/maintenance/clear-cache/{token}', function ($token) {
    // Verify maintenance token for security
    if ($token !== config('app.maintenance_token')) {
        abort(403, 'Invalid maintenance token');
    }

    $results = [];

    try {
        // Clear application cache
        Artisan::call('cache:clear');
        $results['cache'] = 'cleared';

        // Clear config cache
        Artisan::call('config:clear');
        $results['config'] = 'cleared';

        // Clear route cache
        Artisan::call('route:clear');
        $results['routes'] = 'cleared';

        // Clear view cache
        Artisan::call('view:clear');
        $results['views'] = 'cleared';

        // Clear compiled classes
        Artisan::call('clear-compiled');
        $results['compiled'] = 'cleared';

        // Optimize (rebuild caches for production)
        Artisan::call('config:cache');
        $results['config_cache'] = 'rebuilt';

        Artisan::call('route:cache');
        $results['route_cache'] = 'rebuilt';

        return response()->json([
            'success' => true,
            'message' => 'All caches cleared and rebuilt successfully',
            'results' => $results,
            'timestamp' => now()->toDateTimeString()
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error during maintenance: ' . $e->getMessage(),
            'results' => $results
        ], 500);
    }
});

