import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/layout/Header';
import { AvatarUploader } from '@/components/ImageUploader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Save, X } from 'lucide-react';

const FRAGRANCE_FAMILIES = [
  'Floral', 'Oriental', 'Woody', 'Fresh', 'Aromatic', 'Citrus', 'Gourmand', 'Chypre', 'Fougère', 'Aquatic'
];

const OCCASIONS = [
  'Daily Wear', 'Office', 'Date Night', 'Special Occasion', 'Summer', 'Winter', 'Evening', 'Casual'
];

export default function EditProfile() {
  const { user, isLoading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [sustainabilityInterest, setSustainabilityInterest] = useState(false);
  const [selectedFamilies, setSelectedFamilies] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);

  useEffect(() => {
    if (user?.profile) {
      setDisplayName(user.profile.display_name || '');
      setUsername(user.profile.username || '');
      setBio(user.profile.bio || '');
      setLocation(user.profile.location || '');
      setAvatarUrl(user.profile.avatar_url);
      setSustainabilityInterest(user.profile.interested_in_sustainability || false);
    }

    if (user?.interests) {
      const families = user.interests
        .filter(i => i.interest_type === 'fragrance_family')
        .map(i => i.interest_value);
      const occasions = user.interests
        .filter(i => i.interest_type === 'occasion')
        .map(i => i.interest_value);
      setSelectedFamilies(families);
      setSelectedOccasions(occasions);
    }
  }, [user]);

  const toggleFamily = (family: string) => {
    setSelectedFamilies(prev =>
      prev.includes(family) ? prev.filter(f => f !== family) : [...prev, family]
    );
  };

  const toggleOccasion = (occasion: string) => {
    setSelectedOccasions(prev =>
      prev.includes(occasion) ? prev.filter(o => o !== occasion) : [...prev, occasion]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    setIsLoading(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
          bio,
          location,
          avatar_url: avatarUrl,
          interested_in_sustainability: sustainabilityInterest,
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Update interests - delete old and insert new
      await supabase
        .from('user_interests')
        .delete()
        .eq('user_id', user.id);

      const interestInserts = [
        ...selectedFamilies.map(family => ({
          user_id: user.id,
          interest_type: 'fragrance_family',
          interest_value: family,
        })),
        ...selectedOccasions.map(occasion => ({
          user_id: user.id,
          interest_type: 'occasion',
          interest_value: occasion,
        })),
      ];

      if (interestInserts.length > 0) {
        const { error: interestsError } = await supabase
          .from('user_interests')
          .insert(interestInserts);

        if (interestsError) throw interestsError;
      }

      await refreshProfile();

      toast({
        title: 'Profile updated',
        description: 'Your profile has been saved successfully.',
      });

      navigate('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Could not update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6 px-4 max-w-2xl">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/profile')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </Button>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>
                Upload a photo to help others recognize you
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <AvatarUploader
                currentUrl={avatarUrl}
                userId={user.id}
                displayName={displayName}
                onUploadComplete={setAvatarUrl}
                size="lg"
              />
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="flex items-center">
                  <span className="text-muted-foreground mr-1">@</span>
                  <Input
                    id="username"
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="username"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Tell the community about your fragrance journey..."
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {bio.length}/500
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="City, Country"
                />
              </div>
            </CardContent>
          </Card>

          {/* Fragrance Interests */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Fragrance Interests</CardTitle>
              <CardDescription>
                Select the fragrance families you love
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {FRAGRANCE_FAMILIES.map(family => (
                  <Badge
                    key={family}
                    variant={selectedFamilies.includes(family) ? 'default' : 'outline'}
                    className="cursor-pointer transition-colors"
                    onClick={() => toggleFamily(family)}
                  >
                    {selectedFamilies.includes(family) && '✓ '}
                    {family}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Occasion Preferences */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Occasion Preferences</CardTitle>
              <CardDescription>
                When do you typically wear fragrances?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {OCCASIONS.map(occasion => (
                  <Badge
                    key={occasion}
                    variant={selectedOccasions.includes(occasion) ? 'default' : 'outline'}
                    className="cursor-pointer transition-colors"
                    onClick={() => toggleOccasion(occasion)}
                  >
                    {selectedOccasions.includes(occasion) && '✓ '}
                    {occasion}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sustainability */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Sustainability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Interested in sustainable fragrances</p>
                  <p className="text-sm text-muted-foreground">
                    Show me eco-friendly and ethical fragrance options
                  </p>
                </div>
                <Switch
                  checked={sustainabilityInterest}
                  onCheckedChange={setSustainabilityInterest}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/profile')}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" variant="hero" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
