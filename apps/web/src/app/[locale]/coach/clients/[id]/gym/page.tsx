import { GymRoute } from "./gym-route";

export default function Page({ params }: PageProps<"/[locale]/coach/clients/[id]/gym">) {
  return <GymRoute params={params} />;
}
