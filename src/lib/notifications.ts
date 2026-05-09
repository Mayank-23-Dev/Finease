// src/lib/notifications.ts
// Talks to Supabase + Groq AI. firebase_uid is your user identifier.

import { createClient } from '@supabase/supabase-js';
import type { Notification, AlertRule, NotificationPrefs } from '../types/notifications';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;

// ─── NOTIFICATIONS CRUD ────────────────────────────────────────────────────────

export async function getNotifications(firebase_uid: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('firebase_uid', firebase_uid)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function createNotification(
  payload: Omit<Notification, 'id' | 'read' | 'created_at'>
): Promise<Notification | null> {
  const { data, error } = await supabase
    .from('notifications')
    .insert({ ...payload, read: false })
    .select()
    .single();
  if (error) { console.error('createNotification:', error); return null; }
  return data;
}

export async function markAsRead(id: string): Promise<void> {
  await supabase.from('notifications').update({ read: true }).eq('id', id);
}

export async function markAllRead(firebase_uid: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('firebase_uid', firebase_uid)
    .eq('read', false);
}

export async function deleteNotification(id: string): Promise<void> {
  await supabase.from('notifications').delete().eq('id', id);
}

export async function getUnreadCount(firebase_uid: string): Promise<number> {
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('firebase_uid', firebase_uid)
    .eq('read', false);
  return count ?? 0;
}

// ─── REALTIME SUBSCRIPTION ─────────────────────────────────────────────────────

export function subscribeToNotifications(
  firebase_uid: string,
  onNew: (n: Notification) => void
) {
  return supabase
    .channel(`notifications:${firebase_uid}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `firebase_uid=eq.${firebase_uid}`,
      },
      (payload) => onNew(payload.new as Notification)
    )
    .subscribe();
}

// ─── ALERT RULES CRUD ─────────────────────────────────────────────────────────

export async function getAlertRules(firebase_uid: string): Promise<AlertRule[]> {
  const { data, error } = await supabase
    .from('alert_rules')
    .select('*')
    .eq('firebase_uid', firebase_uid)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createAlertRule(
  rule: Omit<AlertRule, 'id' | 'created_at'>
): Promise<AlertRule | null> {
  const { data, error } = await supabase
    .from('alert_rules')
    .insert(rule)
    .select()
    .single();
  if (error) { console.error('createAlertRule:', error); return null; }
  return data;
}

export async function updateAlertRule(
  id: string,
  updates: Partial<AlertRule>
): Promise<void> {
  await supabase.from('alert_rules').update(updates).eq('id', id);
}

export async function deleteAlertRule(id: string): Promise<void> {
  await supabase.from('alert_rules').delete().eq('id', id);
}

// ─── ALERT EVALUATOR ──────────────────────────────────────────────────────────
// Call this whenever a transaction is added or budget is updated

export async function evaluateAlerts(
  firebase_uid: string,
  context: {
    transactionAmount?: number;
    transactionCategory?: string;
    budgetCategory?: string;
    budgetUsed?: number;
    budgetTotal?: number;
    currentBalance?: number;
  }
) {
  const rules = await getAlertRules(firebase_uid);

  for (const rule of rules.filter((r) => r.enabled)) {
    // Large transaction check
    if (
      rule.condition === 'large_transaction' &&
      context.transactionAmount &&
      rule.threshold &&
      context.transactionAmount >= rule.threshold
    ) {
      await createNotification({
        firebase_uid,
        type: 'transaction',
        title: '⚠️ Large Transaction Detected',
        message: `A transaction of ₹${context.transactionAmount.toLocaleString('en-IN')} was recorded${context.transactionCategory ? ` in ${context.transactionCategory}` : ''}.`,
        metadata: { rule_id: rule.id, amount: context.transactionAmount },
      });
    }

    // Budget exceed check
    if (
      rule.condition === 'budget_exceed' &&
      context.budgetUsed !== undefined &&
      context.budgetTotal &&
      rule.threshold
    ) {
      const pct = (context.budgetUsed / context.budgetTotal) * 100;
      if (pct >= rule.threshold) {
        await createNotification({
          firebase_uid,
          type: 'budget_alert',
          title: pct >= 100 ? '🚨 Budget Exceeded!' : '⚠️ Budget Warning',
          message: `You've used ${pct.toFixed(0)}% of your ${context.budgetCategory ?? 'total'} budget (₹${context.budgetUsed.toLocaleString('en-IN')} of ₹${context.budgetTotal.toLocaleString('en-IN')}).`,
          metadata: { rule_id: rule.id, percent: pct, category: context.budgetCategory },
        });
      }
    }

    // Low balance check
    if (
      rule.condition === 'low_balance' &&
      context.currentBalance !== undefined &&
      rule.threshold &&
      context.currentBalance <= rule.threshold
    ) {
      await createNotification({
        firebase_uid,
        type: 'system',
        title: '💰 Low Balance Alert',
        message: `Your balance has dropped to ₹${context.currentBalance.toLocaleString('en-IN')}, below your alert threshold of ₹${rule.threshold.toLocaleString('en-IN')}.`,
        metadata: { rule_id: rule.id, balance: context.currentBalance },
      });
    }
  }
}

