import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { PostImageUploader } from '@/components/ImageUploader';
import { PenLine, BookOpen, GitCompare, GraduationCap, Plus, X, Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { occasions } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';

type PostType = 'review' | 'story' | 'comparison' | 'educational';

interface Note {
  name: string;
  type: 'top' | 'heart' | 'base';
}

export default function CreatePost() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [postType, setPostType] = useState<PostType>('review');
  const [fragranceName, setFragranceName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [newNoteType, setNewNoteType] = useState<'top' | 'heart' | 'base'>('top');
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [longevity, setLongevity] = useState([5]);
  const [projection, setProjection] = useState([5]);
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emotions = ['Luxurious', 'Confident', 'Magnetic', 'Fresh', 'Joyful', 'Nostalgic', 'Mysterious', 'Elegant', 'Powerful', 'Romantic', 'Cozy', 'Energizing'];

  if (!isAuthenticated || !user) {
    navigate('/login');
    return null;
  }

  const addNote = () => {
    if (newNote.trim()) {
      setNotes([...notes, { name: newNote.trim(), type: newNoteType }]);
      setNewNote('');
    }
  };

  const removeNote = (index: number) => {
    setNotes(notes.filter((_, i) => i !== index));
  };

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions(prev =>
      prev.includes(emotion)
        ? prev.filter(e => e !== emotion)
        : [...prev, emotion]
    );
  };

  const toggleOccasion = (occasion: string) => {
    setSelectedOccasions(prev =>
      prev.includes(occasion)
        ? prev.filter(o => o !== occasion)
        : [...prev, occasion]
    );
  };

  const handleSubmit = async () => {
    if (!fragranceName || !content) {
      toast({
        title: 'Missing information',
        description: 'Please fill in the fragrance name and your review.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the post
      const { data: postData, error: postError } = await supabase
        .from('fragrance_posts')
        .insert({
          author_id: user.id,
          post_type: postType,
          fragrance_name: fragranceName,
          brand_name: brandName || null,
          content,
          longevity: postType === 'review' ? longevity[0] : null,
          projection: postType === 'review' ? projection[0] : null,
          image_url: images.length > 0 ? images[0] : null,
        })
        .select()
        .single();

      if (postError) throw postError;

      const postId = postData.id;

      // Insert notes
      if (notes.length > 0) {
        const { error: notesError } = await supabase
          .from('fragrance_notes')
          .insert(notes.map(note => ({
            post_id: postId,
            name: note.name,
            note_type: note.type,
          })));
        if (notesError) throw notesError;
      }

      // Insert emotions
      if (selectedEmotions.length > 0) {
        const { error: emotionsError } = await supabase
          .from('post_emotions')
          .insert(selectedEmotions.map(emotion => ({
            post_id: postId,
            emotion,
          })));
        if (emotionsError) throw emotionsError;
      }

      // Insert occasions
      if (selectedOccasions.length > 0) {
        const { error: occasionsError } = await supabase
          .from('post_occasions')
          .insert(selectedOccasions.map(occasion => ({
            post_id: postId,
            occasion,
          })));
        if (occasionsError) throw occasionsError;
      }

      // Trigger AI note extraction in the background
      try {
        await supabase.functions.invoke('extract-notes', {
          body: {
            postId,
            content,
            fragranceName,
            brandName,
          },
        });
      } catch (aiError) {
        console.warn('AI extraction failed, continuing:', aiError);
        // Don't fail the post creation if AI extraction fails
      }

      toast({
        title: 'Post created!',
        description: 'Your fragrance post has been published.',
      });

      navigate('/feed');
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: error.message || 'Could not create post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const postTypes = [
    { id: 'review', label: 'Review', icon: PenLine, description: 'Share your thoughts on a fragrance' },
    { id: 'story', label: 'Scent Story', icon: BookOpen, description: 'Tell a personal fragrance memory' },
    { id: 'comparison', label: 'Comparison', icon: GitCompare, description: 'Compare two fragrances' },
    { id: 'educational', label: 'Educational', icon: GraduationCap, description: 'Share knowledge about notes or techniques' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6 px-4 max-w-3xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Create Post</h1>
          <p className="text-muted-foreground">Share your fragrance experience with the community</p>
        </div>

        {/* Post Type Selection */}
        <Card className="glass-card mb-6">
          <CardHeader>
            <CardTitle className="text-lg">What type of post?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {postTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setPostType(type.id as PostType)}
                  className={`p-4 rounded-xl border-2 text-left transition-all hover-lift ${
                    postType === type.id
                      ? 'border-primary bg-primary/5 shadow-amber'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <type.icon className={`h-5 w-5 mb-2 ${postType === type.id ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="font-medium text-sm">{type.label}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Fragrance Details */}
        <Card className="glass-card mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Fragrance Details</CardTitle>
            <CardDescription>Tell us about the fragrance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fragrance">Fragrance Name *</Label>
                <Input
                  id="fragrance"
                  placeholder="e.g., Baccarat Rouge 540"
                  value={fragranceName}
                  onChange={(e) => setFragranceName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  placeholder="e.g., Maison Francis Kurkdjian"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-3">
              <Label>Fragrance Notes</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNote())}
                  className="flex-1"
                />
                <Select value={newNoteType} onValueChange={(v) => setNewNoteType(v as 'top' | 'heart' | 'base')}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="heart">Heart</SelectItem>
                    <SelectItem value="base">Base</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={addNote}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {notes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {notes.map((note, index) => (
                    <Badge key={index} variant={note.type} className="gap-1.5 pr-1.5">
                      {note.name}
                      <button onClick={() => removeNote(index)} className="hover:bg-black/10 rounded">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Your Review */}
        <Card className="glass-card mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Your Review
              <Badge variant="secondary" className="font-normal">
                <Sparkles className="h-3 w-3 mr-1" />
                AI-assisted
              </Badge>
            </CardTitle>
            <CardDescription>Share your experience with this fragrance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Describe your experience with this fragrance. What does it smell like? How does it make you feel? When would you wear it?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[150px]"
            />

            {/* Emotions */}
            <div className="space-y-2">
              <Label>Emotions this fragrance evokes</Label>
              <div className="flex flex-wrap gap-2">
                {emotions.map((emotion) => (
                  <button
                    key={emotion}
                    onClick={() => toggleEmotion(emotion)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      selectedEmotions.includes(emotion)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    ✨ {emotion}
                  </button>
                ))}
              </div>
            </div>

            {/* Occasions */}
            <div className="space-y-2">
              <Label>Best occasions</Label>
              <div className="flex flex-wrap gap-2">
                {occasions.map((occasion) => (
                  <button
                    key={occasion.id}
                    onClick={() => toggleOccasion(occasion.id)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      selectedOccasions.includes(occasion.id)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {occasion.emoji} {occasion.name}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance */}
        {postType === 'review' && (
          <Card className="glass-card mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Performance</CardTitle>
              <CardDescription>Rate the fragrance's longevity and projection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Longevity</Label>
                  <span className="text-sm text-muted-foreground">{longevity[0]}/10</span>
                </div>
                <Slider
                  value={longevity}
                  onValueChange={setLongevity}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Short (1-2 hrs)</span>
                  <span>Very Long (12+ hrs)</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Projection</Label>
                  <span className="text-sm text-muted-foreground">{projection[0]}/10</span>
                </div>
                <Slider
                  value={projection}
                  onValueChange={setProjection}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Intimate</span>
                  <span>Beast Mode</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Image */}
        <Card className="glass-card mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Photos</CardTitle>
            <CardDescription>Add photos of the fragrance (optional)</CardDescription>
          </CardHeader>
          <CardContent>
            <PostImageUploader
              userId={user.id}
              images={images}
              onImagesChange={setImages}
              maxImages={4}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate('/feed')}>
            Cancel
          </Button>
          <Button variant="hero" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              'Publish Post'
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
