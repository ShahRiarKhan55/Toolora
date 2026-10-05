import { toggleFavoriteTool, useIsFavoriteTool } from '../../lib/toolPrefs';
import { Button } from '../ui/Button';
import { StarIcon } from '../ui/icons';

/** Adds or removes a tool from the favourites kept in this browser (slugs only, see lib/toolPrefs). */
export function FavoriteButton({ slug }: { slug: string }) {
  const favorite = useIsFavoriteTool(slug);
  return (
    <Button variant="secondary" onClick={() => toggleFavoriteTool(slug)}>
      <StarIcon filled={favorite} className="size-4" />
      {favorite ? 'Remove from favorites' : 'Add to favorites'}
    </Button>
  );
}
