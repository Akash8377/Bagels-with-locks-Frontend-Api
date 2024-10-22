
const AppError = require("../utils/appError");
const { validationResult } = require("express-validator");
require("dotenv").config();
const conn = require("../services/db");
const axios = require('axios');

const apiKey = process.env.ODDS_API_KEY; // Store API key in .env file


const nflWeeks = [
  { week: '1', startDate: '2024-09-05', endDate: '2024-09-11' },
  { week: '2', startDate: '2024-09-12', endDate: '2024-09-18' },
  { week: '3', startDate: '2024-09-19', endDate: '2024-09-25' },
  { week: '4', startDate: '2024-09-26', endDate: '2024-10-02' },
  { week: '5', startDate: '2024-10-03', endDate: '2024-10-09' },
  { week: '6', startDate: '2024-10-10', endDate: '2024-10-16' },
  { week: '7', startDate: '2024-10-17', endDate: '2024-10-23' },
  { week: '8', startDate: '2024-10-24', endDate: '2024-10-29' },
  { week: '9', startDate: '2024-10-31', endDate: '2024-11-06' },
  { week: '10', startDate: '2024-11-07', endDate: '2024-11-13' },
  { week: '11', startDate: '2024-11-14', endDate: '2024-11-20' },
  { week: '12', startDate: '2024-11-21', endDate: '2024-11-23' },
  { week: '13', startDate: '2024-11-28', endDate: '2024-12-04' },
  { week: '14', startDate: '2024-12-05', endDate: '2024-12-11' },
  { week: '15', startDate: '2024-12-12', endDate: '2024-12-18' },
  { week: '16', startDate: '2024-12-19', endDate: '2024-12-25' },
  { week: '17', startDate: '2024-12-26', endDate: '2025-01-01' },
  { week: '18', startDate: '2025-01-02', endDate: '2025-01-05' }
];

// Get home and away teams from Odds API
exports.getTeams = async (req, res, next) => {
  try {
      const sport = 'americanfootball_nfl'; // Example sport
      const region = 'us'; // Example region
      const markets = 'h2h'; // Head-to-head market for win/loss odds

      const response = await axios.get(`https://api.the-odds-api.com/v4/sports/${sport}/odds`, {
          params: {
              apiKey: apiKey,
              regions: region,
              markets: markets,
          },
      });

      // Log the API response to check the structure
      //console.log(response.data);

      const matches = response.data.map(match => {
          // Get match date and time
          const matchDate = new Date(match.commence_time);
          const dayOfWeek = matchDate.toLocaleDateString('en-US', { weekday: 'long' });
          const formattedDate = matchDate.toLocaleDateString('en-US'); // Date in MM/DD/YYYY format
          const formattedTime = matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

          // Ensure win rates are properly checked before access
          const homeWinRate = match.home_team_win_rate ? match.home_team_win_rate : 0;
          const awayWinRate = match.away_team_win_rate ? match.away_team_win_rate : 0;

          return {
              id: match.id,
              home_team: match.home_team,
              away_team: match.away_team,
              match_date: formattedDate,
              match_time: formattedTime,
              match_day: dayOfWeek,
              home_win_rate: homeWinRate,
              away_win_rate: awayWinRate,
          };
      });

      res.status(200).json(matches);
  } catch (error) {
      console.error('Error fetching teams:', error); // Log the actual error message
      next(new AppError('Failed to fetch teams', 500));
  }
};



// Function to get the current week based on today's date
function getCurrentWeek() {
  const today = new Date();  // Get today's date and time
  today.setHours(0, 0, 0, 0);  

  console.log("Today's Date:", today);

  for (const week of nflWeeks) {
      const startDate = new Date(week.startDate);
      const endDate = new Date(week.endDate);
      
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);  

      console.log(`Checking week ${week.week}: Start Date: ${startDate}, End Date: ${endDate}`);

      if (today >= startDate && today <= endDate) {
          console.log(`Current week found: ${week.week}`);
          return week.week;
      }
  }
  console.log("No active NFL week found.");
  return null; 
}


