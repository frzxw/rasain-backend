import bcrypt from 'bcryptjs';
import { createClient } from '../config/database';

export async function ensureAccount(input: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: string;
}): Promise<{ id: string; email: string; name: string; created: boolean }> {
  const supabase = createClient();

  const { data: existing, error: lookupError } = await supabase
    .from('users')
    .select('id')
    .eq('email', input.email)
    .maybeSingle();

  if (lookupError) {
    throw lookupError;
  }

  if (existing?.id) {
    return { id: existing.id, email: input.email, name: input.name, created: false };
  }

  const metadata: Record<string, string> = { name: input.name };
  if (input.phone) {
    metadata.phone = input.phone;
  }
  if (input.role) {
    metadata.role = input.role;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: metadata
  });

  if (error || !data.user) {
    throw error ?? new Error(`Could not create account for ${input.email}`);
  }

  const id = data.user.id;
  const passwordHash = await bcrypt.hash(input.password, 12);

  const { error: userError } = await supabase.from('users').insert({
    id,
    email: input.email,
    password_hash: passwordHash,
    phone: input.phone ?? null,
    email_verified: true,
    phone_verified: false
  });

  if (userError) {
    await supabase.auth.admin.deleteUser(id);
    throw userError;
  }

  const { error: profileError } = await supabase.from('user_profiles').insert({
    id,
    name: input.name,
    saved_recipes_count: 0,
    posts_count: 0,
    is_notifications_enabled: true,
    language: 'id',
    is_dark_mode_enabled: false
  });

  if (profileError) {
    await supabase.from('users').delete().eq('id', id);
    await supabase.auth.admin.deleteUser(id);
    throw profileError;
  }

  return { id, email: input.email, name: input.name, created: true };
}
