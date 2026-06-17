"use client";

import { useEffect, useMemo, useState } from "react";

import { EditMatchScreen } from "@/components/screens/editMatchScreen";
import { FinishScreen } from "@/components/screens/finishScreen";
import { HomeScreen } from "@/components/screens/homeScreen";
import { MatchDetailScreen } from "@/components/screens/matchDetailScreen";
import { NewTournamentScreen } from "@/components/screens/newTournamentScreen";
import { RecordScreen } from "@/components/screens/recordScreen";
import { ReportScreen } from "@/components/screens/reportScreen";
import { TournamentScreen } from "@/components/screens/tournamentScreen";
import {
  buildLiveSummary,
  buildSummary,
  createDefaultTournamentForm,
  createEditMatchForm,
  createMatchForTournament,
  createTournament,
  emptyStats,
  findMatchById,
  findTournamentById,
  flattenMatches,
  getTournamentStatusAfterMatch,
  nextRoundForTournament,
  parseScore,
  replaceMatchInTournaments,
  sortMatchesByRound,
  updateTournamentMetadataAndMatch,
  validateEditMatchForm,
  validateTournamentForm,
} from "@/lib/tennis";
import { readStoredState, writeStoredState } from "@/lib/tennis-storage";
import type {
  EditMatchForm,
  MatchRecord,
  Result,
  Screen,
  Stats,
  Tournament,
  TournamentForm,
} from "@/types/tennis";

