import { DeclineRoute } from "./decline-route";

export default function Page({ params }: PageProps<"/[locale]/coach/requests/[id]/decline">) {
  return <DeclineRoute params={params} />;
}
