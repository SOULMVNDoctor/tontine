import { requireParticipant } from "@/lib/serverAuth";
import { ParticipantPageClient } from "@/components/ParticipantPageClient";

export default async function Participant2Page() {
  await requireParticipant("p2");
  return <ParticipantPageClient slug="p2" title="Plateforme Participant 2" />;
}
