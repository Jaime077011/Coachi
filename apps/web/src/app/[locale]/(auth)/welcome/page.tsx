import { Suspense } from "react";
import { WelcomeScreen } from "./welcome-screen";

/** First login: his name, then on to the directory (or the intake form after an invite). */
export default function Page() {
  return (
    <Suspense fallback={null}>
      <WelcomeScreen />
    </Suspense>
  );
}
