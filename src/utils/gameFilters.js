export function filterGamesByTeams(games, teamA, teamB) {
  if (teamA && teamB) {
    return games.filter(game =>
      (game.home_team.includes(teamA) && game.visitor_team.includes(teamB)) ||
      (game.home_team.includes(teamB) && game.visitor_team.includes(teamA))
    )
  } else if (teamA || teamB) {
    const teamNames = [teamA, teamB].filter(Boolean)
    return games.filter(game =>
      teamNames.some(team =>
        game.home_team.includes(team) || game.visitor_team.includes(team)
      )
    )
  }
  return games
}

export function filterTiedGames(games) {
  return games.filter(game => game.has_ot === true)
}

export function sortGamesByDate(games, descending = true) {
  return [...games].sort((a, b) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    return descending ? (dateB - dateA) : (dateA - dateB)
  })
}