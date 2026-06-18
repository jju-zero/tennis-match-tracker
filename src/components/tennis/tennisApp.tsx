"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { EditMatchScreen } from "@/components/screens/editMatchScreen";
import { FinishScreen } from "@/components/screens/finishScreen";
import { HomeScreen } from "@/components/screens/homeScreen";
import { MatchDetailScreen } from "@/components/screens/matchDetailScreen";
import { NewTournamentScreen } from "@/components/screens/newTournamentScreen";
import { PrepareMatchScreen } from "@/components/screens/prepareMatchScreen";
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
  validatePrepareMatchForm,
  validateTournamentForm,
} from "@/lib/tennis";
import {
  readRemoteState,
  readStoredState,
  writeRemoteState,
  writeStoredState,
} from "@/lib/tennis-storage";
import type {
  EditMatchForm,
  MatchRecord,
  PrepareMatchForm,
  Result,
  Screen,
  Stats,
  StoredState,
  Tournament,
  TournamentForm,
} from "@/types/tennis";

const initialTournaments: Tournament[] = [];

type RouteState = {
  screen: Screen;
  tournamentId?: string;
  matchId?: string;
};

export function TennisApp() {
  const pathname = usePathname();
  const router = useRouter();
  const route = useMemo(() => parseRoute(pathname), [pathname]);
  const screen = route.screen;
  const skipInitialRemoteWriteRef = useRef(true);
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
  const [prepareMatch, setPrepareMatch] = useState<MatchRecord | null>(null);
  const [prepareForm, setPrepareForm] = useState<PrepareMatchForm>({
    opponent: "",
    opponentMemo: "",
  });
  const [prepareErrors, setPrepareErrors] = useState<Record<string, string>>({});
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
  const routeMatch = route.matchId ? findMatchById(tournaments, route.matchId) : null;
  const routeTournament = route.tournamentId
    ? findTournamentById(tournaments, route.tournamentId)
    : routeMatch
      ? findTournamentById(tournaments, routeMatch.tournamentId)
      : null;

  const applyStoredState = useCallback((stored: StoredState) => {
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
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        const localState = readStoredState();
        if (localState) applyStoredState(localState);

        const remoteState = await readRemoteState();
        if (remoteState) {
          applyStoredState(remoteState);
          writeStoredState(remoteState);
        }

        setStorageReady(true);
      })();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [applyStoredState]);

  useEffect(() => {
    if (!storageReady) return;

    const nextState = {
      tournaments,
      activeMatchId: activeMatch?.id ?? null,
      stats,
      finishResult,
      finishScore,
      finishNote,
      finishOpponentMemo,
    };

    writeStoredState(nextState);

    if (skipInitialRemoteWriteRef.current) {
      skipInitialRemoteWriteRef.current = false;
      return;
    }

    void writeRemoteState(nextState);
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

  useEffect(() => {
    if (!storageReady || !route.matchId) return;

    const matchId = route.matchId;
    const timeoutId = window.setTimeout(() => {
      const nextMatch = findMatchById(tournaments, matchId);
      if (!nextMatch) return;

      setSelectedMatch(nextMatch);
      setSelectedTournament(findTournamentById(tournaments, nextMatch.tournamentId));

      if (route.screen === "prepareMatch") {
        setPrepareMatch(nextMatch);
        setPrepareForm({
          opponent: nextMatch.opponent,
          opponentMemo: nextMatch.opponentMemo,
        });
      }

      if (route.screen === "record" || route.screen === "finish") {
        setActiveMatch(nextMatch);
        setStats(nextMatch.stats);
        if (route.screen === "finish") {
          setFinishOpponentMemo((current) => current || nextMatch.opponentMemo);
        }
      }

      if (route.screen === "edit") {
        setEditForm((current) =>
          current.id === nextMatch.id ? current : createEditMatchForm(nextMatch),
        );
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [route.matchId, route.screen, storageReady, tournaments]);

  useEffect(() => {
    if (!storageReady || !route.tournamentId) return;
    const tournamentId = route.tournamentId;
    const timeoutId = window.setTimeout(() => {
      const nextTournament = findTournamentById(tournaments, tournamentId);
      if (nextTournament) setSelectedTournament(nextTournament);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [route.tournamentId, storageReady, tournaments]);

  function navigateHome() {
    router.push("/");
  }

  function openTournament(tournament: Tournament) {
    setSelectedTournament(tournament);
    setSelectedMatch(null);
    router.push(tournamentPath(tournament.id));
  }

  function openMatch(match: MatchRecord) {
    const tournament = findTournamentById(tournaments, match.tournamentId);
    setSelectedTournament(tournament);

    if (match.status === "recording") {
      resumeMatch(match);
      return;
    }

    setSelectedMatch(match);
    router.push(matchPath(match.id));
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
    router.push(recordPath(match.id));
  }

  function saveDraftTournament() {
    const tournament = createNewTournament("draft");
    if (!tournament) return;

    setActiveMatch(null);
    setStats({ ...emptyStats });
    setHistory([]);
    router.push("/");
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
    openPrepareMatch(nextMatch, {
      opponent: "記録開始前に相手の名前を入力してください。",
    });
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
    const currentActiveMatch =
      activeMatch ?? (route.screen === "record" || route.screen === "finish" ? routeMatch : null);
    if (!currentActiveMatch) return;

    const updatedMatch = { ...currentActiveMatch, stats: nextStats };
    setActiveMatch(updatedMatch);
    replaceMatch(updatedMatch);
  }

  function goFinish() {
    if (!activeMatch) return;
    setFinishOpponentMemo(activeMatch.opponentMemo);
    router.push(finishPath(activeMatch.id));
  }

  function temporarySaveMatch() {
    if (!activeMatch) return;

    const saved: MatchRecord = {
      ...activeMatch,
      status: "recording",
      stats,
    };

    replaceMatch(saved, "active");
    setSelectedMatch(saved);
    setActiveMatch(null);
    setHistory([]);
    router.push(tournamentPath(saved.tournamentId));
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
    router.push(tournamentPath(saved.tournamentId));
  }

  function openEditMatch(match: MatchRecord) {
    setSelectedMatch(match);
    setEditForm(createEditMatchForm(match));
    setEditErrors({});
    router.push(editPath(match.id));
  }

  function openPrepareMatch(match: MatchRecord, nextErrors: Record<string, string> = {}) {
    setSelectedMatch(match);
    setPrepareMatch(match);
    setPrepareForm({
      opponent: match.opponent,
      opponentMemo: match.opponentMemo,
    });
    setPrepareErrors(nextErrors);
    router.push(preparePath(match.id));
  }

  function savePreparedDraft() {
    const match = prepareMatch ? findMatchById(tournaments, prepareMatch.id) ?? prepareMatch : null;
    if (!match) return;

    const savedMatch: MatchRecord = {
      ...match,
      opponent: prepareForm.opponent.trim(),
      opponentMemo: prepareForm.opponentMemo.trim(),
    };

    replaceMatch(savedMatch);
    setSelectedMatch(savedMatch);
    setPrepareMatch(savedMatch);
    setPrepareErrors({});
    router.push(tournamentPath(savedMatch.tournamentId));
  }

  function startPreparedMatch() {
    const match = prepareMatch ? findMatchById(tournaments, prepareMatch.id) ?? prepareMatch : null;
    if (!match) return;

    const nextErrors = validatePrepareMatchForm(prepareForm);
    setPrepareErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const nextMatch: MatchRecord = {
      ...match,
      status: "recording",
      opponent: prepareForm.opponent.trim(),
      opponentMemo: prepareForm.opponentMemo.trim(),
    };

    replaceMatch(nextMatch, "active");
    setSelectedMatch(nextMatch);
    setPrepareMatch(nextMatch);
    setActiveMatch(nextMatch);
    setStats(nextMatch.stats);
    setFinishResult("win");
    setFinishScore("");
    setFinishNote("");
    setFinishOpponentMemo(nextMatch.opponentMemo);
    setHistory([]);
    router.push(recordPath(nextMatch.id));
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
      stats: { ...editForm.stats },
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
      setStats(updatedMatch.stats);
      setFinishOpponentMemo(updatedMatch.opponentMemo);
    }
    router.push(matchPath(updatedMatch.id));
  }

  function resumeMatch(match: MatchRecord) {
    if (!match.opponent.trim()) {
      openPrepareMatch(match, {
        opponent: "記録開始前に相手の名前を入力してください。",
      });
      return;
    }

    const nextMatch = match.status === "draft" ? { ...match, status: "recording" as const } : match;
    replaceMatch(nextMatch, "active");
    setSelectedMatch(nextMatch);
    setActiveMatch(nextMatch);
    setStats(nextMatch.stats);
    setFinishOpponentMemo(nextMatch.opponentMemo);
    setHistory([]);
    router.push(recordPath(nextMatch.id));
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

  const selectedTournamentLatest =
    routeTournament ??
    (selectedTournament ? findTournamentById(tournaments, selectedTournament.id) : null);
  const selectedMatchLatest =
    routeMatch ?? (selectedMatch ? findMatchById(tournaments, selectedMatch.id) ?? selectedMatch : null);
  const prepareMatchLatest =
    routeMatch ?? (prepareMatch ? findMatchById(tournaments, prepareMatch.id) ?? prepareMatch : null);
  const activeMatchLatest =
    routeMatch ?? (activeMatch ? findMatchById(tournaments, activeMatch.id) ?? activeMatch : null);

  return (
    <main className="min-h-screen bg-[#0f1726] text-slate-100">
      {screen === "home" && (
        <HomeScreen
          tournaments={tournaments}
          summary={summary}
          onNew={() => router.push("/new")}
          onReport={() => router.push("/report")}
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

      {screen === "prepareMatch" && prepareMatchLatest && (
        <PrepareMatchScreen
          match={prepareMatchLatest}
          form={prepareForm}
          errors={prepareErrors}
          onBack={() => router.push(tournamentPath(prepareMatchLatest.tournamentId))}
          onChange={setPrepareForm}
          onStart={startPreparedMatch}
          onSaveDraft={savePreparedDraft}
        />
      )}

      {screen === "record" && activeMatchLatest && (
        <RecordScreen
          match={activeMatchLatest}
          stats={stats}
          summary={liveSummary}
          canUndo={history.length > 0}
          onBack={() => router.push(tournamentPath(activeMatchLatest.tournamentId))}
          onUndo={undo}
          onAdd={addStat}
          onTemporarySave={temporarySaveMatch}
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
          onBack={() => router.push(recordPath(activeMatchLatest.id))}
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
          onBack={() => router.push(tournamentPath(selectedMatchLatest.tournamentId))}
          onEdit={() => openEditMatch(selectedMatchLatest)}
          onResume={() => resumeMatch(selectedMatchLatest)}
        />
      )}

      {screen === "edit" && (
        <EditMatchScreen
          form={editForm}
          errors={editErrors}
          onBack={() =>
            selectedMatchLatest
              ? router.push(matchPath(selectedMatchLatest.id))
              : router.push("/")
          }
          onChange={setEditForm}
          onSave={saveEditedMatch}
        />
      )}
    </main>
  );
}

function parseRoute(pathname: string): RouteState {
  const segments = pathname.split("/").filter(Boolean);
  const [first, second, third] = segments;

  if (!first) return { screen: "home" };
  if (first === "new") return { screen: "new" };
  if (first === "report") return { screen: "report" };
  if (first === "tournaments" && second) {
    return { screen: "tournament", tournamentId: second };
  }
  if (first === "matches" && second) {
    if (third === "prepare") return { screen: "prepareMatch", matchId: second };
    if (third === "record") return { screen: "record", matchId: second };
    if (third === "finish") return { screen: "finish", matchId: second };
    if (third === "edit") return { screen: "edit", matchId: second };
    return { screen: "matchDetail", matchId: second };
  }

  return { screen: "home" };
}

function tournamentPath(id: string) {
  return `/tournaments/${id}`;
}

function matchPath(id: string) {
  return `/matches/${id}`;
}

function preparePath(id: string) {
  return `/matches/${id}/prepare`;
}

function recordPath(id: string) {
  return `/matches/${id}/record`;
}

function finishPath(id: string) {
  return `/matches/${id}/finish`;
}

function editPath(id: string) {
  return `/matches/${id}/edit`;
}
