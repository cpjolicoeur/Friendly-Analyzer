async function fetchClubInfoFromClubId(clubId) {
  const url = `${API_BASE}/clubs/${clubId}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch club ${clubId}: ${response.status}`);

  const text = await response.text();
  let clubData = null;
  let clubName = null;
  let squadId = null;

  try {
    clubData = JSON.parse(text);
    clubName = clubData?.name || clubData?.club?.name || clubData?.data?.name || null;
    squadId = clubData?.squadId || clubData?.squad?.id || clubData?.squads?.[0]?.id || null;
  } catch (e) {
    clubData = null;
  }

  const pattern = ':[{"id":';
  const index = text.indexOf(pattern);

  if (index === -1 && !squadId) throw new Error("Squad ID not found in club data");

  if (!squadId) {
    const afterPattern = text.substring(index + pattern.length);
    const match = afterPattern.match(/^(\d+)/);

    if (!match) throw new Error("Could not parse squad ID");
    squadId = match[1];
  }

  if (!clubName) {
    const nameMatch = text.match(/"name"\s*:\s*"([^"]+)"/);
    if (nameMatch) {
      clubName = nameMatch[1];
    }
  }

  return { squadId: String(squadId), clubName };
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
