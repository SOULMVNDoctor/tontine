import { requireParticipant } from "@/lib/serverAuth";
import { ParticipantPageClient } from "@/components/ParticipantPageClient";

export default async function Participant1Page() {
  await requireParticipant("p1");
  return <ParticipantPageClient slug="p1" title="Plateforme Participant 1" />;
}
