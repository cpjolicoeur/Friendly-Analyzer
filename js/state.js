    const API_BASE = "https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod";
    const POSITION_ORDER = ["GK", "RB", "RWB", "CB", "LB", "LWB", "CDM", "DM", "RM", "LM", "CM", "CAM", "AM", "RW", "LW", "CF", "ST"];

    let allMatches = [];
    let clubId = null;
    let clubName = null;
    let squadId = null;
    let playerDetailSort = { column: "rating", asc: false };
    let playerNamesCache = {};
    let savedAnalyses = [];
    let selectedAnalysesForComparison = [];
    let comparisonHiddenPlayerIds = new Set();
    let comparisonSortState = {
      left: { column: "rating", asc: false },
      right: { column: "rating", asc: false },
    };
    
    let hiddenPlayerRows = new Set();
    let hiddenPlayerCols = new Set();
    let currentMatchFilter = "all";
    let derivedCache = { teamStats: null, playerStats: null, dirty: true };
