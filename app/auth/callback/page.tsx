import { Suspense } from "react";
import { OAuthCallbackClient } from "./oauth-callback-client";

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <OAuthCallbackClient />
    </Suspense>
  );
}
