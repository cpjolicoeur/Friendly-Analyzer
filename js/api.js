    async function fetchSquadIdFromClubId(clubId) {
      const url = `${API_BASE}/clubs/${clubId}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch club ${clubId}: ${response.status}`);

      const text = await response.text();
      const pattern = ':[{"id":';
      const index = text.indexOf(pattern);

      if (index === -1) throw new Error("Squad ID not found in club data");

      const afterPattern = text.substring(index + pattern.length);
      const match = afterPattern.match(/^(\d+)/);

      if (!match) throw new Error("Could not parse squad ID");
      return match[1];
    }

    async function fetchMatchIds(squadId, limit) {
      const url = `${API_BASE}/matches?squadId=${squadId}&past=true&limit=${limit}&onlyFriendliesHome=true`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch matches: ${response.status}`);
      return await response.json();
    }

    async function fetchMatchReport(matchId) {
      const url = `${API_BASE}/matches/${matchId}/report`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch match ${matchId}: ${response.status}`);
      return await response.json();
    }

    async function fetchMatchFormations(matchId) {
      const url = `${API_BASE}/matches/${matchId}?withFormations=true`;
      try {
        const response = await fetch(url);
        if (!response.ok) return null;
        return await response.json();
      } catch (e) {
        console.warn(`Failed to fetch formations for match ${matchId}:`, e);
        return null;
      }
    }
