<?php

namespace App\Http\Controllers;

use App\Models\Diary;
use Illuminate\Http\Request;

class DiaryController extends Controller
{
    public function index(Request $request)
    {
        return $request->user()->diaries()->orderBy('date', 'desc')->get();
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'date' => 'required|date',
        ]);

        $diary = $request->user()->diaries()->create($validatedData);

        return response()->json($diary, 201);
    }

    public function show(Request $request, Diary $diary)
    {
        if ($request->user()->id !== $diary->user_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return $diary;
    }

    public function update(Request $request, Diary $diary)
    {
        if ($request->user()->id !== $diary->user_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validatedData = $request->validate([
            'title' => 'string|max:255',
            'content' => 'string',
            'date' => 'date',
        ]);

        $diary->update($validatedData);

        return response()->json($diary);
    }

    public function destroy(Request $request, Diary $diary)
    {
        if ($request->user()->id !== $diary->user_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $diary->delete();

        return response()->json(['message' => 'Diary entry deleted']);
    }
}
