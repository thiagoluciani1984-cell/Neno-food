"use client";

import { motion } from "framer-motion";
import { staggerContainer, storyMotion } from "@/lib/motion/nenos-motion";
import type { FeedStory } from "../queries";
import { StoryAvatar } from "./story-avatar";

export function StoriesRow({ stories }: { stories: FeedStory[] }) {
  if (stories.length === 0) return null;

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="flex gap-3 overflow-x-auto px-4"
    >
      {stories.map((story) => (
        <motion.div key={story.id} variants={storyMotion}>
          <StoryAvatar story={story} />
        </motion.div>
      ))}
    </motion.div>
  );
}
