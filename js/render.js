    function setStatus(msg, type = "") {
      const el = document.getElementById("status");
      if (el) {
        el.textContent = msg;
        el.className = "status-text " + type;
      }
    }

    function openSaveModal() {
      if (allMatches.length === 0) {
        alert("No data to save. Please load matches first.");
        return;
      }
      document.getElementById("save-modal").classList.add("show");
      document.getElementById("analysis-name-input").value = "";
      document.getElementById("analysis-name-input").focus();
    }

    function closeSaveModal() {
      document.getElementById("save-modal").classList.remove("show");
    }

    function renderSavedAnalysesList() {
      const container = document.getElementById("saved-analyses-list");
      container.innerHTML = "";

      if (savedAnalyses.length === 0) {
        container.innerHTML = '<p style="color: #94a3b8; text-align: center; padding: 20px;">No saved analyses yet</p>';
        return;
      }

      savedAnalyses.forEach((analysis) => {
        const item = document.createElement("div");
        item.className = "saved-analysis-item";
        if (selectedAnalysesForComparison.includes(analysis.id)) {
          item.classList.add("selected");
        }

        item.innerHTML = `
          <div class="saved-analysis-info">
            <div class="saved-analysis-name">${analysis.name}</div>
            <div class="saved-analysis-meta">
              ${analysis.matchCount} matches | Saved: ${new Date(analysis.timestamp).toLocaleDateString()}
            </div>
          </div>
          <button class="btn btn-danger" onclick="event.stopPropagation(); deleteAnalysis(${analysis.id})">🗑️</button>
        `;

        item.addEventListener("click", (e) => {
          if (e.target.closest(".btn-danger")) return;
          toggleAnalysisSelection(analysis.id);
        });

        container.appendChild(item);
      });
    }

    // FIXED: Now adds wins/draws/losses counts to the Match Record tile
    function renderMatchRecord() {
      const record = calculateMatchRecord();
      const total = allMatches.length;

      if (total === 0) return;

      const winPct = ((record.wins / total) * 100).toFixed(1);
      const drawPct = ((record.draws / total) * 100).toFixed(1);
      const lossPct = ((record.losses / total) * 100).toFixed(1);

      document.getElementById("win-percentage").textContent = `${winPct}%`;
      document.getElementById("draw-percentage").textContent = `${drawPct}%`;
      document.getElementById("loss-percentage").textContent = `${lossPct}%`;
      
      const recordSummary = document.getElementById("record-summary");
      const existingSummary = recordSummary.querySelector(".record-counts");
      
      if (existingSummary) {
        existingSummary.remove();
      }
      
      const countsDiv = document.createElement("div");
      countsDiv.className = "record-counts";
      countsDiv.style.cssText = "margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(148, 163, 184, 0.2); display: flex; justify-content: center; gap: 30px; font-size: 13px; color: #cbd5e1;";
      countsDiv.innerHTML = `
        <span><strong style="color: #4ade80;">Wins:</strong> ${record.wins}</span>
        <span><strong style="color: #eeff00;">Draws:</strong> ${record.draws}</span>
        <span><strong style="color: #ef4444;">Losses:</strong> ${record.losses}</span>
      `;
      
      recordSummary.appendChild(countsDiv);
    }

    function renderHomeOverview(stats) {
      if (!stats) return;

      const container = document.getElementById("home-stats");
      document.getElementById("home-overview-subtitle").textContent = `Averages across ${stats.home.matches} matches`;

      container.innerHTML = `
        <div class="stat-item"><div class="stat-label" title="Goals per match">Goals</div><div class="stat-value">${stats.home.goals}</div></div>
        <div class="stat-item"><div class="stat-label" title="Expected Goals per match">xG</div><div class="stat-value">${stats.home.xG}</div></div>
        <div class="stat-item"><div class="stat-label" title="Shots per match">Shots</div><div class="stat-value">${stats.home.shots}</div></div>
        <div class="stat-item"><div class="stat-label" title="Shots on Target per match">Shots on Target</div><div class="stat-value">${stats.home.shotsOnTarget}</div></div>
        <div class="stat-item"><div class="stat-label" title="Shot Accuracy percentage">Shot Accuracy</div><div class="stat-value">${stats.home.shotAccuracy}%</div></div>
        <div class="stat-item"><div class="stat-label" title="Possession percentage">Possession</div><div class="stat-value">${stats.home.possession}%</div></div>
        <div class="stat-item"><div class="stat-label" title="Passes per match">Passes</div><div class="stat-value">${stats.home.passes}</div></div>
        <div class="stat-item"><div class="stat-label" title="Pass Accuracy percentage">Pass Accuracy</div><div class="stat-value">${stats.home.passAccuracy}%</div></div>
        <div class="stat-item"><div class="stat-label" title="Crosses per match">Crosses</div><div class="stat-value">${stats.home.crosses}</div></div>
        <div class="stat-item"><div class="stat-label" title="Cross Accuracy percentage">Cross Accuracy</div><div class="stat-value">${stats.home.crossAccuracy}%</div></div>
        <div class="stat-item"><div class="stat-label" title="Defensive Duel Win Rate percentage">Def Duel Win %</div><div class="stat-value">${stats.home.defDuelWinRate}%</div></div>
        <div class="stat-item"><div class="stat-label" title="Total Duels per match">Total Duels</div><div class="stat-value">${stats.home.totalDuels}</div></div>
        <div class="stat-item"><div class="stat-label" title="Shots Blocked per match">Shots Blocked</div><div class="stat-value">${stats.home.shotsBlocked}</div></div>
        <div class="stat-item"><div class="stat-label" title="Total Clean Sheets">Clean Sheets</div><div class="stat-value">${stats.home.cleanSheets}</div></div>
        <div class="stat-item"><div class="stat-label" title="Own Goals per match">Own Goals</div><div class="stat-value">${stats.home.ownGoals}</div></div>
        <div class="stat-item"><div class="stat-label" title="Fouls per match">Fouls</div><div class="stat-value">${stats.home.fouls}</div></div>
        <div class="stat-item"><div class="stat-label" title="Yellow Cards per match">Yellow Cards</div><div class="stat-value">${stats.home.yellowCards}</div></div>
        <div class="stat-item"><div class="stat-label" title="Red Cards per match">Red Cards</div><div class="stat-value">${stats.home.redCards}</div></div>
      `;

      const homeXi = stats.home.xiOverall || { min: "-", max: "-", avg: "-" };
      document.getElementById("home-xi-summary").innerHTML = `
        <span><strong>XI Overall Min:</strong> ${homeXi.min}</span>
        <span><strong>Max:</strong> ${homeXi.max}</span>
        <span><strong>Avg:</strong> ${homeXi.avg}</span>
      `;
    }

    function renderAwayOverview(stats) {
      if (!stats) return;

      const container = document.getElementById("away-stats");
      document.getElementById("away-overview-subtitle").textContent = `Opponent averages across ${stats.away.matches} matches`;

      container.innerHTML = `
        <div class="stat-item"><div class="stat-label" title="Goals per match">Goals</div><div class="stat-value">${stats.away.goals}</div></div>
        <div class="stat-item"><div class="stat-label" title="Expected Goals per match">xG</div><div class="stat-value">${stats.away.xG}</div></div>
        <div class="stat-item"><div class="stat-label" title="Shots per match">Shots</div><div class="stat-value">${stats.away.shots}</div></div>
        <div class="stat-item"><div class="stat-label" title="Shots on Target per match">Shots on Target</div><div class="stat-value">${stats.away.shotsOnTarget}</div></div>
        <div class="stat-item"><div class="stat-label" title="Shot Accuracy percentage">Shot Accuracy</div><div class="stat-value">${stats.away.shotAccuracy}%</div></div>
        <div class="stat-item"><div class="stat-label" title="Possession percentage">Possession</div><div class="stat-value">${stats.away.possession}%</div></div>
        <div class="stat-item"><div class="stat-label" title="Passes per match">Passes</div><div class="stat-value">${stats.away.passes}</div></div>
        <div class="stat-item"><div class="stat-label" title="Pass Accuracy percentage">Pass Accuracy</div><div class="stat-value">${stats.away.passAccuracy}%</div></div>
        <div class="stat-item"><div class="stat-label" title="Crosses per match">Crosses</div><div class="stat-value">${stats.away.crosses}</div></div>
        <div class="stat-item"><div class="stat-label" title="Cross Accuracy percentage">Cross Accuracy</div><div class="stat-value">${stats.away.crossAccuracy}%</div></div>
        <div class="stat-item"><div class="stat-label" title="Defensive Duel Win Rate percentage">Def Duel Win %</div><div class="stat-value">${stats.away.defDuelWinRate}%</div></div>
        <div class="stat-item"><div class="stat-label" title="Total Duels per match">Total Duels</div><div class="stat-value">${stats.away.totalDuels}</div></div>
        <div class="stat-item"><div class="stat-label" title="Shots Blocked per match">Shots Blocked</div><div class="stat-value">${stats.away.shotsBlocked}</div></div>
        <div class="stat-item"><div class="stat-label" title="Total Clean Sheets">Clean Sheets</div><div class="stat-value">${stats.away.cleanSheets}</div></div>
        <div class="stat-item"><div class="stat-label" title="Own Goals per match">Own Goals</div><div class="stat-value">${stats.away.ownGoals}</div></div>
        <div class="stat-item"><div class="stat-label" title="Fouls per match">Fouls</div><div class="stat-value">${stats.away.fouls}</div></div>
        <div class="stat-item"><div class="stat-label" title="Yellow Cards per match">Yellow Cards</div><div class="stat-value">${stats.away.yellowCards}</div></div>
        <div class="stat-item"><div class="stat-label" title="Red Cards per match">Red Cards</div><div class="stat-value">${stats.away.redCards}</div></div>
      `;

      const awayXi = stats.away.xiOverall || { min: "-", max: "-", avg: "-" };
      document.getElementById("away-xi-summary").innerHTML = `
        <span><strong>XI Overall Min:</strong> ${awayXi.min}</span>
        <span><strong>Max:</strong> ${awayXi.max}</span>
        <span><strong>Avg:</strong> ${awayXi.avg}</span>
      `;
    }

    // SIMPLIFIED: Apply match filter using data attributes
    function applyMatchFilter() {
      const matchItems = document.querySelectorAll(".match-item");
      
      let visibleCount = 0;
      
      matchItems.forEach((item) => {
        const homeGoals = parseInt(item.dataset.homeGoals) || 0;
        const awayGoals = parseInt(item.dataset.awayGoals) || 0;
        
        // Determine result
        let result;
        if (homeGoals > awayGoals) {
          result = "win";
        } else if (homeGoals === awayGoals) {
          result = "draw";
        } else {
          result = "loss";
        }
        
        // Apply filter
        let shouldShow = false;
        if (currentMatchFilter === "all") {
          shouldShow = true;
        } else if (currentMatchFilter === "wins" && result === "win") {
          shouldShow = true;
        } else if (currentMatchFilter === "draws" && result === "draw") {
          shouldShow = true;
        } else if (currentMatchFilter === "losses" && result === "loss") {
          shouldShow = true;
        }
        
        if (shouldShow) {
          item.classList.remove("filter-hidden");
          visibleCount++;
        } else {
          item.classList.add("filter-hidden");
        }
      });

      // Update match title count
      const filterText = currentMatchFilter === "all" ? "" : ` (${currentMatchFilter.charAt(0).toUpperCase() + currentMatchFilter.slice(1)})`;
      document.getElementById("matches-title").textContent = `Match History${filterText} (${visibleCount} matches)`;
    }

    function applyHiddenColumns() {
      const table = document.getElementById("player-detail-table");
      if (!table) return;

      const allCols = ["name", "positions", "apps", "rating", "goals", "assists", "goalContribution", 
                       "xg", "xgDiff", "conversionRate", "xgPerShot", "shots", "sot", "shotAcc", 
                       "chancesCreated", "keyPassRate", "passes", "passAcc", "crosses", "crossAcc", 
                       "dribbles", "dribbledPast", "defDuels", "clearances", "blocks", "shotsIntercepted", 
                       "progressive", "fouls", "foulsSuffered", "yc", "rc", "ownGoals", "saves", "goalsConceded"];

      allCols.forEach((col, index) => {
        const th = table.querySelector(`th[data-col="${col}"]`);
        const tds = table.querySelectorAll(`tbody tr td:nth-child(${index + 1})`);

        if (hiddenPlayerCols.has(col)) {
          if (th) th.classList.add("hidden-col");
          tds.forEach(td => td.classList.add("hidden-col"));
        } else {
          if (th) th.classList.remove("hidden-col");
          tds.forEach(td => td.classList.remove("hidden-col"));
        }
      });
    }

    function renderPlayerDetail(playerAggregates) {
      const aggregates = playerAggregates || derivedCache.playerStats || calculatePlayerStats();
      if (!aggregates) return;

      const players = sortPlayers(aggregates);

      document.getElementById("player-detail-subtitle").textContent = `${players.length} unique players`;

      const tbody = document.getElementById("player-detail-body");
      tbody.innerHTML = "";

      document.querySelectorAll("#player-detail-table th").forEach((th) => {
        const indicator = th.querySelector(".sort-indicator");
        if (indicator) indicator.remove();
      });

      const currentTh = document.querySelector(`#player-detail-table th[data-col="${playerDetailSort.column}"]`);
      if (currentTh) {
        const indicator = document.createElement("span");
        indicator.className = "sort-indicator";
        indicator.textContent = playerDetailSort.asc ? "▲" : "▼";
        currentTh.appendChild(indicator);
      }

      players.forEach((player) => {
        const avgRating = (player.ratingSum / player.appearances).toFixed(2);
        const goalContribution = player.goals + player.assists;
        const xgDiff = (player.goals - player.xG).toFixed(2);
        const conversionRate = player.shots > 0 ? ((player.goals / player.shots) * 100).toFixed(1) : "0";
        const xgPerShot = player.shots > 0 ? (player.xG / player.shots).toFixed(2) : "0.00";
        const shotAcc = player.shots > 0 ? ((player.shotsOnTarget / player.shots) * 100).toFixed(1) : "0";
        const keyPassRate = player.passes > 0 ? ((player.chancesCreated / player.passes) * 100).toFixed(1) : "0";
        const passAcc = player.passes > 0 ? ((player.passesAccurate / player.passes) * 100).toFixed(1) : "0";
        const crossAcc = player.crosses > 0 ? ((player.crossesAccurate / player.crosses) * 100).toFixed(1) : "0";
        const defDuelsPct = player.defensiveDuelsTotal > 0 ? ((player.defensiveDuelsWon / player.defensiveDuelsTotal) * 100).toFixed(1) : "0";
        const progressive = player.passesAccurate + player.dribblingSuccess;

        const positionsArray = Array.from(player.positions).sort((a, b) => {
          const indexA = POSITION_ORDER.indexOf(a);
          const indexB = POSITION_ORDER.indexOf(b);
          return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
        });
        const positions = positionsArray.length > 0 ? positionsArray.join(" / ") : "-";

        const tr = document.createElement("tr");
        tr.dataset.playerId = player.playerId;
        
        if (hiddenPlayerRows.has(player.playerId)) {
          tr.classList.add("hidden-row");
        }

        tr.innerHTML = `
          <td>${player.playerName}</td>
          <td>${positions}</td>
          <td>${player.appearances}</td>
          <td>${avgRating}</td>
          <td>${player.goals}</td>
          <td>${player.assists}</td>
          <td>${goalContribution}</td>
          <td>${player.xG.toFixed(2)}</td>
          <td>${xgDiff}</td>
          <td>${conversionRate}%</td>
          <td>${xgPerShot}</td>
          <td>${player.shots}</td>
          <td>${player.shotsOnTarget}</td>
          <td>${shotAcc}%</td>
          <td>${player.chancesCreated}</td>
          <td>${keyPassRate}%</td>
          <td>${player.passes}</td>
          <td>${passAcc}%</td>
          <td>${player.crosses}</td>
          <td>${crossAcc}%</td>
          <td>${player.dribblingSuccess}</td>
          <td>${player.dribbledPast}</td>
          <td>${defDuelsPct}%</td>
          <td>${player.clearances}</td>
          <td>${player.shotsInterceptions}</td>
          <td>${player.shotsIntercepted}</td>
          <td>${progressive}</td>
          <td>${player.fouls}</td>
          <td>${player.foulsSuffered}</td>
          <td>${player.yellowCards}</td>
          <td>${player.redCards}</td>
          <td>${player.ownGoals}</td>
          <td>${player.saves}</td>
          <td>${player.goalsConceded}</td>
        `;

        tr.addEventListener("click", () => {
          hiddenPlayerRows.add(player.playerId);
          tr.classList.add("hidden-row");
        });

        tbody.appendChild(tr);
      });

      applyHiddenColumns();
    }

    // FIXED: Now stores goals in dataset attributes for reliable filtering
    function renderMatches() {
      const container = document.getElementById("matches-container");

      if (allMatches.length === 0) {
        container.innerHTML = '<p style="color: #94a3b8; padding: 20px;">No matches loaded</p>';
        return;
      }

      document.getElementById("matches-title").textContent = `Match History (${allMatches.length} matches)`;

      container.innerHTML = "";

      allMatches.forEach((match) => {
        const summary = deriveMatchSummary(match);
        if (!summary) return;

        const homeStats = summary.homeStats;
        const awayStats = summary.awayStats;
        const homeGoals = summary.homeGoals;
        const awayGoals = summary.awayGoals;
        const homePossession = summary.possession.home;
        const awayPossession = summary.possession.away;
        const formationInfo = summary.formationInfo;
        const homeName = formationInfo.homeName;
        const awayName = formationInfo.awayName;
        const homeFormationType = formationInfo.homeFormationType;
        const awayFormationType = formationInfo.awayFormationType;
        const homeXIOverall = formationInfo.homeXIOverall;
        const awayXIOverall = formationInfo.awayXIOverall;

        const matchDiv = document.createElement("div");
        matchDiv.className = "match-item";
        matchDiv.dataset.matchId = match.matchId;
        
        // CRITICAL FIX: Store goals directly on the element for filtering
        matchDiv.dataset.homeGoals = homeGoals;
        matchDiv.dataset.awayGoals = awayGoals;

        const matchMain = document.createElement("div");
        matchMain.className = "match-main";

        matchMain.innerHTML = `
          <div class="match-header-row">
            <div class="match-title-section">
              <div class="match-teams-title">${homeName} vs ${awayName}</div>
              <div class="match-meta">
                ${new Date(match.date).toLocaleString()} | ID: ${match.matchId}
                <a href="https://app.playmfl.com/matches/${match.matchId}" target="_blank" class="match-link">🔗 View on MFL</a>
              </div>
            </div>
            <div class="match-actions">
              <button class="btn btn-danger" onclick="event.stopPropagation(); deleteMatch(${match.matchId})">🗑️ Delete</button>
              <span class="match-toggle">▼</span>
            </div>
          </div>

          <div class="match-score-big">${homeGoals} - ${awayGoals}</div>

          <div class="match-quick-stats">
            <div class="quick-stat-card">
              <div class="quick-stat-label" title="Formation">Formation</div>
              <div class="quick-stat-values">
                <span class="quick-stat-home">${homeFormationType}</span>
                <span class="quick-stat-separator">vs</span>
                <span class="quick-stat-away">${awayFormationType}</span>
              </div>
            </div>

            <div class="quick-stat-card">
              <div class="quick-stat-label" title="Starting XI Overall Rating (sum of 11 players)">XI Overall</div>
              <div class="quick-stat-values">
                <span class="quick-stat-home">${homeXIOverall}</span>
                <span class="quick-stat-separator">vs</span>
                <span class="quick-stat-away">${awayXIOverall}</span>
              </div>
            </div>

            <div class="quick-stat-card">
              <div class="quick-stat-label" title="Expected Goals">xG</div>
              <div class="quick-stat-values">
                <span class="quick-stat-home">${homeStats.xG.toFixed(2)}</span>
                <span class="quick-stat-separator">-</span>
                <span class="quick-stat-away">${awayStats.xG.toFixed(2)}</span>
              </div>
            </div>

            <div class="quick-stat-card">
              <div class="quick-stat-label" title="Shots">Shots</div>
              <div class="quick-stat-values">
                <span class="quick-stat-home">${homeStats.shots}</span>
                <span class="quick-stat-separator">-</span>
                <span class="quick-stat-away">${awayStats.shots}</span>
              </div>
            </div>

            <div class="quick-stat-card">
              <div class="quick-stat-label" title="Shots on Target">Shots on Target</div>
              <div class="quick-stat-values">
                <span class="quick-stat-home">${homeStats.shotsOnTarget}</span>
                <span class="quick-stat-separator">-</span>
                <span class="quick-stat-away">${awayStats.shotsOnTarget}</span>
              </div>
            </div>

            <div class="quick-stat-card">
              <div class="quick-stat-label" title="Possession percentage">Possession</div>
              <div class="quick-stat-values">
                <span class="quick-stat-home">${homePossession}%</span>
                <span class="quick-stat-separator">-</span>
                <span class="quick-stat-away">${awayPossession}%</span>
              </div>
            </div>
          </div>
        `;

        matchDiv.appendChild(matchMain);

        const matchDetails = document.createElement("div");
        matchDetails.className = "match-details";
        matchDetails.innerHTML = `
          <div class="full-stats-title">📊 Complete Match Statistics</div>
          <div class="full-stats-grid">
            <div class="team-full-stats">
              <h4>🏠 ${homeName}</h4>
              ${renderFullTeamStats(homeStats)}
            </div>
            <div class="team-full-stats">
              <h4>✈️ ${awayName}</h4>
              ${renderFullTeamStats(awayStats)}
            </div>
          </div>

          <div class="players-section-title">👥 Match Players & Performance</div>
          <div class="team-players-card">
            <h5>🏠 ${homeName} Players</h5>
            ${renderMatchPlayers(home.playersStats, playerNamesCache)}
          </div>
          <div class="team-players-card">
            <h5>✈️ ${awayName} Players</h5>
            ${renderMatchPlayers(away.playersStats, playerNamesCache)}
          </div>
        `;

        matchDiv.appendChild(matchDetails);

        matchMain.addEventListener("click", (e) => {
          if (e.target.closest(".btn-danger") || e.target.closest(".match-link")) return;
          matchDiv.classList.toggle("expanded");
        });

        container.appendChild(matchDiv);
      });

      // CRITICAL FIX: Use setTimeout to ensure DOM is fully updated before filtering
      setTimeout(() => {
        applyMatchFilter();
      }, 0);
    }

    function renderFullTeamStats(stats) {
      if (!stats) return "<p>No stats available</p>";

      const passAcc = stats.passes > 0 ? ((stats.passesAccurate / stats.passes) * 100).toFixed(1) : "0";
      const crossAcc = stats.crosses > 0 ? ((stats.crossesAccurate / stats.crosses) * 100).toFixed(1) : "0";
      const shotAcc = stats.shots > 0 ? ((stats.shotsOnTarget / stats.shots) * 100).toFixed(1) : "0";
      const defDuelWinRate = (stats.defensiveDuelsWon + stats.dribbledPast > 0) ? ((stats.defensiveDuelsWon / (stats.defensiveDuelsWon + stats.dribbledPast)) * 100).toFixed(1) : "0";
      const totalDuels = stats.defensiveDuelsWon + stats.dribbledPast;

      return `
        <div class="stat-row"><span class="label" title="Goals">Goals</span><span class="value">${stats.goals}</span></div>
        <div class="stat-row"><span class="label" title="Assists">Assists</span><span class="value">${stats.assists}</span></div>
        <div class="stat-row"><span class="label" title="Expected Goals">xG</span><span class="value">${stats.xG.toFixed(2)}</span></div>
        <div class="stat-row"><span class="label" title="Shots">Shots</span><span class="value">${stats.shots}</span></div>
        <div class="stat-row"><span class="label" title="Shots on Target">Shots on Target</span><span class="value">${stats.shotsOnTarget}</span></div>
        <div class="stat-row"><span class="label" title="Shot Accuracy percentage">Shot Accuracy</span><span class="value">${shotAcc}%</span></div>
        <div class="stat-row"><span class="label" title="Total Passes">Passes</span><span class="value">${stats.passes}</span></div>
        <div class="stat-row"><span class="label" title="Pass Accuracy percentage">Pass Acc.</span><span class="value">${passAcc}%</span></div>
        <div class="stat-row"><span class="label" title="Total Crosses">Crosses</span><span class="value">${stats.crosses}</span></div>
        <div class="stat-row"><span class="label" title="Cross Accuracy percentage">Cross Acc.</span><span class="value">${crossAcc}%</span></div>
        <div class="stat-row"><span class="label" title="Chances Created">Chances Created</span><span class="value">${stats.chancesCreated}</span></div>
        <div class="stat-row"><span class="label" title="Defensive Duel Win Rate">Def Duel Win Rate</span><span class="value">${defDuelWinRate}%</span></div>
        <div class="stat-row"><span class="label" title="Total Duels">Total Duels</span><span class="value">${totalDuels}</span></div>
        <div class="stat-row"><span class="label" title="Shots Blocked">Shots Blocked</span><span class="value">${stats.shotsBlocked}</span></div>
        <div class="stat-row"><span class="label" title="Own Goals">Own Goals</span><span class="value">${stats.ownGoals}</span></div>
        <div class="stat-row"><span class="label" title="Fouls Committed">Fouls</span><span class="value">${stats.fouls}</span></div>
        <div class="stat-row"><span class="label" title="Yellow Cards">Yellow Cards</span><span class="value">${stats.yellowCards}</span></div>
        <div class="stat-row"><span class="label" title="Red Cards">Red Cards</span><span class="value">${stats.redCards}</span></div>
        <div class="stat-row"><span class="label" title="Average Player Rating">Avg Rating</span><span class="value">${stats.avgRating}</span></div>
      `;
    }

    function renderMatchPlayers(playersStats, namesCache) {
      if (!playersStats || playersStats.length === 0) {
        return '<p style="color: #94a3b8; padding: 10px;">No player data available</p>';
      }

      const sortedPlayers = [...playersStats].sort((a, b) => {
        const posA = POSITION_ORDER.indexOf(a.position);
        const posB = POSITION_ORDER.indexOf(b.position);
        return (posA === -1 ? 999 : posA) - (posB === -1 ? 999 : posB);
      });

      let html = `
        <table class="players-table">
          <thead>
            <tr>
              <th>Player</th>
              <th title="Position">Pos</th>
              <th title="Rating">Rat</th>
              <th title="Goals">G</th>
              <th title="Assists">A</th>
              <th title="Expected Goals">xG</th>
              <th title="Expected Goals per Shot">xG/Sh</th>
              <th title="Shots">Sh</th>
              <th title="Shots on Target">SoT</th>
              <th title="Shot Accuracy %">Sh%</th>
              <th title="Chances Created">Chc</th>
              <th title="Passes">Pass</th>
              <th title="Pass Accuracy %">P%</th>
              <th title="Crosses">Crs</th>
              <th title="Cross Accuracy %">C%</th>
              <th title="Successful Dribbles">Drb</th>
              <th title="Dribbled Past">DrP</th>
              <th title="Defensive Duel Win %">DD%</th>
              <th title="Clearances">Clr</th>
              <th title="Shots Blocked">Blk</th>
              <th title="Shots Intercepted (Offensive)">ShI</th>
              <th title="Progressive Actions">Prog</th>
              <th title="Fouls Committed">Fls</th>
              <th title="Fouls Suffered">FS</th>
              <th title="Yellow Cards">YC</th>
              <th title="Red Cards">RC</th>
              <th title="Own Goals">OG</th>
              <th title="Saves">Sav</th>
              <th title="Goals Conceded">GC</th>
            </tr>
          </thead>
          <tbody>
      `;

      sortedPlayers.forEach((player) => {
        const pid = String(player.playerId);
        const name = namesCache[pid] || `Player ${pid}`;
        const passAcc = player.passes > 0 ? ((player.passesAccurate / player.passes) * 100).toFixed(0) : "0";
        const crossAcc = player.crosses > 0 ? ((player.crossesAccurate / player.crosses) * 100).toFixed(0) : "0";
        const shotAcc = player.shots > 0 ? ((player.shotsOnTarget / player.shots) * 100).toFixed(0) : "0";
        const xgPerShot = player.shots > 0 ? (player.xG / player.shots).toFixed(2) : "0.00";
        const defDuelRate = (player.defensiveDuelsWon + player.dribbledPast > 0) ? ((player.defensiveDuelsWon / (player.defensiveDuelsWon + player.dribbledPast)) * 100).toFixed(0) : "0";
        const progressive = player.passesAccurate + player.dribblingSuccess;

        html += `
          <tr>
            <td>${name}</td>
            <td>${player.position || "-"}</td>
            <td>${(player.rating || 0).toFixed(1)}</td>
            <td>${player.goals || 0}</td>
            <td>${player.assists || 0}</td>
            <td>${(player.xG || 0).toFixed(2)}</td>
            <td>${xgPerShot}</td>
            <td>${player.shots || 0}</td>
            <td>${player.shotsOnTarget || 0}</td>
            <td>${shotAcc}%</td>
            <td>${player.chancesCreated || 0}</td>
            <td>${player.passes || 0}</td>
            <td>${passAcc}%</td>
            <td>${player.crosses || 0}</td>
            <td>${crossAcc}%</td>
            <td>${player.dribblingSuccess || 0}</td>
            <td>${player.dribbledPast || 0}</td>
            <td>${defDuelRate}%</td>
            <td>${player.clearances || 0}</td>
            <td>${player.shotsInterceptions || 0}</td>
            <td>${player.shotsIntercepted || 0}</td>
            <td>${progressive}</td>
            <td>${player.foulsCommitted || 0}</td>
            <td>${player.foulsSuffered || 0}</td>
            <td>${player.yellowCards || 0}</td>
            <td>${player.redCards || 0}</td>
            <td>${player.ownGoals || 0}</td>
            <td>${player.saves || 0}</td>
            <td>${player.goalsConceded || 0}</td>
          </tr>
        `;
      });

      html += `
          </tbody>
        </table>
      `;

      return html;
    }

    function getDerivedState() {
      derivedCache = {
        teamStats: calculateTeamStats(),
        playerStats: calculatePlayerStats(),
      };
      return derivedCache;
    }

    function renderAll() {
      if (allMatches.length > 0) {
        const derived = getDerivedState();
        document.getElementById("overview-section").classList.add("visible");
        document.getElementById("matches-section").classList.add("visible");
        document.getElementById("save-analysis-btn").disabled = false;
        renderMatchRecord();
        renderHomeOverview(derived.teamStats);
        renderAwayOverview(derived.teamStats);
        renderPlayerDetail(derived.playerStats);
        renderMatches();
      } else {
        derivedCache = { teamStats: null, playerStats: null };
        document.getElementById("overview-section").classList.remove("visible");
        document.getElementById("matches-section").classList.remove("visible");
        document.getElementById("save-analysis-btn").disabled = true;
      }
    }