const initialTournaments: Tournament[] = [];

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [tournaments, setTournaments] = useState<Tournament[]>(initialTournaments);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<MatchRecord | null>(null);
  const [activeMatch, setActiveMatch] = useState<MatchRecord | null>(null);
  const [stats, setStats] = useState<Stats>({ ...emptyStats });
  const [history, setHistory] = useState<Stats[]>([]);
  const [form, setForm] = useState<TournamentForm>(() => createDefaultTournamentForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editForm, setEditForm] = useState<EditMatchForm>(() => createEditMatchForm());
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [finishResult, setFinishResult] = useState<Result>("win");
  const [finishScore, setFinishScore] = useState("");
  const [finishNote, setFinishNote] = useState("");
  const [finishOpponentMemo, setFinishOpponentMemo] = useState("");
  const [storageReady, setStorageReady] = useState(false);

  const completedMatches = useMemo(
    () => flattenMatches(tournaments).filter((match) => match.status === "done"),
    [tournaments],
  );
  const lastFive = useMemo(() => completedMatches.slice(0, 5), [completedMatches]);
  const summary = useMemo(() => buildSummary(lastFive), [lastFive]);
  const liveSummary = buildLiveSummary(stats);
  const parsedScore = parseScore(finishScore);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const stored = readStoredState();

      if (stored) {
        const storedActiveMatch = stored.activeMatchId
          ? findMatchById(stored.tournaments, stored.activeMatchId)
          : null;

        setTournaments(stored.tournaments);
        setActiveMatch(storedActiveMatch);
        setSelectedMatch(storedActiveMatch);
        setSelectedTournament(
          storedActiveMatch
            ? findTournamentById(stored.tournaments, storedActiveMatch.tournamentId)
            : null,
        );
        setStats(storedActiveMatch ? storedActiveMatch.stats : stored.stats);
        setFinishResult(stored.finishResult);
        setFinishScore(stored.finishScore);
        setFinishNote(stored.finishNote);
        setFinishOpponentMemo(stored.finishOpponentMemo);
      }

      setStorageReady(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!storageReady) return;

    writeStoredState({
      tournaments,
      activeMatchId: activeMatch?.id ?? null,
      stats,
      finishResult,
      finishScore,
      finishNote,
      finishOpponentMemo,
    });
  }, [
    activeMatch?.id,
    finishNote,
    finishOpponentMemo,
    finishResult,
    finishScore,
    tournaments,
    stats,
    storageReady,
  ]);

  function navigateHome() {
    setScreen("home");
  }

  function openTournament(tournament: Tournament) {
    setSelectedTournament(tournament);
    setSelectedMatch(null);
    setScreen("tournament");
  }

  function openMatch(match: MatchRecord) {
    const tournament = findTournamentById(tournaments, match.tournamentId);
    setSelectedTournament(tournament);

    if (match.status === "recording") {
      resumeMatch(match);
      return;
    }

    setSelectedMatch(match);
    setScreen("matchDetail");
  }

  function createNewTournament(status: MatchRecord["status"]) {
    const nextErrors = validateTournamentForm(form, status === "recording");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return null;

    const tournament = createTournament(form, status);
    setTournaments((current) => [tournament, ...current]);
    setSelectedTournament(tournament);
    setSelectedMatch(tournament.matches[0] ?? null);
    return tournament;
  }

  function startFirstMatch() {
    const tournament = createNewTournament("recording");
    const match = tournament?.matches[0];
    if (!match) return;

    setActiveMatch(match);
    setStats({ ...emptyStats });
    setHistory([]);
    setFinishResult("win");
    setFinishScore("");
    setFinishNote("");
    setFinishOpponentMemo(match.opponentMemo);
    setScreen("record");
  }

  function saveDraftTournament() {
    const tournament = createNewTournament("draft");
    if (!tournament) return;

    setActiveMatch(null);
    setStats({ ...emptyStats });
    setHistory([]);
    setScreen("home");
  }

  function addNextMatch(tournament: Tournament) {
    const nextRound = nextRoundForTournament(tournament);
    if (!nextRound) return;

    const nextMatch = createMatchForTournament(tournament, {
      status: "draft",
      round: nextRound,
      opponent: "",
      opponentMemo: "",
    });
    const updatedTournament: Tournament = {
      ...tournament,
      status: "active",
      matches: [...tournament.matches, nextMatch],
    };

    setTournaments((current) =>
      current.map((item) => (item.id === updatedTournament.id ? updatedTournament : item)),
    );
    setSelectedTournament(updatedTournament);
    setSelectedMatch(nextMatch);
    setEditForm(createEditMatchForm(nextMatch));
    setEditErrors({ opponent: "記録開始前に相手の名前を入力してください。" });
    setScreen("edit");
  }

  function addStat(key: keyof Stats) {
    const nextStats = { ...stats, [key]: stats[key] + 1 };

    setHistory((current) => [stats, ...current].slice(0, 20));
    syncActiveStats(nextStats);
  }

  function undo() {
    const [previous, ...rest] = history;
    if (!previous) return;
    syncActiveStats(previous);
    setHistory(rest);
  }

  function syncActiveStats(nextStats: Stats) {
    setStats(nextStats);
    if (!activeMatch) return;

    const updatedMatch = { ...activeMatch, stats: nextStats };
    setActiveMatch(updatedMatch);
    replaceMatch(updatedMatch);
  }

  function goFinish() {
    if (!activeMatch) return;
    setFinishOpponentMemo(activeMatch.opponentMemo);
    setScreen("finish");
  }

  function saveFinishedMatch() {
    if (!activeMatch) return;

    const saved: MatchRecord = {
      ...activeMatch,
      status: "done",
      result: finishResult,
      score: finishScore.trim(),
      note: finishNote.trim(),
      opponentMemo: finishOpponentMemo.trim(),
      playerGames: parsedScore.player,
      opponentGames: parsedScore.opponent,
      stats,
    };
    const status = getTournamentStatusAfterMatch(saved);
    replaceMatch(saved, status);
    setSelectedMatch(saved);
    setActiveMatch(null);
    setScreen("tournament");
  }

  function openEditMatch(match: MatchRecord) {
    setSelectedMatch(match);
    setEditForm(createEditMatchForm(match));
    setEditErrors({});
    setScreen("edit");
  }

  function saveEditedMatch() {
    const nextErrors = validateEditMatchForm(editForm);
    setEditErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const targetMatch = findMatchById(tournaments, editForm.id);
    if (!targetMatch) return;

    const parsed = parseScore(editForm.score);
    const updatedMatch: MatchRecord = {
      ...targetMatch,
      date: editForm.date,
      tournament: editForm.tournament.trim(),
      grade: editForm.grade,
      event: editForm.event,
      drawSize: editForm.drawSize,
      round: editForm.round,
      opponent: editForm.opponent.trim(),
      opponentMemo: editForm.opponentMemo.trim(),
      result: editForm.status === "done" ? editForm.result : targetMatch.result,
      score: editForm.status === "done" ? editForm.score.trim() : targetMatch.score,
      note: editForm.status === "done" ? editForm.note.trim() : targetMatch.note,
      playerGames: editForm.status === "done" ? parsed.player : targetMatch.playerGames,
      opponentGames: editForm.status === "done" ? parsed.opponent : targetMatch.opponentGames,
    };
    const result = updateTournamentMetadataAndMatch(tournaments, updatedMatch, {
      name: editForm.tournament.trim(),
      date: editForm.date,
      grade: editForm.grade,
      event: editForm.event,
      drawSize: editForm.drawSize,
    });

    setTournaments(result.tournaments);
    setSelectedTournament(result.tournament);
    setSelectedMatch(updatedMatch);
    if (activeMatch?.id === updatedMatch.id) {
      setActiveMatch(updatedMatch);
      setFinishOpponentMemo(updatedMatch.opponentMemo);
    }
    setScreen("matchDetail");
  }

  function resumeMatch(match: MatchRecord) {
    if (!match.opponent.trim()) {
      openEditMatch(match);
      setEditErrors({ opponent: "記録開始前に相手の名前を入力してください。" });
      return;
    }

    const nextMatch = match.status === "draft" ? { ...match, status: "recording" as const } : match;
    replaceMatch(nextMatch, "active");
    setSelectedMatch(nextMatch);
    setActiveMatch(nextMatch);
    setStats(nextMatch.stats);
    setFinishOpponentMemo(nextMatch.opponentMemo);
    setHistory([]);
    setScreen("record");
  }

  function replaceMatch(updatedMatch: MatchRecord, tournamentStatus?: Tournament["status"]) {
    setTournaments((current) => {
      const next = replaceMatchInTournaments(current, updatedMatch, tournamentStatus);
      const nextTournament = findTournamentById(next, updatedMatch.tournamentId);
      setSelectedTournament(nextTournament);
      if (selectedMatch?.id === updatedMatch.id) setSelectedMatch(updatedMatch);
      return next;
    });
  }

  const selectedTournamentLatest = selectedTournament
    ? findTournamentById(tournaments, selectedTournament.id)
    : null;
  const selectedMatchLatest = selectedMatch
    ? findMatchById(tournaments, selectedMatch.id) ?? selectedMatch
    : null;
  const activeMatchLatest = activeMatch
    ? findMatchById(tournaments, activeMatch.id) ?? activeMatch
    : null;

  return (
    <main className="min-h-screen bg-[#0f1726] text-slate-100">
      {screen === "home" && (
        <HomeScreen
          tournaments={tournaments}
          summary={summary}
          onNew={() => setScreen("new")}
          onReport={() => setScreen("report")}
          onOpenTournament={openTournament}
        />
      )}

      {screen === "new" && (
        <NewTournamentScreen
          form={form}
          errors={errors}
          onBack={navigateHome}
          onChange={setForm}
          onStart={startFirstMatch}
          onSaveDraft={saveDraftTournament}
        />
      )}

      {screen === "tournament" && selectedTournamentLatest && (
        <TournamentScreen
          tournament={{
            ...selectedTournamentLatest,
            matches: sortMatchesByRound(selectedTournamentLatest.matches, selectedTournamentLatest.drawSize),
          }}
          onBack={navigateHome}
          onOpenMatch={openMatch}
          onAddNextMatch={() => addNextMatch(selectedTournamentLatest)}
        />
      )}

      {screen === "record" && activeMatchLatest && (
        <RecordScreen
          match={activeMatchLatest}
          stats={stats}
          summary={liveSummary}
          canUndo={history.length > 0}
          onBack={() => setScreen("tournament")}
          onUndo={undo}
          onAdd={addStat}
          onFinish={goFinish}
        />
      )}

      {screen === "finish" && activeMatchLatest && (
        <FinishScreen
          match={activeMatchLatest}
          stats={stats}
          result={finishResult}
          score={finishScore}
          note={finishNote}
          opponentMemo={finishOpponentMemo}
          parsedScore={parsedScore}
          onBack={() => setScreen("record")}
          onResult={setFinishResult}
          onScore={setFinishScore}
          onNote={setFinishNote}
          onOpponentMemo={setFinishOpponentMemo}
          onSave={saveFinishedMatch}
        />
      )}

      {screen === "report" && (
        <ReportScreen matches={completedMatches} onBack={navigateHome} />
      )}

      {screen === "matchDetail" && selectedMatchLatest && (
        <MatchDetailScreen
          match={selectedMatchLatest}
          onBack={() => setScreen("tournament")}
          onEdit={() => openEditMatch(selectedMatchLatest)}
          onResume={() => resumeMatch(selectedMatchLatest)}
        />
      )}

      {screen === "edit" && (
        <EditMatchScreen
          form={editForm}
          errors={editErrors}
          onBack={() => setScreen(selectedMatch ? "matchDetail" : "tournament")}
          onChange={setEditForm}
          onSave={saveEditedMatch}
        />
      )}
    </main>
  );
}
