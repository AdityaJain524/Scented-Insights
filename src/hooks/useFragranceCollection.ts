import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface CollectionItem {
  id: string;
  post_id: string;
  collection_name: string;
  notes: string | null;
  created_at: string;
  post?: {
    fragrance_name: string;
    brand_name: string | null;
    image_url: string | null;
    post_type: string;
    longevity: number | null;
    projection: number | null;
  };
}

export function useFragranceCollection() {
  const { user } = useAuth();
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [collections, setCollections] = useState<string[]>(['My Collection']);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCollection = useCallback(async () => {
    if (!user) { setIsLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('fragrance_collection')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const collectionItems = data || [];
      
      // Fetch post details for each item
      if (collectionItems.length > 0) {
        const postIds = collectionItems.map(i => i.post_id);
        const { data: posts } = await supabase
          .from('fragrance_posts')
          .select('id, fragrance_name, brand_name, image_url, post_type, longevity, projection')
          .in('id', postIds);

        const postsMap = new Map((posts || []).map(p => [p.id, p]));
        collectionItems.forEach(item => {
          (item as CollectionItem).post = postsMap.get(item.post_id) || undefined;
        });
      }

      setItems(collectionItems as CollectionItem[]);
      
      // Extract unique collection names
      const names = [...new Set(collectionItems.map(i => i.collection_name))];
      setCollections(names.length > 0 ? names : ['My Collection']);
    } catch (error) {
      console.error('Error fetching collection:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCollection();
  }, [fetchCollection]);

  const addToCollection = useCallback(async (postId: string, collectionName = 'My Collection') => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('fragrance_collection')
        .insert({ user_id: user.id, post_id: postId, collection_name: collectionName });

      if (error) {
        if (error.code === '23505') {
          toast({ title: 'Already in collection', description: 'This fragrance is already saved.' });
          return;
        }
        throw error;
      }

      toast({ title: 'Added to collection! 💎', description: `Saved to "${collectionName}"` });
      fetchCollection();
    } catch (error) {
      console.error('Error adding to collection:', error);
      toast({ title: 'Error', description: 'Could not add to collection', variant: 'destructive' });
    }
  }, [user, fetchCollection]);

  const removeFromCollection = useCallback(async (itemId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('fragrance_collection')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) throw error;
      toast({ title: 'Removed from collection' });
      fetchCollection();
    } catch (error) {
      console.error('Error removing from collection:', error);
    }
  }, [user, fetchCollection]);

  const isInCollection = useCallback((postId: string) => {
    return items.some(i => i.post_id === postId);
  }, [items]);

  return { items, collections, isLoading, addToCollection, removeFromCollection, isInCollection, fetchCollection };
}
