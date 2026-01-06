import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/ui/rich-text-editor";
import { ArrowLeft, Save, Loader2, Check, Cloud } from "lucide-react";

// Get current date in Sri Lanka timezone
const getSriLankaDate = () => {
  const now = new Date();
  const sriLankaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Colombo' }));
  return sriLankaTime.toISOString().split('T')[0];
};

export default function DiaryEntry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // 'saved', 'saving', 'unsaved'
  const [entryId, setEntryId] = useState(id || null);
  const [diary, setDiary] = useState({
    title: '',
    content: '',
    date: getSriLankaDate()
  });
  
  const autoSaveTimeoutRef = useRef(null);
  const isInitialLoad = useRef(true);

  const isEditing = Boolean(entryId);

  useEffect(() => {
    if (id) {
      fetchDiary();
    }
  }, [id]);

  // Autosave effect
  useEffect(() => {
    // Skip autosave on initial load
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    // Don't autosave if there's no title
    if (!diary.title.trim()) {
      return;
    }

    setAutoSaveStatus('unsaved');

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for autosave (2 seconds debounce)
    autoSaveTimeoutRef.current = setTimeout(() => {
      performAutoSave();
    }, 2000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [diary.title, diary.content, diary.date]);

  const performAutoSave = async () => {
    if (!diary.title.trim()) return;

    setAutoSaveStatus('saving');
    try {
      if (entryId) {
        await api.put(`/diaries/${entryId}`, diary);
      } else {
        const response = await api.post('/diaries', diary);
        setEntryId(response.data.id);
        // Update URL without navigation
        window.history.replaceState(null, '', `/entry/${response.data.id}`);
      }
      setAutoSaveStatus('saved');
    } catch (error) {
      console.error('Autosave failed:', error);
      setAutoSaveStatus('unsaved');
    }
  };

  const fetchDiary = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/diaries/${id}`);
      setDiary(response.data);
    } catch (error) {
      console.error('Error fetching diary:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!diary.title.trim()) {
      alert('Please enter a title');
      return;
    }

    setSaving(true);
    try {
      if (entryId) {
        await api.put(`/diaries/${entryId}`, diary);
      } else {
        const response = await api.post('/diaries', diary);
        setEntryId(response.data.id);
      }
      setAutoSaveStatus('saved');
      navigate('/');
    } catch (error) {
      console.error('Error saving diary:', error);
      alert('Failed to save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">
              {entryId ? 'Edit Entry' : 'New Entry'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Autosave Status Indicator */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {autoSaveStatus === 'saving' && (
                <>
                  <Cloud className="h-4 w-4 animate-pulse" />
                  <span>Saving...</span>
                </>
              )}
              {autoSaveStatus === 'saved' && (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Saved</span>
                </>
              )}
              {autoSaveStatus === 'unsaved' && (
                <>
                  <Cloud className="h-4 w-4" />
                  <span>Unsaved changes</span>
                </>
              )}
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save & Exit
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter a title for your entry..."
                value={diary.title}
                onChange={(e) => setDiary({ ...diary, title: e.target.value })}
                className="text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={diary.date}
                onChange={(e) => setDiary({ ...diary, date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <RichTextEditor
              content={diary.content}
              onChange={(content) => setDiary({ ...diary, content })}
              placeholder="Start writing your thoughts..."
            />
          </div>
        </div>
      </main>
    </div>
  );
}
