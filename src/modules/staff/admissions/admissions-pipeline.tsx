"use client";

import { type FormEvent, useMemo, useState } from "react";

import type { StaffApiFailure, StaffApiSuccess } from "../shared/api";
import styles from "../shared/staff-portal.module.css";
import type { LeadSummary } from "./repository";
import { clearResolvedDuplicate } from "./lead-state";
import { allowedLeadTransitions, leadStageLabels, leadStages, type LeadStage } from "./stages";

type ActionState = { kind: "error" | "success"; message: string } | null;

async function send<T>(url: string, method: "PATCH" | "POST", body: unknown): Promise<T> {
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method,
  });
  const payload = (await response.json()) as StaffApiFailure | StaffApiSuccess<T>;
  if (!response.ok || !("data" in payload)) {
    throw new Error(
      "error" in payload ? payload.error.message : "The request could not be completed.",
    );
  }
  return payload.data;
}

function formatDate(value: string | null) {
  if (!value) return "No date set";
  return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" }).format(
    new Date(value),
  );
}

function leadLabel(lead: LeadSummary) {
  return `${lead.firstName} ${lead.lastName ?? ""}`.trim();
}

function LeadCard({
  allLeads,
  canReviewDuplicates,
  canUpdate,
  lead,
  onChange,
  onDuplicateResolved,
}: {
  allLeads: readonly LeadSummary[];
  canReviewDuplicates: boolean;
  canUpdate: boolean;
  lead: LeadSummary;
  onChange: (lead: LeadSummary) => void;
  onDuplicateResolved: (duplicateId: string, leadId: string, candidateLeadId: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<ActionState>(null);

  async function run(action: () => Promise<void>, success: string) {
    setBusy(true);
    setStatus(null);
    try {
      await action();
      setStatus({ kind: "success", message: success });
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "The request could not be completed.",
      });
    } finally {
      setBusy(false);
    }
  }

  function move(toStage: LeadStage) {
    void run(async () => {
      const result = await send<{ id: string; stage: LeadStage; version: number }>(
        `/api/staff/leads/${lead.id}/stage-transitions`,
        "POST",
        { reason: `Moved to ${leadStageLabels[toStage]}`, toStage, version: lead.version },
      );
      onChange({
        ...lead,
        stage: result.stage,
        updatedAt: new Date().toISOString(),
        version: result.version,
      });
    }, `Moved to ${leadStageLabels[toStage]}.`);
  }

  function addActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    void run(async () => {
      await send(`/api/staff/leads/${lead.id}/activities`, "POST", {
        outcome: data.get("outcome") || null,
        safeNote: data.get("safeNote"),
        type: data.get("type"),
      });
      onChange({ ...lead, lastActivityAt: new Date().toISOString() });
      form.reset();
    }, "Activity recorded.");
  }

  function addFollowUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const dueAt = String(data.get("dueAt"));
    void run(async () => {
      await send(`/api/staff/leads/${lead.id}/follow-ups`, "POST", {
        dueAt: new Date(dueAt).toISOString(),
      });
      onChange({ ...lead, openFollowUps: lead.openFollowUps + 1 });
      form.reset();
    }, "Follow-up scheduled.");
  }

  function flagDuplicate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const candidateLeadId = String(data.get("candidateLeadId"));
    void run(async () => {
      const result = await send<{ id: string; state: "pending" }>(
        `/api/staff/leads/${lead.id}/duplicates`,
        "POST",
        { candidateLeadId, signals: ["name", "guardian"] },
      );
      onChange({
        ...lead,
        duplicateCount: lead.duplicateCount + 1,
        pendingDuplicates: [
          ...lead.pendingDuplicates,
          { candidateLeadId, id: result.id, signals: ["name", "guardian"] },
        ],
      });
      form.reset();
    }, "Lead flagged for review. No records were merged.");
  }

  function reviewDuplicate(duplicateId: string, state: "duplicate_confirmed" | "not_duplicate") {
    const duplicate = lead.pendingDuplicates.find((item) => item.id === duplicateId);
    if (!duplicate) {
      setStatus({
        kind: "error",
        message: "This review is no longer available. Refresh the page.",
      });
      return;
    }

    void run(
      async () => {
        await send(`/api/staff/leads/${lead.id}/duplicates/${duplicateId}`, "PATCH", { state });
        onDuplicateResolved(duplicateId, lead.id, duplicate.candidateLeadId);
      },
      state === "duplicate_confirmed"
        ? "Duplicate confirmed; records remain separate."
        : "Marked as distinct records.",
    );
  }

  return (
    <article className={styles.leadCard}>
      <div className={styles.leadCardTopline}>
        <span>{lead.id.replace("lead-", "#")}</span>
        <span lang={lead.preferredLocale}>{lead.preferredLocale.toUpperCase()}</span>
      </div>
      <h3>{leadLabel(lead)}</h3>
      <p className={styles.leadMeta}>
        Grade {lead.gradeInterest} · {lead.source.replaceAll("_", " ")}
      </p>
      <dl className={styles.leadFacts}>
        <div>
          <dt>Next action</dt>
          <dd>{formatDate(lead.dueAt)}</dd>
        </div>
        <div>
          <dt>Owner</dt>
          <dd>{lead.ownerName?.replace(/^Dev /, "") ?? "Unassigned"}</dd>
        </div>
      </dl>
      <div className={styles.cardSignals}>
        {lead.openFollowUps > 0 ? <span>{lead.openFollowUps} follow-up</span> : null}
        {lead.duplicateCount > 0 ? (
          <span className={styles.warningChip}>{lead.duplicateCount} review</span>
        ) : null}
      </div>

      {canUpdate && allowedLeadTransitions[lead.stage].length > 0 ? (
        <div className={styles.transitionActions}>
          {allowedLeadTransitions[lead.stage].map((stage) => (
            <button disabled={busy} key={stage} onClick={() => move(stage)} type="button">
              {stage === "closed_not_proceeding" ? "Close" : `Move to ${leadStageLabels[stage]}`}
            </button>
          ))}
        </div>
      ) : null}

      {canUpdate || canReviewDuplicates ? (
        <details className={styles.cardDetails}>
          <summary>
            Record work <span aria-hidden="true">＋</span>
          </summary>
          {canUpdate ? (
            <>
              <form className={styles.compactForm} onSubmit={addActivity}>
                <strong>Add family activity</strong>
                <label>
                  Contact type
                  <select defaultValue="call" name="type">
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                    <option value="text">Text</option>
                    <option value="meeting">Meeting</option>
                    <option value="note">Internal note</option>
                  </select>
                </label>
                <label>
                  Safe note
                  <textarea maxLength={1000} name="safeNote" required rows={2} />
                </label>
                <label>
                  Outcome (optional)
                  <input maxLength={160} name="outcome" />
                </label>
                <button disabled={busy} type="submit">
                  Record activity
                </button>
              </form>
              <form className={styles.compactForm} onSubmit={addFollowUp}>
                <strong>Schedule follow-up</strong>
                <label>
                  Due date and time
                  <input name="dueAt" required type="datetime-local" />
                </label>
                <button disabled={busy} type="submit">
                  Schedule
                </button>
              </form>
            </>
          ) : null}
          {canReviewDuplicates ? (
            <form className={styles.compactForm} onSubmit={flagDuplicate}>
              <strong>Flag a possible duplicate</strong>
              <label>
                Compare with
                <select defaultValue="" name="candidateLeadId" required>
                  <option disabled value="">
                    Select a lead
                  </option>
                  {allLeads
                    .filter((item) => item.id !== lead.id)
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {leadLabel(item)} · {item.id}
                      </option>
                    ))}
                </select>
              </label>
              <button disabled={busy} type="submit">
                Flag only—do not merge
              </button>
            </form>
          ) : null}
          {canReviewDuplicates && lead.pendingDuplicates.length > 0 ? (
            <div className={styles.duplicateList}>
              <strong>Pending comparison</strong>
              {lead.pendingDuplicates.map((duplicate) => (
                <div key={duplicate.id}>
                  <span>
                    {duplicate.candidateLeadId} · {duplicate.signals.join(", ")}
                  </span>
                  <button
                    disabled={busy}
                    onClick={() => reviewDuplicate(duplicate.id, "not_duplicate")}
                    type="button"
                  >
                    Distinct
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => reviewDuplicate(duplicate.id, "duplicate_confirmed")}
                    type="button"
                  >
                    Confirm flag
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </details>
      ) : (
        <p className={styles.readOnlyNote}>View only</p>
      )}

      {status ? (
        <p
          aria-live="polite"
          className={status.kind === "error" ? styles.errorMessage : styles.successMessage}
        >
          {status.message}
        </p>
      ) : null}
    </article>
  );
}

export function AdmissionsPipeline({
  canReviewDuplicates,
  canUpdate,
  initialLeads,
}: {
  canReviewDuplicates: boolean;
  canUpdate: boolean;
  initialLeads: LeadSummary[];
}) {
  const [leads, setLeads] = useState(initialLeads);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<LeadStage | "all">("all");

  const visibleLeads = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesStage = stageFilter === "all" || lead.stage === stageFilter;
      const matchesQuery =
        !normalized ||
        leadLabel(lead).toLowerCase().includes(normalized) ||
        lead.id.toLowerCase().includes(normalized);
      return matchesStage && matchesQuery;
    });
  }, [leads, query, stageFilter]);

  function updateLead(updated: LeadSummary) {
    setLeads((current) => current.map((lead) => (lead.id === updated.id ? updated : lead)));
  }

  function resolveDuplicate(duplicateId: string, leadId: string, candidateLeadId: string) {
    setLeads((current) => clearResolvedDuplicate(current, duplicateId, leadId, candidateLeadId));
  }

  return (
    <div className={styles.pipelinePage}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Enrollment pipeline</p>
          <h1>Every family, one clear next step.</h1>
          <p>
            Move leads forward, record contact, and keep possible duplicates separate for review.
          </p>
        </div>
        <span className={styles.liveBadge}>
          <i aria-hidden="true" /> {leads.length} seeded leads
        </span>
      </header>

      <div className={styles.pipelineToolbar}>
        <label className={styles.searchField}>
          <span className="sr-only">Search leads</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search family or lead ID"
            type="search"
            value={query}
          />
        </label>
        <label>
          <span className="sr-only">Filter by stage</span>
          <select
            onChange={(event) => setStageFilter(event.target.value as LeadStage | "all")}
            value={stageFilter}
          >
            <option value="all">All stages</option>
            {leadStages.map((stage) => (
              <option key={stage} value={stage}>
                {leadStageLabels[stage]}
              </option>
            ))}
          </select>
        </label>
        {!canUpdate ? <span className={styles.readOnlyPill}>Read-only access</span> : null}
      </div>

      <div className={styles.pipelineScroller}>
        <div className={styles.pipelineBoard}>
          {leadStages.map((stage, index) => {
            const stageLeads = visibleLeads.filter((lead) => lead.stage === stage);
            return (
              <section className={styles.stageColumn} key={stage}>
                <header>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h2>{leadStageLabels[stage]}</h2>
                  <strong>{stageLeads.length}</strong>
                </header>
                <div className={styles.stageCards}>
                  {stageLeads.length > 0 ? (
                    stageLeads.map((lead) => (
                      <LeadCard
                        allLeads={leads}
                        canReviewDuplicates={canReviewDuplicates}
                        canUpdate={canUpdate}
                        key={lead.id}
                        lead={lead}
                        onChange={updateLead}
                        onDuplicateResolved={resolveDuplicate}
                      />
                    ))
                  ) : (
                    <p className={styles.emptyStage}>No families in this stage.</p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
