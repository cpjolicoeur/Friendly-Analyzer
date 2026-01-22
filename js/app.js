    function loadSavedAnalyses() {
      const stored = localStorage.getItem("mfl_saved_analyses");
      if (stored) {
        try {
          savedAnalyses = JSON.parse(stored);
        } catch (e) {
          console.error("Failed to load saved analyses:", e);
          savedAnalyses = [];
        }
      }
    }

    function saveSavedAnalyses() {
      localStorage.setItem("mfl_saved_analyses", JSON.stringify(savedAnalyses));
    }

    function confirmSaveAnalysis() {
      const name = document.getElementById("analysis-name-input").value.trim();
      if (!name) {
        alert("Please enter a name for this analysis");
        return;
      }

      const analysisData = {
        id: Date.now(),
        name: name,
        timestamp: new Date().toISOString(),
        matchCount: allMatches.length,
        record: calculateMatchRecord(),
        teamStats: calculateTeamStats(),
        playerStats: calculatePlayerStats(),
      };

      savedAnalyses.push(analysisData);
      saveSavedAnalyses();

      closeSaveModal();
      setStatus(`Analysis "${name}" saved successfully!`, "success");
    }

    function openCompareModal() {
      if (savedAnalyses.length < 2) {
        alert("You need at least 2 saved analyses to compare. Please save some analyses first.");
        return;
      }

      selectedAnalysesForComparison = [];
      renderSavedAnalysesList();
      document.getElementById("compare-modal").classList.add("show");
      updateCompareButton();
    }

    function closeCompareModal() {
      document.getElementById("compare-modal").classList.remove("show");
    }

    function toggleAnalysisSelection(analysisId) {
      const index = selectedAnalysesForComparison.indexOf(analysisId);

      if (index > -1) {
        selectedAnalysesForComparison.splice(index, 1);
      } else {
        if (selectedAnalysesForComparison.length >= 2) {
          selectedAnalysesForComparison.shift();
        }
        selectedAnalysesForComparison.push(analysisId);
      }

      renderSavedAnalysesList();
      updateCompareButton();
    }

    function updateCompareButton() {
      const btn = document.getElementById("confirm-compare-btn");
      btn.disabled = selectedAnalysesForComparison.length !== 2;
    }

    function deleteAnalysis(analysisId) {
      if (!confirm("Are you sure you want to delete this saved analysis?")) {
        return;
      }

      savedAnalyses = savedAnalyses.filter((a) => a.id !== analysisId);
      saveSavedAnalyses();
      renderSavedAnalysesList();
      setStatus("Analysis deleted", "success");
    }

    function confirmCompareAnalyses() {
      if (selectedAnalysesForComparison.length !== 2) {
        alert("Please select exactly 2 analyses to compare");
        return;
      }

      const analysis1 = savedAnalyses.find((a) => a.id === selectedAnalysesForComparison[0]);
      const analysis2 = savedAnalyses.find((a) => a.id === selectedAnalysesForComparison[1]);

      if (!analysis1 || !analysis2) {
        alert("Error: Could not find selected analyses");
        return;
      }

      closeCompareModal();
      showComparisonView(analysis1, analysis2);
    }

    function closeComparisonView() {
      document.getElementById("comparison-view").classList.remove("visible");
      if (allMatches.length > 0) {
        document.getElementById("overview-section").classList.add("visible");
        document.getElementById("matches-section").classList.add("visible");
      }
    }

    const MAX_CONCURRENT_MATCH_REQUESTS = 5;
    let loadingTimerId = null;
    let loadingState = {
      active: false,
      total: 0,
      completed: 0,
      start: 0,
    };

    async function mapWithConcurrency(items, limit, mapper) {
      const results = new Array(items.length);
      let nextIndex = 0;

      async function worker() {
        while (nextIndex < items.length) {
          const currentIndex = nextIndex;
          nextIndex += 1;
          results[currentIndex] = await mapper(items[currentIndex], currentIndex);
        }
      }

      const workerCount = Math.min(limit, items.length);
      const workers = [];
      for (let i = 0; i < workerCount; i++) {
        workers.push(worker());
      }

      await Promise.all(workers);
      return results;
    }

    function formatDuration(ms) {
      const totalSeconds = Math.max(0, Math.floor(ms / 1000));
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }

    function startLoadingTracker(total = 0) {
      loadingState = {
        active: true,
        total: total,
        completed: 0,
        start: Date.now(),
      };

      if (loadingTimerId) {
        clearInterval(loadingTimerId);
      }

      loadingTimerId = setInterval(() => {
        if (!loadingState.active) return;
        const elapsed = Date.now() - loadingState.start;
        const countText = loadingState.total
          ? `${loadingState.completed}/${loadingState.total} complete`
          : "Starting up";
        updateStatusMeta(`Elapsed ${formatDuration(elapsed)} • ${countText}`);
      }, 1000);

      updateStatusMeta("Elapsed 0:00 • Starting up");
    }

    function stopLoadingTracker() {
      if (loadingTimerId) {
        clearInterval(loadingTimerId);
        loadingTimerId = null;
      }
      loadingState.active = false;
    }

    function updateLoadingProgress(completed, total) {
      loadingState.completed = completed;
      loadingState.total = total;
      const percent = total ? Math.round((completed / total) * 100) : 0;
      updateStatusProgress(percent, total ? `Loaded ${completed}/${total} matches` : "");
    }

    function setControlsLoading(isLoading) {
      const loadBtn = document.getElementById("load-btn");
      const addBtn = document.getElementById("add-match-btn");
      const clubInput = document.getElementById("club-id");
      const limitInput = document.getElementById("game-limit");
      const matchInput = document.getElementById("match-id-input");

      if (loadBtn) {
        if (!loadBtn.dataset.originalText) {
          loadBtn.dataset.originalText = loadBtn.textContent;
        }
        loadBtn.textContent = isLoading ? "Loading..." : loadBtn.dataset.originalText;
        loadBtn.disabled = isLoading;
      }

      if (addBtn) {
        if (!addBtn.dataset.originalText) {
          addBtn.dataset.originalText = addBtn.textContent;
        }
        addBtn.textContent = isLoading ? "Please wait..." : addBtn.dataset.originalText;
        addBtn.disabled = isLoading;
      }

      if (clubInput) clubInput.disabled = isLoading;
      if (limitInput) limitInput.disabled = isLoading;
      if (matchInput) matchInput.disabled = isLoading;
    }

    async function loadMatches() {
      const clubIdInput = document.getElementById("club-id").value.trim();
      const limitInput = document.getElementById("game-limit").value;

      if (!clubIdInput) {
        setStatus("Please enter a club ID", "error");
        return;
      }

      clubId = clubIdInput;
      const limit = Math.min(Math.max(1, parseInt(limitInput) || 50), 200);

      setControlsLoading(true);
      startLoadingTracker();
      setStatus(`Looking up squad ID for club ${clubId}...`, "loading", {
        detail: "Step 1 of 3 • Resolving club",
        progress: 0,
        meta: "Elapsed 0:00 • Starting up",
      });

      try {
        squadId = await fetchSquadIdFromClubId(clubId);
        console.log(`[Club ${clubId}] Found squad ID: ${squadId}`);

        setStatus(`Found squad ${squadId}! Loading match IDs...`, "loading", {
          detail: "Step 2 of 3 • Gathering match list",
          progress: 5,
        });

        const matchesData = await fetchMatchIds(squadId, limit);

        if (!matchesData || matchesData.length === 0) {
          stopLoadingTracker();
          setControlsLoading(false);
          setStatus("No friendly matches found for this squad", "error");
          return;
        }

        startLoadingTracker(matchesData.length);
        setStatus(`Loading ${matchesData.length} match reports and formations...`, "loading", {
          detail: "Step 3 of 3 • Fetching reports",
          progress: 0,
        });

        const totalMatches = matchesData.length;
        let completed = 0;
        playerNamesCache = {};

        const matchReports = await mapWithConcurrency(
          matchesData,
          MAX_CONCURRENT_MATCH_REQUESTS,
          async (matchData) => {
            const matchId = matchData.id;
            try {
              const [report, formations] = await Promise.all([
                fetchMatchReport(matchId),
                fetchMatchFormations(matchId),
              ]);

              if (formations) {
                const names = extractPlayerNamesFromFormations(formations);
                Object.assign(playerNamesCache, names);
              }

              const match = {
                matchId: matchId,
                date: matchData.startDate || new Date().toISOString(),
                report: report,
                formations: formations,
              };
              match.summary = deriveMatchSummary(match);
              return match;
            } catch (e) {
              console.error(`Failed to load match ${matchId}:`, e);
              return null;
            } finally {
              completed += 1;
              if (completed % 2 === 0 || completed === totalMatches) {
                updateLoadingProgress(completed, totalMatches);
              }
            }
          }
        );

        allMatches = matchReports.filter((match) => match);
        markDerivedDirty();
        renderAll();
        const duration = loadingState.start ? formatDuration(Date.now() - loadingState.start) : null;
        stopLoadingTracker();
        setControlsLoading(false);
        setStatus(`Successfully loaded ${allMatches.length} matches!`, "success", {
          detail: duration ? `Completed in ${duration}` : "",
          progress: 100,
        });
      } catch (e) {
        console.error("Error loading matches:", e);
        stopLoadingTracker();
        setControlsLoading(false);
        setStatus(`Error: ${e.message}`, "error");
      }
    }

    async function addMatch() {
      const matchIdInput = document.getElementById("match-id-input").value.trim();

      if (!matchIdInput) {
        setStatus("Please enter a match ID", "error");
        return;
      }

      if (allMatches.find((m) => m.matchId === matchIdInput)) {
        setStatus("Match already in list", "error");
        return;
      }

      setStatus(`Loading match ${matchIdInput}...`, "loading");

      try {
        const [report, formations] = await Promise.all([
          fetchMatchReport(matchIdInput),
          fetchMatchFormations(matchIdInput),
        ]);

        if (formations) {
          const names = extractPlayerNamesFromFormations(formations);
          Object.assign(playerNamesCache, names);
        }

        const match = {
          matchId: matchIdInput,
          date: new Date().toISOString(),
          report: report,
          formations: formations,
        };
        match.summary = deriveMatchSummary(match);

        allMatches.push(match);

        document.getElementById("match-id-input").value = "";
        markDerivedDirty();
        renderAll();
        setStatus(`Successfully added match ${matchIdInput}!`, "success");
      } catch (e) {
        console.error("Error adding match:", e);
        setStatus(`Error: ${e.message}`, "error");
      }
    }

    function deleteMatch(matchId) {
      if (!confirm(`Are you sure you want to delete match ${matchId}?`)) {
        return;
      }

      allMatches = allMatches.filter((m) => m.matchId !== matchId);
      markDerivedDirty();
      renderAll();
      setStatus(`Deleted match ${matchId}`, "success");
    }

    function downloadCSV() {
      if (allMatches.length === 0) {
        alert("No data to export");
        return;
      }

      const rows = [];

      rows.push([
        "Match ID", "Date", "Home Team", "Away Team", "Score", "Home Goals", "Away Goals", "Home xG", "Away xG",
        "Home Shots", "Away Shots", "Home SoT", "Away SoT", "Home Shot Acc%", "Away Shot Acc%",
        "Home Possession%", "Away Possession%", "Home Passes", "Away Passes", "Home Pass Acc%", "Away Pass Acc%",
        "Home Def Duel Win%", "Away Def Duel Win%", "Home Total Duels", "Away Total Duels",
        "Home Shots Blocked", "Away Shots Blocked", "Home Own Goals", "Away Own Goals",
        "Home Fouls", "Away Fouls", "Home YC", "Away YC", "Home RC", "Away RC",
        "Home Avg Rating", "Away Avg Rating", "Home Formation", "Away Formation",
        "Home XI Overall", "Away XI Overall",
      ]);

      allMatches.forEach((match) => {
        const summary = match.summary || deriveMatchSummary(match);
        if (!summary) return;
        if (!match.summary) {
          match.summary = summary;
        }

        const homeStats = summary.homeStats;
        const awayStats = summary.awayStats;
        const possession = summary.possession;
        const formationInfo = summary.formationInfo;

        const homePassAcc = formatPct(homeStats.passesAccurate, homeStats.passes, 1);
        const awayPassAcc = formatPct(awayStats.passesAccurate, awayStats.passes, 1);
        const homeShotAcc = formatPct(homeStats.shotsOnTarget, homeStats.shots, 1);
        const awayShotAcc = formatPct(awayStats.shotsOnTarget, awayStats.shots, 1);

        const homePossession = possession.home;
        const awayPossession = possession.away;

        const homeTotalDuels = homeStats.defensiveDuelsWon + homeStats.dribbledPast;
        const awayTotalDuels = awayStats.defensiveDuelsWon + awayStats.dribbledPast;
        const homeDefDuelWinRate = formatPct(homeStats.defensiveDuelsWon, homeTotalDuels, 1);
        const awayDefDuelWinRate = formatPct(awayStats.defensiveDuelsWon, awayTotalDuels, 1);

        rows.push([
          match.matchId, new Date(match.date).toISOString(), formationInfo.homeName, formationInfo.awayName,
          `${homeStats.goals}-${awayStats.goals}`, homeStats.goals, awayStats.goals,
          formatFixed(homeStats.xG, 2), formatFixed(awayStats.xG, 2),
          homeStats.shots, awayStats.shots, homeStats.shotsOnTarget, awayStats.shotsOnTarget,
          homeShotAcc, awayShotAcc, homePossession, awayPossession,
          homeStats.passes, awayStats.passes, homePassAcc, awayPassAcc,
          homeDefDuelWinRate, awayDefDuelWinRate, homeTotalDuels, awayTotalDuels,
          homeStats.shotsBlocked, awayStats.shotsBlocked, homeStats.ownGoals, awayStats.ownGoals,
          homeStats.fouls, awayStats.fouls, homeStats.yellowCards, awayStats.yellowCards,
          homeStats.redCards, awayStats.redCards, homeStats.avgRating, awayStats.avgRating,
          formationInfo.homeFormationType, formationInfo.awayFormationType, formationInfo.homeXIOverall, formationInfo.awayXIOverall,
        ]);
      });

      const csv = rows.map((row) => row.join(",")).join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `friendly_matches_club${clubId}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    // EVENT HANDLERS
    document.getElementById("load-btn").addEventListener("click", loadMatches);
    document.getElementById("add-match-btn").addEventListener("click", addMatch);
    document.getElementById("download-csv-btn").addEventListener("click", downloadCSV);
    document.getElementById("save-analysis-btn").addEventListener("click", openSaveModal);
    document.getElementById("compare-analyses-btn").addEventListener("click", openCompareModal);
    document.getElementById("close-comparison-btn").addEventListener("click", closeComparisonView);

    document.getElementById("club-id").addEventListener("keypress", (e) => {
      if (e.key === "Enter") loadMatches();
    });

    document.getElementById("game-limit").addEventListener("keypress", (e) => {
      if (e.key === "Enter") loadMatches();
    });

    document.getElementById("match-id-input").addEventListener("keypress", (e) => {
      if (e.key === "Enter") addMatch();
    });

    document.getElementById("analysis-name-input").addEventListener("keypress", (e) => {
      if (e.key === "Enter") confirmSaveAnalysis();
    });

    // Player detail table sorting
    document.querySelectorAll("#player-detail-table th[data-col]").forEach((th) => {
      th.addEventListener("click", (e) => {
        if (e.target.classList.contains("hide-col-btn")) return;
        
        const col = th.getAttribute("data-col");
        if (playerDetailSort.column === col) {
          playerDetailSort.asc = !playerDetailSort.asc;
        } else {
          playerDetailSort.column = col;
          playerDetailSort.asc = false;
        }
        renderPlayerDetail();
      });
    });

    // Hide column buttons
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("hide-col-btn")) {
        e.stopPropagation();
        const col = e.target.dataset.hideCol;
        hiddenPlayerCols.add(col);
        applyHiddenColumns();
      }
    });

    // Restore all rows button
    document.getElementById("restore-all-rows-btn").addEventListener("click", () => {
      hiddenPlayerRows.clear();
      renderPlayerDetail();
    });

    // Restore all columns button
    document.getElementById("restore-all-cols-btn").addEventListener("click", () => {
      hiddenPlayerCols.clear();
      applyHiddenColumns();
    });

    // Match filter buttons
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentMatchFilter = btn.dataset.filter;
        applyMatchFilter();
      });
    });

    loadSavedAnalyses();
