import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFragranceCollection } from '@/hooks/useFragranceCollection';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Bookmark, Trash2, ExternalLink, Droplets } from 'lucide-react';

export default function Collection() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { items, collections, isLoading, removeFromCollection } = useFragranceCollection();
  const [activeCollection, setActiveCollection] = useState('My Collection');

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated]);

  const filteredItems = items.filter(i => i.collection_name === activeCollection);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 px-4 max-w-5xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-3">
            <Bookmark className="h-8 w-8 text-primary" />
            My Collection
          </h1>
          <p className="text-muted-foreground">
            {items.length} fragrances saved
          </p>
        </div>

        {collections.length > 1 && (
          <Tabs value={activeCollection} onValueChange={setActiveCollection} className="mb-6">
            <TabsList>
              {collections.map(name => (
                <TabsTrigger key={name} value={name}>{name}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        {filteredItems.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map(item => (
              <Card key={item.id} className="glass-card hover-lift overflow-hidden">
                {item.post?.image_url && (
                  <div className="h-32 bg-muted">
                    <img src={item.post.image_url} alt={item.post.fragrance_name} className="w-full h-full object-cover" />
                  </div>
                )}
                <CardContent className={item.post?.image_url ? 'pt-4' : 'pt-6'}>
                  <h3 className="font-semibold mb-1">{item.post?.fragrance_name || 'Unknown'}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{item.post?.brand_name || ''}</p>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    {item.post?.longevity && (
                      <span className="flex items-center gap-1">
                        <Droplets className="h-3 w-3" />
                        Longevity: {item.post.longevity}/10
                      </span>
                    )}
                    {item.post?.projection && (
                      <span>Proj: {item.post.projection}/10</span>
                    )}
                  </div>

                  <Badge variant="outline" className="text-xs mb-3">{item.post?.post_type}</Badge>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/feed`)}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCollection(item.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No fragrances saved yet</h3>
              <p className="text-muted-foreground mb-4">
                Save fragrances from the feed to build your collection
              </p>
              <Button onClick={() => navigate('/feed')} variant="hero">
                Explore Fragrances
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
