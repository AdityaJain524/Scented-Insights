import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Search, Plus, X, ArrowLeftRight, Droplets, Volume2 } from 'lucide-react';

interface ComparablePost {
  id: string;
  fragrance_name: string;
  brand_name: string | null;
  longevity: number | null;
  projection: number | null;
  likes_count: number;
  credibility_rating: number;
  image_url: string | null;
  post_type: string;
  notes: Array<{ name: string; note_type: string }>;
  emotions: string[];
}

export default function Compare() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ComparablePost[]>([]);
  const [selected, setSelected] = useState<ComparablePost[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchFragrances = async (query: string) => {
    if (!query.trim()) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('fragrance_posts')
        .select('id, fragrance_name, brand_name, longevity, projection, likes_count, credibility_rating, image_url, post_type')
        .or(`fragrance_name.ilike.%${query}%,brand_name.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;

      // Enrich with notes and emotions
      const enriched = await Promise.all(
        (data || []).map(async (post) => {
          const [notesRes, emotionsRes] = await Promise.all([
            supabase.from('fragrance_notes').select('name, note_type').eq('post_id', post.id),
            supabase.from('post_emotions').select('emotion').eq('post_id', post.id),
          ]);
          return {
            ...post,
            notes: notesRes.data || [],
            emotions: (emotionsRes.data || []).map(e => e.emotion),
          };
        })
      );

      setSearchResults(enriched);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => searchFragrances(searchQuery), 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const addToCompare = (post: ComparablePost) => {
    if (selected.length >= 3) return;
    if (selected.some(s => s.id === post.id)) return;
    setSelected(prev => [...prev, post]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeFromCompare = (id: string) => {
    setSelected(prev => prev.filter(s => s.id !== id));
  };

  const getSharedNotes = () => {
    if (selected.length < 2) return [];
    const noteSets = selected.map(s => new Set(s.notes.map(n => n.name.toLowerCase())));
    const shared: string[] = [];
    noteSets[0].forEach(note => {
      if (noteSets.every(set => set.has(note))) shared.push(note);
    });
    return shared;
  };

  const getUniqueNotes = (post: ComparablePost) => {
    const otherNotes = new Set(
      selected
        .filter(s => s.id !== post.id)
        .flatMap(s => s.notes.map(n => n.name.toLowerCase()))
    );
    return post.notes.filter(n => !otherNotes.has(n.name.toLowerCase()));
  };

  const sharedNotes = getSharedNotes();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-3">
            <ArrowLeftRight className="h-8 w-8 text-primary" />
            Compare Fragrances
          </h1>
          <p className="text-muted-foreground">
            Compare up to 3 fragrances side by side
          </p>
        </div>

        {/* Search to add */}
        {selected.length < 3 && (
          <div className="mb-6 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search fragrances to compare..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchResults.length > 0 && (
              <Card className="absolute z-10 w-full mt-1 max-h-64 overflow-auto">
                <CardContent className="p-2">
                  {searchResults.map(post => (
                    <button
                      key={post.id}
                      onClick={() => addToCompare(post)}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-muted flex items-center justify-between"
                      disabled={selected.some(s => s.id === post.id)}
                    >
                      <div>
                        <p className="font-medium text-sm">{post.fragrance_name}</p>
                        <p className="text-xs text-muted-foreground">{post.brand_name}</p>
                      </div>
                      <Plus className="h-4 w-4 text-primary" />
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Selected slots */}
        {selected.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <ArrowLeftRight className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No fragrances selected</h3>
              <p className="text-muted-foreground">Search and add up to 3 fragrances to compare</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Comparison Grid */}
            <div className={`grid gap-4 ${selected.length === 1 ? 'grid-cols-1 max-w-md' : selected.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {selected.map(post => (
                <Card key={post.id} className="glass-card">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{post.fragrance_name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{post.brand_name}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeFromCompare(post.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Longevity */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="flex items-center gap-1"><Droplets className="h-3 w-3" /> Longevity</span>
                        <span className="font-medium">{post.longevity || '—'}/10</span>
                      </div>
                      <Progress value={(post.longevity || 0) * 10} className="h-2" />
                    </div>

                    {/* Projection */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="flex items-center gap-1"><Volume2 className="h-3 w-3" /> Projection</span>
                        <span className="font-medium">{post.projection || '—'}/10</span>
                      </div>
                      <Progress value={(post.projection || 0) * 10} className="h-2" />
                    </div>

                    {/* Credibility */}
                    <div className="flex items-center justify-between text-sm">
                      <span>Credibility</span>
                      <Badge variant="outline">{post.credibility_rating}%</Badge>
                    </div>

                    {/* Likes */}
                    <div className="flex items-center justify-between text-sm">
                      <span>Likes</span>
                      <span className="font-medium">{post.likes_count}</span>
                    </div>

                    {/* Notes by type */}
                    {['top', 'heart', 'base'].map(type => {
                      const typeNotes = post.notes.filter(n => n.note_type === type);
                      if (typeNotes.length === 0) return null;
                      return (
                        <div key={type}>
                          <p className="text-xs font-medium text-muted-foreground mb-1 capitalize">{type} Notes</p>
                          <div className="flex flex-wrap gap-1">
                            {typeNotes.map(n => (
                              <Badge key={n.name} variant={sharedNotes.includes(n.name.toLowerCase()) ? 'default' : 'outline'} className="text-xs">
                                {n.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {/* Emotions */}
                    {post.emotions.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Emotions</p>
                        <div className="flex flex-wrap gap-1">
                          {post.emotions.map(e => (
                            <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Shared Notes Summary */}
            {selected.length >= 2 && sharedNotes.length > 0 && (
              <Card className="glass-card border-primary/20">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3">Shared Notes</h3>
                  <div className="flex flex-wrap gap-2">
                    {sharedNotes.map(note => (
                      <Badge key={note} className="capitalize">{note}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Unique Notes */}
            {selected.length >= 2 && (
              <Card className="glass-card">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3">Unique Notes</h3>
                  <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selected.length}, 1fr)` }}>
                    {selected.map(post => {
                      const unique = getUniqueNotes(post);
                      return (
                        <div key={post.id}>
                          <p className="text-sm font-medium mb-2">{post.fragrance_name}</p>
                          <div className="flex flex-wrap gap-1">
                            {unique.length > 0 ? unique.map(n => (
                              <Badge key={n.name} variant="outline" className="text-xs">{n.name}</Badge>
                            )) : (
                              <span className="text-xs text-muted-foreground">No unique notes</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
