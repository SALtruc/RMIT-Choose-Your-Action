import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type GameSnapshot = {
  screen: string;
  avatarId: string | null;
  studentId: string;
  profile: {
    year: string;
    program: string;
    accessCode: string;
  };
  scenarioIndex: number;
  selectedChoiceId: string | null;
  choices: string[];
  updatedAt: string;
};

type RoomRecord = {
  code: string;
  host_id: string;
  state: GameSnapshot;
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const client: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const isRealtimeConfigured = Boolean(client);

export const generateRoomCode = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(3)))
    .map((n) => (n % 36).toString(36).toUpperCase())
    .join("");

export async function createRoom(snapshot: GameSnapshot) {
  if (!client) return { code: generateRoomCode(), remote: false };

  const code = generateRoomCode();
  const hostId = crypto.randomUUID();
  const { error } = await client
    .from("game_rooms")
    .insert({ code, host_id: hostId, state: snapshot satisfies GameSnapshot });

  if (error) throw error;
  localStorage.setItem("rmit-cya-host-id", hostId);
  return { code, remote: true };
}

export async function loadRoom(code: string) {
  if (!client) return null;

  const { data, error } = await client
    .from("game_rooms")
    .select("code, host_id, state")
    .eq("code", code.toUpperCase())
    .maybeSingle<RoomRecord>();

  if (error) throw error;
  return data?.state ?? null;
}

export async function saveRoom(code: string, snapshot: GameSnapshot) {
  if (!client) return;

  const hostId = localStorage.getItem("rmit-cya-host-id");
  const { error } = await client
    .from("game_rooms")
    .update({ state: snapshot, updated_at: new Date().toISOString() })
    .eq("code", code.toUpperCase())
    .eq("host_id", hostId ?? "");

  if (error) throw error;
}

export function subscribeToRoom(code: string, onChange: (snapshot: GameSnapshot) => void) {
  if (!client) return () => undefined;

  const channel: RealtimeChannel = client
    .channel(`room-${code}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "game_rooms",
        filter: `code=eq.${code.toUpperCase()}`,
      },
      (payload) => {
        const next = payload.new as RoomRecord;
        if (next.state) onChange(next.state);
      },
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}
