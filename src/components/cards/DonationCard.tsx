import { memo } from 'react';
import { DonationListing, CATEGORIES } from '@/lib/supabase-types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Clock, MessageCircle, Package } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DonationCardProps {
  listing: DonationListing;
  onContact?: (listing: DonationListing) => void;
  showActions?: boolean;
}

// Using React.memo to prevent unnecessary re-renders of the component
// if its props have not changed. This is particularly useful when the
// component is part of a list that might re-render frequently.
export const DonationCard = memo(({ listing, onContact, showActions = true }: DonationCardProps) => {
  const category = CATEGORIES.find(c => c.value === listing.category);
  const profile = listing.profiles;

  return (
    <Card className="overflow-hidden card-hover bg-card border-donation/20 hover:border-donation/40 group">
      {listing.image_url && (
        <div className="aspect-[4/3] overflow-hidden bg-donation-light">
          <img
            src={listing.image_url}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      {!listing.image_url && (
        <div className="aspect-[4/3] flex items-center justify-center bg-donation-light">
          <Package className="h-16 w-16 text-donation/40" />
        </div>
      )}
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display font-semibold text-lg line-clamp-1">{listing.title}</h3>
          <Badge variant="secondary" className="shrink-0 bg-donation-light text-donation-foreground">
            {category?.icon} {category?.label}
          </Badge>
        </div>
        
        {listing.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {listing.description}
          </p>
        )}
        
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {listing.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {listing.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
          </span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-donation/10 text-donation text-xs">
              {profile?.username?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{profile?.username || 'User'}</span>
        </div>
        
        {showActions && onContact && (
          <Button
            variant="donation-outline"
            size="sm"
            onClick={() => onContact(listing)}
          >
            <MessageCircle className="h-4 w-4" />
            Contact
          </Button>
        )}
      </CardFooter>
    </Card>
  );
});
