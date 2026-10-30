import { createFileRoute } from "@tanstack/react-router";
import { StompApp } from "@/components/stomp/app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <StompApp />;
}
