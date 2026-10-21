import { createFileRoute } from "@tanstack/react-router";
import { NutriGuardApp } from "@/components/nutriguard-app";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NutriGuard — Smart Food Ingredient Assistant" },
      { name: "description", content: "Scan food ingredients, understand what is inside, and make informed choices with NutriGuard." },
      { property: "og:title", content: "NutriGuard — Know what you eat" },
      { property: "og:description", content: "A simple, personalized food ingredient assistant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <NutriGuardApp />;
}
