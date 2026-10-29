import { proxySotraApi } from "@/lib/sotra-api";

export async function GET(): Promise<Response> {
  return proxySotraApi("api/dashboard/status");
}
