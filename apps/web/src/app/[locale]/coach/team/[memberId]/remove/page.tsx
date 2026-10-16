import { RemoveRoute } from "./remove-route";

export default function Page({ params }: PageProps<"/[locale]/coach/team/[memberId]/remove">) {
  return <RemoveRoute params={params} />;
}
