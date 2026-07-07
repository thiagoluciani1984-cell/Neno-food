import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { FeedStory } from "../queries";

export function StoryAvatar({ story }: { story: FeedStory }) {
  const { restaurant } = story;
  const imageUrl = story.preview_url ?? restaurant.logo_url;

  return (
    <Link
      href={`/${restaurant.slug}`}
      className="flex w-[76px] shrink-0 flex-col items-center gap-1.5"
    >
      <div className="animate-nenos-story-ring rounded-full bg-nenos-gradient p-[3px]">
        <div className="rounded-full bg-white p-[3px]">
          <Avatar className="h-14 w-14">
            {imageUrl ? (
              <AvatarImage src={imageUrl} alt={restaurant.name} />
            ) : null}
            <AvatarFallback className="text-sm font-bold">
              {restaurant.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
      <span className="max-w-[72px] truncate text-center text-[11px] font-semibold text-stone-900">
        {restaurant.name}
      </span>
    </Link>
  );
}