// ─── GROQ AI INSIGHT GENERATOR ────────────────────────────────────────────────
// Uses llama-3.1-8b-instant (fast) for transaction analysis

export async function generateAIInsight(
  firebase_uid: string,
  transactions: Array<{ amount: number; category: string; type: string; date: string }>,
  budgets: Array<{ category: string; amount: number; month: string }>
): Promise<void> {
  if (!GROQ_KEY || transactions.length === 0) return;

  // Avoid duplicate insights — check if one was already created today
  const today = new Date().toISOString().split('T')[0];
  const { data: existing } = await supabase
    .from('notifications')
    .select('id')
    .eq('firebase_uid', firebase_uid)
    .eq('type', 'ai_insight')
    .gte('created_at', `${today}T00:00:00Z`)
    .limit(1);

  if (existing && existing.length > 0) return;

  try {
    const spendByCategory: Record<string, number> = {};
    transactions.forEach((t) => {
      if (t.type === 'debit' || t.type === 'expense') {
        spendByCategory[t.category] = (spendByCategory[t.category] ?? 0) + t.amount;
      }
    });

    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 100,
        temperature: 0.4,
        messages: [
          {
            role: 'system',
            content:
              'You are a concise financial assistant for Indian users. Given spending data, give ONE specific, actionable financial tip in 1-2 sentences. Use ₹ for currency. No markdown, no preamble.',
          },
          {
            role: 'user',
            content: `Spending this month by category (₹): ${JSON.stringify(spendByCategory)}. Budget limits: ${JSON.stringify(budgets.map((b) => ({ category: b.category, limit: b.amount })))}. Give me one actionable insight.`,
          },
        ],
      }),
    });

    const json = await res.json();
    const insight = json.choices?.[0]?.message?.content?.trim();

    if (insight) {
      await createNotification({
        firebase_uid,
        type: 'ai_insight',
        title: '🤖 AI Spending Insight',
        message: insight,
        metadata: { model: 'llama-3.1-8b-instant', spend_data: spendByCategory },
      });
    }
  } catch (err) {
    console.error('Groq AI insight error:', err);
  }
}

// ─── NOTIFICATION PREFS ────────────────────────────────────────────────────────

export async function getNotificationPrefs(
  firebase_uid: string
): Promise<NotificationPrefs | null> {
  const { data } = await supabase
    .from('notification_prefs')
    .select('*')
    .eq('firebase_uid', firebase_uid)
    .single();
  return data;
}

export async function upsertNotificationPrefs(
  firebase_uid: string,
  prefs: Partial<NotificationPrefs>
): Promise<void> {
  await supabase.from('notification_prefs').upsert(
    { ...prefs, firebase_uid, updated_at: new Date().toISOString() },
    { onConflict: 'firebase_uid' }
  );
}