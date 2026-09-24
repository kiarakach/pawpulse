// ============================================================================
// base44Client.js  —  Supabase-backed drop-in replacement for the Base44 SDK.
//
// Exposes the SAME shapes the app already calls, so components don't change:
//   base44.auth.{me,updateMe,logout,redirectToLogin,loginWithProvider,
//                loginViaEmailPassword,register,verifyOtp,resendOtp,setToken,
//                resetPasswordRequest,resetPassword}
//   base44.entities.<Name>.{list,filter,create,update,delete,deleteMany,
//                           bulkCreate,subscribe}
//   base44.integrations.Core.{UploadFile,InvokeLLM,GenerateImage,SendPushNotification}
//   base44.functions.invoke(name, args)
//
// Backend calls (InvokeLLM / GenerateImage / SendPushNotification / functions)
// are routed to Supabase Edge Functions (built in Step 7).
// ============================================================================
import { supabase } from '@/lib/supabaseClient';

const STORAGE_BUCKET = 'uploads';

// Base44 entity name  ->  Postgres table name
const TABLE = {
  Pet: 'pets',
  User: 'profiles',
  HealthLog: 'health_logs',
  DietLog: 'diet_logs',
  Reminder: 'reminders',
  Routine: 'routines',
  Vaccination: 'vaccinations',
  CommunityPost: 'community_posts',
  Order: 'orders',
  Product: 'products',
  ServiceBooking: 'service_bookings',
  StreakAction: 'streak_actions',
  StreakBadge: 'streak_badges',
  WishlistItem: 'wishlist_items',
  RoomDesign: 'room_designs',
};

function parseOrder(order) {
  // Base44 order syntax: 'field' (asc) or '-field' (desc). Default: -created_date
  const o = order || '-created_date';
  const desc = o.startsWith('-');
  return { column: desc ? o.slice(1) : o, ascending: !desc };
}

function throwIf(error) {
  if (error) throw Object.assign(new Error(error.message), { status: error.status, details: error });
}

function makeEntity(name) {
  const table = TABLE[name];
  if (!table) throw new Error(`Unknown entity: ${name}`);

  return {
    async list(order, limit) {
      const { column, ascending } = parseOrder(order);
      let q = supabase.from(table).select('*').order(column, { ascending });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      throwIf(error);
      return data || [];
    },

    async filter(query = {}, order, limit) {
      const { column, ascending } = parseOrder(order);
      let q = supabase.from(table).select('*');
      for (const [k, v] of Object.entries(query)) {
        q = Array.isArray(v) ? q.in(k, v) : q.eq(k, v);
      }
      q = q.order(column, { ascending });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      throwIf(error);
      return data || [];
    },

    async get(id) {
      const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
      throwIf(error);
      return data;
    },

    async create(values) {
      // created_by_id is filled by the column default (auth.uid()) under RLS.
      const { data, error } = await supabase.from(table).insert(values).select().single();
      throwIf(error);
      return data;
    },

    async bulkCreate(items) {
      const { data, error } = await supabase.from(table).insert(items).select();
      throwIf(error);
      return data || [];
    },

    async update(id, values) {
      const { data, error } = await supabase.from(table).update(values).eq('id', id).select().single();
      throwIf(error);
      return data;
    },

    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      throwIf(error);
      return { id };
    },

    async deleteMany(query = {}) {
      let q = supabase.from(table).delete();
      for (const [k, v] of Object.entries(query)) {
        q = Array.isArray(v) ? q.in(k, v) : q.eq(k, v);
      }
      const { error } = await q;
      throwIf(error);
      return { ok: true };
    },

    // Base44 realtime: invoke callback on any change to the table.
    subscribe(callback) {
      const channel = supabase
        .channel(`realtime:${table}:${Math.random().toString(36).slice(2)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
          try { callback(payload); } catch (e) { console.error(e); }
        })
        .subscribe();
      return () => supabase.removeChannel(channel);
    },
  };
}

const entities = Object.keys(TABLE).reduce((acc, name) => {
  acc[name] = makeEntity(name);
  return acc;
}, {});

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
async function currentUserWithProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { const e = new Error('Not authenticated'); e.status = 401; throw e; }
  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();
  return {
    id: user.id,
    email: user.email,
    role: profile?.role || 'user',
    display_name: profile?.display_name || user.user_metadata?.full_name || null,
    contact_email: profile?.contact_email || null,
    contact_phone: profile?.contact_phone || null,
    created_date: profile?.created_date,
  };
}

const auth = {
  me: () => currentUserWithProfile(),

  async updateMe(values) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { const e = new Error('Not authenticated'); e.status = 401; throw e; }
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...values }, { onConflict: 'id' })
      .select().single();
    throwIf(error);
    return data;
  },

  async loginViaEmailPassword(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    throwIf(error);
    return data;
  },

  loginWithProvider(provider, returnTo) {
    const redirectTo = returnTo || window.location.origin;
    return supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
  },

  async register({ email, password }) {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin },
    });
    throwIf(error);
    return data;
  },

  async verifyOtp({ email, otpCode }) {
    const { data, error } = await supabase.auth.verifyOtp({ email, token: otpCode, type: 'email' });
    throwIf(error);
    return { access_token: data?.session?.access_token, ...data };
  },

  async resendOtp(email) {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    throwIf(error);
    return { ok: true };
  },

  // Supabase manages the session token itself; kept for call-site compatibility.
  setToken(_accessToken) { /* no-op: session persisted by supabase-js */ },

  async resetPasswordRequest(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    throwIf(error);
    return { ok: true };
  },

  // On the recovery redirect, supabase-js has already created a session
  // (detectSessionInUrl), so we just set the new password. resetToken unused.
  async resetPassword({ newPassword }) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    throwIf(error);
    return { ok: true };
  },

  async logout(redirectUrl) {
    await supabase.auth.signOut();
    if (redirectUrl) window.location.href = '/login';
  },

  redirectToLogin(returnTo) {
    const rt = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : '';
    window.location.href = `/login${rt}`;
  },
};

// ---------------------------------------------------------------------------
// Integrations (Core) — routed to Supabase Edge Functions (Step 7)
// ---------------------------------------------------------------------------
async function invokeFn(name, args) {
  const { data, error } = await supabase.functions.invoke(name, { body: args || {} });
  if (error) throw Object.assign(new Error(error.message), { status: error.status, details: error });
  return data;
}

const integrations = {
  Core: {
    async UploadFile({ file }) {
      const { data: { user } } = await supabase.auth.getUser();
      const path = `${user?.id || 'anon'}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
        cacheControl: '3600', upsert: false,
      });
      throwIf(error);
      const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      return { file_url: data.publicUrl };
    },
    InvokeLLM: (args) => invokeFn('invoke-llm', args),
    GenerateImage: (args) => invokeFn('generate-image', args),
    SendPushNotification: (args) => invokeFn('send-push', args),
  },
};

// ---------------------------------------------------------------------------
// Backend functions:  base44.functions.invoke(name, args)
// ---------------------------------------------------------------------------
const functions = {
  invoke: (name, args) => invokeFn(name, args),
};

export const base44 = { auth, entities, integrations, functions };
export default base44;
