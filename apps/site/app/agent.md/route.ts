import { agentGuide } from "../../lib/guides";
export const dynamic = "force-static";
export function GET() {
  return new Response(agentGuide, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
