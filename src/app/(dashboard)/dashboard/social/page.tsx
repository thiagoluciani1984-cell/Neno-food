import type { Metadata } from "next";
import { getSession } from "@/features/auth/get-session";
import { getRestaurantPosts, getRestaurantPostStats } from "@/features/social/queries";
import { DashboardPostsPage } from "@/features/social/components/dashboard-posts-page";

export const metadata: Metadata = {
  title: "Publicações | Dashboard",
};

export default async function SocialPage() {
  const { profile } = await getSession();

  const [posts, stats] = await Promise.all([
    getRestaurantPosts(),
    profile?.restaurant_id
      ? getRestaurantPostStats(profile.restaurant_id)
      : Promise.resolve({ totalPosts: 0, totalLikes: 0, totalComments: 0, totalSaves: 0 }),
  ]);

  return <DashboardPostsPage initialPosts={posts} stats={stats} />;
}
