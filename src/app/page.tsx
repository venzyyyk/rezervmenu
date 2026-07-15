import { getVenues } from "@/server/menu";
import { HeroSection } from "@/components/client/HeroSection";

export default async function HomePage() {
  const venues = await getVenues();
  return <HeroSection venues={venues} />;
}
