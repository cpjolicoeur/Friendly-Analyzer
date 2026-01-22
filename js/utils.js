    function formatPct(num, den, digits = 1) {
      if (!den || den <= 0) return (0).toFixed(digits);
      return ((num / den) * 100).toFixed(digits);
    }

    function formatFixed(value, digits = 1) {
      const num = Number(value);
      if (!Number.isFinite(num)) return (0).toFixed(digits);
      return num.toFixed(digits);
    }

    function sumPlayerStat(playersStats, key) {
      if (!playersStats) return 0;
      return playersStats.reduce((sum, p) => sum + (p[key] || 0), 0);
    }

    function computePossession(homePlayers, awayPlayers) {
      const homePasses = sumPlayerStat(homePlayers, "passes");
      const awayPasses = sumPlayerStat(awayPlayers, "passes");
      const totalPasses = homePasses + awayPasses;
      return {
        home: totalPasses > 0 ? ((homePasses / totalPasses) * 100).toFixed(1) : "50.0",
        away: totalPasses > 0 ? ((awayPasses / totalPasses) * 100).toFixed(1) : "50.0",
        homePasses,
        awayPasses,
      };
    }

    function getPositionSortValue(positions) {
      if (!positions || positions.size === 0) return 999;
      let minIndex = 999;
      positions.forEach((pos) => {
        const index = POSITION_ORDER.indexOf(pos);
        if (index !== -1 && index < minIndex) {
          minIndex = index;
        }
      });
      return minIndex;
    }

    function extractClubNames(formationsData) {
      let homeName = "Home Team";
      let awayName = "Away Team";

      if (formationsData) {
        if (formationsData.home?.name) {
          homeName = formationsData.home.name;
        }
        if (formationsData.away?.name) {
          awayName = formationsData.away.name;
        }
      }

      return { homeName, awayName };
    }

    function extractFormationInfo(formations) {
      let homeFormationType = "-";
      let awayFormationType = "-";
      let homeXIOverall = 0;
      let awayXIOverall = 0;
      let homeName = "Home Team";
      let awayName = "Away Team";

      if (formations) {
        const playerMap = extractPlayerMapFromFormations(formations);
        const clubNames = extractClubNames(formations);

        homeName = clubNames.homeName;
        awayName = clubNames.awayName;

        if (formations.homeFormation) {
          homeFormationType = formations.homeFormation.type || "-";
          homeXIOverall = computeXIOverall(formations.homeFormation, playerMap);
        }

        if (formations.awayFormation) {
          awayFormationType = formations.awayFormation.type || "-";
          awayXIOverall = computeXIOverall(formations.awayFormation, playerMap);
        }
      }

      return {
        homeFormationType,
        awayFormationType,
        homeXIOverall,
        awayXIOverall,
        homeName,
        awayName,
      };
    }

    function deriveMatchSummary(match) {
      const home = match.report?.home;
      const away = match.report?.away;

      if (!home || !away) return null;

      const homeStats = aggregateTeamStats(home.playersStats);
      const awayStats = aggregateTeamStats(away.playersStats);
      if (!homeStats || !awayStats) return null;
      const possession = computePossession(home.playersStats, away.playersStats);
      const formationInfo = extractFormationInfo(match.formations);

      return {
        homeStats,
        awayStats,
        homeGoals: homeStats.goals,
        awayGoals: awayStats.goals,
        possession,
        formationInfo,
      };
    }

    function calculateMatchRecord() {
      if (allMatches.length === 0) return { wins: 0, draws: 0, losses: 0 };

      let wins = 0, draws = 0, losses = 0;

      allMatches.forEach((match) => {
        const home = match.report?.home;
        const away = match.report?.away;

        if (!home || !away) return;

        const homeGoals = home.playersStats?.reduce((sum, p) => sum + (p.goals || 0), 0) || 0;
        const awayGoals = away.playersStats?.reduce((sum, p) => sum + (p.goals || 0), 0) || 0;

        if (homeGoals > awayGoals) {
          wins++;
        } else if (homeGoals === awayGoals) {
          draws++;
        } else {
          losses++;
        }
      });

      return { wins, draws, losses };
    }

    function extractPlayerNamesFromFormations(formationsData) {
      const playerMap = {};

      if (!formationsData) return playerMap;

      const scanFormation = (formation) => {
        if (!formation || !Array.isArray(formation.positions)) return;

        formation.positions.forEach((pos) => {
          const p = pos?.player;
          if (!p || !p.id) return;

          const id = String(p.id);
          const firstName = p.firstName || p.metadata?.firstName || "";
          const lastName = p.lastName || p.metadata?.lastName || "";
          const fullName = `${firstName} ${lastName}`.trim();

          if (fullName) {
            playerMap[id] = fullName;
          }
        });
      };

      scanFormation(formationsData.homeFormation);
      scanFormation(formationsData.awayFormation);

      return playerMap;
    }

    function computeXIOverall(formation, playerMap) {
      if (!formation || !Array.isArray(formation.positions)) return 0;

      const players = formation.positions.map((pos) => pos?.player).filter((p) => p && p.id);

      if (players.length === 0) return 0;

      const ratings = players.map((p) => {
        const id = String(p.id);
        const meta = playerMap[id];
        if (meta && typeof meta.matchOverall === "number") {
          return meta.matchOverall;
        }
        return p.overall || p.metadata?.overallAtKickoff || p.metadata?.overall || 0;
      });

      const sum = ratings.reduce((acc, r) => acc + r, 0);
      return sum;
    }

    function extractPlayerMapFromFormations(formationsJson) {
      if (!formationsJson) return {};

      const playerMap = {};

      const scanFormation = (formation) => {
        if (!formation || !Array.isArray(formation.positions)) return;

        formation.positions.forEach((pos) => {
          const p = pos?.player;
          if (!p || !p.id) return;

          const id = String(p.id);
          const firstName = p.firstName || p.metadata?.firstName || "";
          const lastName = p.lastName || p.metadata?.lastName || "";
          const name = `${firstName} ${lastName}`.trim() || `Player ${id}`;
          const positions = p.positions || p.metadata?.positions || [];
          const overall = p.overall || p.metadata?.overallAtKickoff || p.metadata?.overall || 0;

          playerMap[id] = {
            name,
            positions: Array.isArray(positions) ? positions : [],
            matchOverall: overall,
          };
        });
      };

      scanFormation(formationsJson.homeFormation);
      scanFormation(formationsJson.awayFormation);

      return playerMap;
    }

    function calculateTeamStats() {
      if (allMatches.length === 0) return null;

      const homeStats = {
        matches: allMatches.length,
        goals: 0, xG: 0, shots: 0, shotsOnTarget: 0, possession: 0, passes: 0, passAccuracy: 0,
        crosses: 0, crossAccuracy: 0, fouls: 0, yellowCards: 0, redCards: 0, defensiveDuelsWon: 0,
        dribbledPast: 0, shotsBlocked: 0, ownGoals: 0, cleanSheets: 0,
      };

      const awayStats = { ...homeStats };

      let homeTotalPasses = 0, homeAccuratePasses = 0, homeTotalCrosses = 0, homeAccurateCrosses = 0;
      let awayTotalPasses = 0, awayAccuratePasses = 0, awayTotalCrosses = 0, awayAccurateCrosses = 0;

      const homeXIValues = [];
      const awayXIValues = [];

      allMatches.forEach((match) => {
        const home = match.report?.home;
        const away = match.report?.away;

        if (match.formations) {
          const playerMap = extractPlayerMapFromFormations(match.formations);
          if (match.formations.homeFormation) {
            const homeXIOverall = computeXIOverall(match.formations.homeFormation, playerMap);
            if (homeXIOverall > 0) homeXIValues.push(homeXIOverall);
          }
          if (match.formations.awayFormation) {
            const awayXIOverall = computeXIOverall(match.formations.awayFormation, playerMap);
            if (awayXIOverall > 0) awayXIValues.push(awayXIOverall);
          }
        }

        if (home && home.playersStats) {
          let homeGoalsConceded = 0;

          home.playersStats.forEach((player) => {
            homeStats.goals += player.goals || 0;
            homeStats.xG += player.xG || 0;
            homeStats.shots += player.shots || 0;
            homeStats.shotsOnTarget += player.shotsOnTarget || 0;
            homeStats.fouls += player.foulsCommitted || 0;
            homeStats.yellowCards += player.yellowCards || 0;
            homeStats.redCards += player.redCards || 0;
            homeStats.defensiveDuelsWon += player.defensiveDuelsWon || 0;
            homeStats.dribbledPast += player.dribbledPast || 0;
            homeStats.shotsBlocked += player.shotsInterceptions || 0;
            homeStats.ownGoals += player.ownGoals || 0;
            homeGoalsConceded += player.goalsConceded || 0;

            if (player.passes) {
              homeTotalPasses += player.passes;
              homeAccuratePasses += player.passesAccurate || 0;
            }

            if (player.crosses) {
              homeTotalCrosses += player.crosses;
              homeAccurateCrosses += player.crossesAccurate || 0;
            }
          });

          if (homeGoalsConceded === 0) homeStats.cleanSheets++;

          const homePasses = home.playersStats.reduce((sum, p) => sum + (p.passes || 0), 0) || 0;
          const awayPasses = away?.playersStats?.reduce((sum, p) => sum + (p.passes || 0), 0) || 0;
          const totalPassesMatch = homePasses + awayPasses;
          if (totalPassesMatch > 0) {
            homeStats.possession += (homePasses / totalPassesMatch) * 100;
          }
        }

        if (away && away.playersStats) {
          let awayGoalsConceded = 0;

          away.playersStats.forEach((player) => {
            awayStats.goals += player.goals || 0;
            awayStats.xG += player.xG || 0;
            awayStats.shots += player.shots || 0;
            awayStats.shotsOnTarget += player.shotsOnTarget || 0;
            awayStats.fouls += player.foulsCommitted || 0;
            awayStats.yellowCards += player.yellowCards || 0;
            awayStats.redCards += player.redCards || 0;
            awayStats.defensiveDuelsWon += player.defensiveDuelsWon || 0;
            awayStats.dribbledPast += player.dribbledPast || 0;
            awayStats.shotsBlocked += player.shotsInterceptions || 0;
            awayStats.ownGoals += player.ownGoals || 0;
            awayGoalsConceded += player.goalsConceded || 0;

            if (player.passes) {
              awayTotalPasses += player.passes;
              awayAccuratePasses += player.passesAccurate || 0;
            }

            if (player.crosses) {
              awayTotalCrosses += player.crosses;
              awayAccurateCrosses += player.crossesAccurate || 0;
            }
          });

          if (awayGoalsConceded === 0) awayStats.cleanSheets++;

          const homePasses = home?.playersStats?.reduce((sum, p) => sum + (p.passes || 0), 0) || 0;
          const awayPasses = away.playersStats.reduce((sum, p) => sum + (p.passes || 0), 0) || 0;
          const totalPassesMatch = homePasses + awayPasses;
          if (totalPassesMatch > 0) {
            awayStats.possession += (awayPasses / totalPassesMatch) * 100;
          }
        }
      });

      const mc = allMatches.length;

      homeStats.goals = (homeStats.goals / mc).toFixed(2);
      homeStats.xG = (homeStats.xG / mc).toFixed(2);
      homeStats.shots = (homeStats.shots / mc).toFixed(1);
      homeStats.shotsOnTarget = (homeStats.shotsOnTarget / mc).toFixed(1);
      homeStats.shotAccuracy = homeStats.shots > 0 ? ((homeStats.shotsOnTarget / homeStats.shots) * 100).toFixed(1) : "0";
      homeStats.possession = (homeStats.possession / mc).toFixed(1);
      homeStats.passes = (homeTotalPasses / mc).toFixed(0);
      homeStats.passAccuracy = homeTotalPasses > 0 ? ((homeAccuratePasses / homeTotalPasses) * 100).toFixed(1) : "0";
      homeStats.crosses = (homeTotalCrosses / mc).toFixed(1);
      homeStats.crossAccuracy = homeTotalCrosses > 0 ? ((homeAccurateCrosses / homeTotalCrosses) * 100).toFixed(1) : "0";
      homeStats.fouls = (homeStats.fouls / mc).toFixed(1);
      homeStats.yellowCards = (homeStats.yellowCards / mc).toFixed(1);
      homeStats.redCards = (homeStats.redCards / mc).toFixed(2);
      homeStats.defensiveDuelsWon = (homeStats.defensiveDuelsWon / mc).toFixed(1);
      homeStats.dribbledPast = (homeStats.dribbledPast / mc).toFixed(1);
      homeStats.totalDuels = ((homeStats.defensiveDuelsWon * mc + homeStats.dribbledPast * mc) / mc).toFixed(1);
      homeStats.defDuelWinRate = (homeStats.defensiveDuelsWon * mc + homeStats.dribbledPast * mc > 0) ? ((homeStats.defensiveDuelsWon * mc / (homeStats.defensiveDuelsWon * mc + homeStats.dribbledPast * mc)) * 100).toFixed(1) : "0";
      homeStats.shotsBlocked = (homeStats.shotsBlocked / mc).toFixed(1);
      homeStats.ownGoals = (homeStats.ownGoals / mc).toFixed(2);

      awayStats.goals = (awayStats.goals / mc).toFixed(2);
      awayStats.xG = (awayStats.xG / mc).toFixed(2);
      awayStats.shots = (awayStats.shots / mc).toFixed(1);
      awayStats.shotsOnTarget = (awayStats.shotsOnTarget / mc).toFixed(1);
      awayStats.shotAccuracy = awayStats.shots > 0 ? ((awayStats.shotsOnTarget / awayStats.shots) * 100).toFixed(1) : "0";
      awayStats.possession = (awayStats.possession / mc).toFixed(1);
      awayStats.passes = (awayTotalPasses / mc).toFixed(0);
      awayStats.passAccuracy = awayTotalPasses > 0 ? ((awayAccuratePasses / awayTotalPasses) * 100).toFixed(1) : "0";
      awayStats.crosses = (awayTotalCrosses / mc).toFixed(1);
      awayStats.crossAccuracy = awayTotalCrosses > 0 ? ((awayAccurateCrosses / awayTotalCrosses) * 100).toFixed(1) : "0";
      awayStats.fouls = (awayStats.fouls / mc).toFixed(1);
      awayStats.yellowCards = (awayStats.yellowCards / mc).toFixed(1);
      awayStats.redCards = (awayStats.redCards / mc).toFixed(2);
      awayStats.defensiveDuelsWon = (awayStats.defensiveDuelsWon / mc).toFixed(1);
      awayStats.dribbledPast = (awayStats.dribbledPast / mc).toFixed(1);
      awayStats.totalDuels = ((awayStats.defensiveDuelsWon * mc + awayStats.dribbledPast * mc) / mc).toFixed(1);
      awayStats.defDuelWinRate = (awayStats.defensiveDuelsWon * mc + awayStats.dribbledPast * mc > 0) ? ((awayStats.defensiveDuelsWon * mc / (awayStats.defensiveDuelsWon * mc + awayStats.dribbledPast * mc)) * 100).toFixed(1) : "0";
      awayStats.shotsBlocked = (awayStats.shotsBlocked / mc).toFixed(1);
      awayStats.ownGoals = (awayStats.ownGoals / mc).toFixed(2);

      function summarizeXI(values) {
        if (!values.length) return { min: "-", max: "-", avg: "-" };
        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        return { min, max, avg: avg.toFixed(1) };
      }

      homeStats.xiOverall = summarizeXI(homeXIValues);
      awayStats.xiOverall = summarizeXI(awayXIValues);

      return { home: homeStats, away: awayStats };
    }

    function calculatePlayerStats() {
      if (allMatches.length === 0) return null;

      const playerAggregates = {};

      allMatches.forEach((match) => {
        const home = match.report?.home;
        if (!home || !home.playersStats) return;

        home.playersStats.forEach((player) => {
          const pid = String(player.playerId);

          if (!playerAggregates[pid]) {
            const cachedName = playerNamesCache[pid];
            const playerName = cachedName || `Player ${pid}`;

            playerAggregates[pid] = {
              playerId: pid,
              playerName: playerName,
              appearances: 0,
              goals: 0, assists: 0, xG: 0, shots: 0, shotsOnTarget: 0, chancesCreated: 0,
              passes: 0, passesAccurate: 0, crosses: 0, crossesAccurate: 0, dribblingSuccess: 0,
              dribbledPast: 0, defensiveDuelsWon: 0, defensiveDuelsTotal: 0, clearances: 0,
              shotsInterceptions: 0, shotsIntercepted: 0, fouls: 0, foulsSuffered: 0, yellowCards: 0, redCards: 0,
              ownGoals: 0, saves: 0, goalsConceded: 0, ratingSum: 0, positions: new Set(),
            };
          }

          const agg = playerAggregates[pid];
          agg.appearances++;
          agg.goals += player.goals || 0;
          agg.assists += player.assists || 0;
          agg.xG += player.xG || 0;
          agg.shots += player.shots || 0;
          agg.shotsOnTarget += player.shotsOnTarget || 0;
          agg.chancesCreated += player.chancesCreated || 0;
          agg.passes += player.passes || 0;
          agg.passesAccurate += player.passesAccurate || 0;
          agg.crosses += player.crosses || 0;
          agg.crossesAccurate += player.crossesAccurate || 0;
          agg.dribblingSuccess += player.dribblingSuccess || 0;
          agg.dribbledPast += player.dribbledPast || 0;
          agg.defensiveDuelsWon += player.defensiveDuelsWon || 0;
          agg.defensiveDuelsTotal += (player.defensiveDuelsWon || 0) + (player.dribbledPast || 0);
          agg.clearances += player.clearances || 0;
          agg.shotsInterceptions += player.shotsInterceptions || 0;
          agg.shotsIntercepted += player.shotsIntercepted || 0;
          agg.fouls += player.foulsCommitted || 0;
          agg.foulsSuffered += player.foulsSuffered || 0;
          agg.yellowCards += player.yellowCards || 0;
          agg.redCards += player.redCards || 0;
          agg.ownGoals += player.ownGoals || 0;
          agg.saves += player.saves || 0;
          agg.goalsConceded += player.goalsConceded || 0;
          agg.ratingSum += player.rating || 0;

          if (player.position) {
            agg.positions.add(player.position);
          }
        });
      });

      return playerAggregates;
    }

    function aggregateTeamStats(playersStats) {
      if (!playersStats) return null;

      const stats = {
        goals: 0, assists: 0, xG: 0, shots: 0, shotsOnTarget: 0, passes: 0, passesAccurate: 0,
        crosses: 0, crossesAccurate: 0, chancesCreated: 0, fouls: 0, yellowCards: 0, redCards: 0,
        avgRating: 0, defensiveDuelsWon: 0, dribbledPast: 0, shotsBlocked: 0, ownGoals: 0,
      };

      playersStats.forEach((player) => {
        stats.goals += player.goals || 0;
        stats.assists += player.assists || 0;
        stats.xG += player.xG || 0;
        stats.shots += player.shots || 0;
        stats.shotsOnTarget += player.shotsOnTarget || 0;
        stats.passes += player.passes || 0;
        stats.passesAccurate += player.passesAccurate || 0;
        stats.crosses += player.crosses || 0;
        stats.crossesAccurate += player.crossesAccurate || 0;
        stats.chancesCreated += player.chancesCreated || 0;
        stats.fouls += player.foulsCommitted || 0;
        stats.yellowCards += player.yellowCards || 0;
        stats.redCards += player.redCards || 0;
        stats.avgRating += player.rating || 0;
        stats.defensiveDuelsWon += player.defensiveDuelsWon || 0;
        stats.dribbledPast += player.dribbledPast || 0;
        stats.shotsBlocked += player.shotsInterceptions || 0;
        stats.ownGoals += player.ownGoals || 0;
      });

      stats.avgRating = (stats.avgRating / playersStats.length).toFixed(2);

      return stats;
    }

    function sortPlayers(playerAggregates) {
      const players = Object.values(playerAggregates);
      const col = playerDetailSort.column;
      const asc = playerDetailSort.asc;

      players.sort((a, b) => {
        let valA, valB;

        switch (col) {
          case "name": valA = a.playerName; valB = b.playerName; break;
          case "positions": valA = getPositionSortValue(a.positions); valB = getPositionSortValue(b.positions); break;
          case "apps": valA = a.appearances; valB = b.appearances; break;
          case "rating": valA = a.ratingSum / a.appearances; valB = b.ratingSum / b.appearances; break;
          case "goals": valA = a.goals; valB = b.goals; break;
          case "assists": valA = a.assists; valB = b.assists; break;
          case "goalContribution": valA = a.goals + a.assists; valB = b.goals + b.assists; break;
          case "xg": valA = a.xG; valB = b.xG; break;
          case "xgDiff": valA = a.goals - a.xG; valB = b.goals - b.xG; break;
          case "conversionRate": valA = a.shots > 0 ? a.goals / a.shots : 0; valB = b.shots > 0 ? b.goals / b.shots : 0; break;
          case "xgPerShot": valA = a.shots > 0 ? a.xG / a.shots : 0; valB = b.shots > 0 ? b.xG / b.shots : 0; break;
          case "shots": valA = a.shots; valB = b.shots; break;
          case "sot": valA = a.shotsOnTarget; valB = b.shotsOnTarget; break;
          case "shotAcc": valA = a.shots > 0 ? a.shotsOnTarget / a.shots : 0; valB = b.shots > 0 ? b.shotsOnTarget / b.shots : 0; break;
          case "chancesCreated": valA = a.chancesCreated; valB = b.chancesCreated; break;
          case "keyPassRate": valA = a.passes > 0 ? a.chancesCreated / a.passes : 0; valB = b.passes > 0 ? b.chancesCreated / b.passes : 0; break;
          case "passes": valA = a.passes; valB = b.passes; break;
          case "passAcc": valA = a.passes > 0 ? a.passesAccurate / a.passes : 0; valB = b.passes > 0 ? b.passesAccurate / b.passes : 0; break;
          case "crosses": valA = a.crosses; valB = b.crosses; break;
          case "crossAcc": valA = a.crosses > 0 ? a.crossesAccurate / a.crosses : 0; valB = b.crosses > 0 ? b.crossesAccurate / b.crosses : 0; break;
          case "dribbles": valA = a.dribblingSuccess; valB = b.dribblingSuccess; break;
          case "dribbledPast": valA = a.dribbledPast; valB = b.dribbledPast; break;
          case "defDuels": valA = a.defensiveDuelsTotal > 0 ? a.defensiveDuelsWon / a.defensiveDuelsTotal : 0; valB = b.defensiveDuelsTotal > 0 ? b.defensiveDuelsWon / b.defensiveDuelsTotal : 0; break;
          case "clearances": valA = a.clearances; valB = b.clearances; break;
          case "blocks": valA = a.shotsInterceptions; valB = b.shotsInterceptions; break;
          case "shotsIntercepted": valA = a.shotsIntercepted; valB = b.shotsIntercepted; break;
          case "progressive": valA = a.passesAccurate + a.dribblingSuccess; valB = b.passesAccurate + b.dribblingSuccess; break;
          case "fouls": valA = a.fouls; valB = b.fouls; break;
          case "foulsSuffered": valA = a.foulsSuffered; valB = b.foulsSuffered; break;
          case "yc": valA = a.yellowCards; valB = b.yellowCards; break;
          case "rc": valA = a.redCards; valB = b.redCards; break;
          case "ownGoals": valA = a.ownGoals; valB = b.ownGoals; break;
          case "saves": valA = a.saves; valB = b.saves; break;
          case "goalsConceded": valA = a.goalsConceded; valB = b.goalsConceded; break;
          default: valA = a.ratingSum / a.appearances; valB = b.ratingSum / b.appearances;
        }

        if (typeof valA === "string") {
          return asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }

        return asc ? valA - valB : valB - valA;
      });

      return players;
    }
