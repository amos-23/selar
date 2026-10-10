import WalkthroughLoader from "@/components/exhibition/WalkthroughLoader";
import { buildWalkData } from "@/lib/exhibition/walk-data";

export const metadata = {
  title: { absolute: "Selar at 10 | The Gears of Creativity" },
  alternates: { canonical: "/exhibition" },
};

// One continuous 3D exhibition: the whole experience happens in this scene, with no page changes.
export default function Exhibition() {
  return <WalkthroughLoader data={buildWalkData()} />;
}
