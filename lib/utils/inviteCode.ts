const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no O, 0, I, 1

function randomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

/**
 * Generate a unique 6-char invite code, checking DB for collisions.
 */
export async function generateInviteCode(supabase: any): Promise<string> {
  let attempts = 0;
  while (attempts < 20) {
    const code = randomCode();
    const { data } = await supabase
      .from('property_invites')
      .select('id')
      .eq('code', code)
      .maybeSingle();
    if (!data) return code;
    attempts++;
  }
  throw new Error('Could not generate unique invite code after 20 attempts');
}

/**
 * Format a 6-char code as "XXX · XXX"
 */
export function formatCode(code: string): string {
  return `${code.slice(0, 3)} · ${code.slice(3)}`;
}