exports.fetchUserSelections = async (req, res) => {
    const userId = req.params.userId; // Get user ID from URL params

    if (!userId) {
        return res.status(400).json({
            status: 'error',
            message: 'User ID is required',
        });
    }

    // Get the current week using the provided function
    const currentWeek = getCurrentWeek();

    if (!currentWeek) {
        return res.status(400).json({
            status: 'error',
            message: 'No active NFL week found for the current date.',
        });
    }

    // Query to get all selections made by the user for the current week
    const sqlQuery = `
        SELECT * FROM user_selections 
        WHERE user_id = ? AND week_id = ?
    `;

    conn.query(sqlQuery, [userId, currentWeek], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve user selections from the database',
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'No selections found for this user in the current week',
            });
        }

        return res.status(200).json({
            status: 'success',
            data: results,
        });
    });
};


exports.fetchLeaderboard = (req, res) =>{

  const sqlQuery = `
    SELECT user_id, username, SUM(result) AS total_points 
    FROM
    user_selections
    GROUP BY 
    user_id, username
    ORDER BY
      total_points DESC
  `;
  console.log('Executing SQL query:', sqlQuery);

    conn.query(sqlQuery, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve leaderboard data from the database',
            });
        }

        // Log the results to check if any data is fetched
        console.log('Query Results:', results);

        if (results.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'No users found with a result greater than 0',
            });
        }

        return res.status(200).json({
            status: 'success',
            data: results,
        });
    });
}


const moment = require('moment-timezone'); // Use moment for time zone and date handling

exports.submitSelection = async (req, res) => {
    const matchId = req.params.id; // matchId from the route parameter
    const { selectedTeam, userId, match_date, username, email, phone } = req.body; // Get selected team and user details from the request body

    // Validate inputs
    if (!matchId || !selectedTeam || !userId || !match_date || !username || !email || !phone) {
        return res.status(400).json({
            status: 'error',
            message: 'Match ID, selected team, user ID, match date, username, email, and phone are required',
        });
    }

    // Get the current week and validate if it exists
    const currentWeek = getCurrentWeek();
    if (!currentWeek) {
        return res.status(400).json({
            status: 'error',
            message: 'No active NFL week found for the current date.',
        });
    }

    // Check the deadline (Thursday 4 PM)
    const now = moment(); // current time
    const thursdayDeadline = moment.tz('America/New_York').day(4).hour(16).minute(0).second(0); // Thursday 4 PM

    // Check if the user has pending (result=0) or lost (result=1) matches
    const checkResultsQuery = `
        SELECT result FROM user_selections 
        WHERE user_id = ? AND week_id <> ?
    `;

    conn.query(checkResultsQuery, [userId, currentWeek], (err, resultRows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({
                status: 'error',
                message: 'Failed to check user results',
            });
        }

        // Check if any result is pending (0) or lost (1)
        const hasPendingOrLoseResult = resultRows.some(row => row.result === 0 || row.result === 1);

        if (hasPendingOrLoseResult) {
            return res.status(400).json({
                status: 'error',
                message: 'You cannot select a new team as you have pending or lost results from previous weeks.',
            });
        }

        // Check if the user has already selected the same team in any previous week
        const checkSameTeamQuery = `
            SELECT selected_team FROM user_selections 
            WHERE user_id = ? AND selected_team = ?
        `;

        conn.query(checkSameTeamQuery, [userId, selectedTeam], (err, sameTeamResults) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    status: 'error',
                    message: 'Failed to check previous team selections',
                });
            }

            // If the same team was found in previous weeks, prevent the selection
            if (sameTeamResults.length > 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'You cannot select the same team as you have already selected in a previous week.',
                });
            }

            // Check if the user won or tied with the same team in any previous week
            const checkPreviousSelectionQuery = `
                SELECT selected_team, result, week_id FROM user_selections 
                WHERE user_id = ?
            `;

            conn.query(checkPreviousSelectionQuery, [userId], (err, previousResults) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        status: 'error',
                        message: 'Failed to check previous selections',
                    });
                }

                // Prevent the user from selecting the same team if they won or tied with it
                const previousResult = previousResults.find(result => 
                    (result.result === 3 || result.result === 2) && 
                    result.selected_team === selectedTeam && 
                    result.week_id !== currentWeek // Exclude current week from the check
                );
                
                if (previousResult) {
                    return res.status(400).json({
                        status: 'error',
                        message: 'You cannot select the same team as you won or tied with in a previous week.',
                    });
                }

                // If it's before the deadline, allow team selection
                if (now.isBefore(thursdayDeadline)) {
                    // Check if the user has already selected a team for the current week
                    const checkSelectionQuery = `
                        SELECT * FROM user_selections 
                        WHERE user_id = ? AND week_id = ?
                    `;

                    conn.query(checkSelectionQuery, [userId, currentWeek], (err, results) => {
                        if (err) {
                            console.error('Database error:', err);
                            return res.status(500).json({
                                status: 'error',
                                message: 'Failed to check user selection',
                            });
                        }

                        if (results.length > 0) {
                            // Existing selection found, update the selected team, match date, and match ID
                            const updateSelectionQuery = `
                                UPDATE user_selections 
                                SET selected_team = ?, match_date = ?, match_id = ?
                                WHERE user_id = ? AND week_id = ?
                            `;

                            conn.query(updateSelectionQuery, [selectedTeam, match_date, matchId, userId, currentWeek], (err, updateResult) => {
                                if (err) {
                                    console.error('Database error:', err);
                                    return res.status(500).json({
                                        status: 'error',
                                        message: 'Failed to update selection in the database',
                                    });
                                }

                                return res.status(200).json({
                                    status: 'success',
                                    message: 'Selection updated successfully!',
                                });
                            });

                        } else {
                            // No existing selection, insert a new selection
                            const insertSelectionQuery = `
                                INSERT INTO user_selections (match_id, selected_team, user_id, match_date, username, email, phone, week_id) 
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                            `;

                            conn.query(insertSelectionQuery, [matchId, selectedTeam, userId, match_date, username, email, phone, currentWeek], (err, insertResult) => {
                                if (err) {
                                    console.error('Database error:', err);
                                    return res.status(500).json({
                                        status: 'error',
                                        message: 'Failed to save selection to the database',
                                    });
                                }

                                return res.status(200).json({
                                    status: 'success',
                                    message: 'Selection submitted successfully!',
                                });
                            });
                        }
                    });
                } else {
                    // It's past the deadline, prevent new selections after Thursday
                    return res.status(400).json({
                        status: 'error',
                        message: 'You cannot make changes after the Thursday 4 PM deadline.',
                    });
                }
            });
        });
    });
};

// for dasbboard

exports.fetchUserTeamswithPoints = async (req, res) => {
    const sqlQuery = `
        SELECT 
            week_id,
            user_id,
            username,
            selected_team,
            result
        FROM user_selections
        ORDER BY week_id, user_id
    `;

    console.log('Executing SQL query', sqlQuery);

    conn.query(sqlQuery, (err, result) => {
        if (err) {
            console.log('Database error', err);
            return res.status(500).json({
                status: 'error',
                message: "Failed to retrieve user data from database",
            });
        }
        console.log('Query Results', result);

        if (result.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'No user found with selected team',
            });
        }

        // Organize results by week and accumulate teams
        const weeklyData = {};
        const userTeams = {}; // To accumulate teams across weeks

        result.forEach(row => {
            const weekKey = `week${row.week_id}`;
            if (!weeklyData[weekKey]) {
                weeklyData[weekKey] = [];
            }

            // Initialize userTeams for this user if not already
            if (!userTeams[row.user_id]) {
                userTeams[row.user_id] = {
                    username: row.username,
                    total_points: 0,
                    teams: [],
                    weekTeams: {} // To track teams by week
                };
            }

            // Calculate points for this team based on result value
            const teamPoints = row.result; // Assuming result contains points directly
            userTeams[row.user_id].total_points += teamPoints; // Accumulate total points

            // Store the team and its points for the current week
            if (!userTeams[row.user_id].weekTeams[row.week_id]) {
                userTeams[row.user_id].weekTeams[row.week_id] = [];
            }

            userTeams[row.user_id].weekTeams[row.week_id].push({
                name: row.selected_team,
                points: teamPoints
            });
        });

        // Create leaderboard for each week
        Object.keys(userTeams).forEach(userId => {
            const user = userTeams[userId];
            const totalPointsByWeek = {}; // Total points for each week

            // Calculate cumulative points for each week based on teams
            Object.keys(user.weekTeams).forEach(weekId => {
                const teams = user.weekTeams[weekId];
                const teamEntries = teams.map(team => `${team.name} (${team.points})`).join(', ');
                totalPointsByWeek[weekId] = {
                    username: user.username,
                    total_points: user.total_points, // Total across all weeks
                    teams: teamEntries
                };
                weeklyData[`week${weekId}`].push(totalPointsByWeek[weekId]);
            });
        });

        // Sort each week's data by total points in descending order
        Object.keys(weeklyData).forEach(weekKey => {
            weeklyData[weekKey].sort((a, b) => b.total_points - a.total_points);
        });

        return res.status(200).json({
            status: 'success',
            data: weeklyData,
        });
    });
}




