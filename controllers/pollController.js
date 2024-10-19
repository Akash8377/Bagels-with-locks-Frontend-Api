
const AppError = require("../utils/appError");
const { validationResult } = require("express-validator");
require("dotenv").config();
const conn = require("../services/db");
const axios = require('axios');

const apiKey = process.env.ODDS_API_KEY; // Store API key in .env file
const timeZones = {
    "India": "Asia/Kolkata",
    "USA": "America/New_York", // New York Time
    "Brazil": "America/Sao_Paulo",
    // Add more time zones as needed
  };

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

exports.getTeams = async (req, res, next) => {
    try {
        const apiKey = process.env.ODDS_API_KEY;
        const apiUrl = `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds?regions=us&markets=h2h,spreads,totals&oddsFormat=american&apiKey=${apiKey}`;

        // Making the API request
        const response = await axios.get(apiUrl);

        const matches = response.data.map(match => {
            let matchDate = null;
            if (match.commence_time) {
                try {
                    // Convert the commence_time to a valid Date object
                    matchDate = new Date(match.commence_time * 1000); // assuming the API returns Unix timestamp in seconds
                    if (isNaN(matchDate)) {
                        throw new Error("Invalid commence_time value");
                    }
                } catch (error) {
                    console.error('Error parsing commence_time:', error);
                    matchDate = null;
                }
            }

            // Format the match date for different time zones
            const formattedDates = {};
            for (const [location, timeZone] of Object.entries(timeZones)) {
                if (matchDate) {
                    formattedDates[location] = format(matchDate, "yyyy-MM-dd HH:mm:ssXXX", { timeZone });
                } else {
                    formattedDates[location] = "N/A"; // Handle invalid dates
                }
            }

            // Getting odds for each team
            const homeTeamOdds = match.bookmakers[0]?.markets[0]?.outcomes?.find(outcome => outcome.name === match.home_team)?.price || 'N/A';
            const awayTeamOdds = match.bookmakers[0]?.markets[0]?.outcomes?.find(outcome => outcome.name === match.away_team)?.price || 'N/A';

            return {
                id: match.id,
                home_team: match.home_team,
                away_team: match.away_team,
                commence_time: match.commence_time,
                match_date: formattedDates, // Include formatted dates for different time zones
                home_team_odds: homeTeamOdds, // Include odds data for home team
                away_team_odds: awayTeamOdds, // Include odds data for away team
            };
        });

        res.status(200).json(matches);
    } catch (error) {
        console.error('Error fetching teams:', error.message);
        next(new AppError('Failed to fetch teams', 500));
    }
};

// Get home and away teams from Odds API
// exports.getTeams = async (req, res, next) => {
//   try {
//       const sport = 'americanfootball_nfl'; // Example sport
//       const region = 'us'; // Example region
//       const markets = 'h2h'; // Head-to-head market for win/loss odds

//       const response = await axios.get(`https://api.the-odds-api.com/v4/sports/${sport}/odds`, {
//           params: {
//               apiKey: apiKey,
//               regions: region,
//               markets: markets,
//           },
//       });

//       // Log the API response to check the structure
//       //console.log(response.data);

//       const matches = response.data.map(match => {
//           // Get match date and time
//           const matchDate = new Date(match.commence_time);
//           const dayOfWeek = matchDate.toLocaleDateString('en-US', { weekday: 'long' });
//           const formattedDate = matchDate.toLocaleDateString('en-US'); // Date in MM/DD/YYYY format
//           const formattedTime = matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

//           // Ensure win rates are properly checked before access
//           const homeWinRate = match.home_team_win_rate ? match.home_team_win_rate : 0;
//           const awayWinRate = match.away_team_win_rate ? match.away_team_win_rate : 0;

//           return {
//               id: match.id,
//               home_team: match.home_team,
//               away_team: match.away_team,
//               match_date: formattedDate,
//               match_time: formattedTime,
//               match_day: dayOfWeek,
//               home_win_rate: homeWinRate,
//               away_win_rate: awayWinRate,
//           };
//       });

//       res.status(200).json(matches);
//   } catch (error) {
//       console.error('Error fetching teams:', error); // Log the actual error message
//       next(new AppError('Failed to fetch teams', 500));
//   }
// };



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

exports.submitSelection = async (req, res) => {
  const matchId = req.params.id; 
  const { selectedTeam, userId, match_date, username, email, phone } = req.body; // Retrieve selected team and user details from the body

  // Validate inputs
  if (!matchId || !selectedTeam || !userId || !match_date || !username || !email || !phone) {
      return res.status(400).json({
          status: 'error',
          message: 'Match ID, selected team, user ID, match date, username, email, and phone are required',
      });
  }

  // Get the current week using the provided function
  const currentWeek = getCurrentWeek();

  console.log(currentWeek, "current week");
  
  if (!currentWeek) {
      return res.status(400).json({
          status: 'error',
          message: 'No active NFL week found for the current date.',
      });
  }

  // Check if the user has made a selection in the last week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const checkRecentSelectionQuery = `
      SELECT * FROM user_selections 
      WHERE user_id = ? AND match_date >= ?
  `;

  conn.query(checkRecentSelectionQuery, [userId, weekAgo], (err, recentResults) => {
      if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
              status: 'error',
              message: 'Failed to check recent user selections',
          });
      }

      if (recentResults.length > 0) {
          const lastSelection = recentResults[0];
          return res.json({
              status: 'info',
              message: 'User cannot select a team for this match within one week of their last selection. Please try again later.',
              matchData: {
                  match_id: lastSelection.match_id,
                  selected_team: lastSelection.selected_team,
                  match_date: lastSelection.match_date,
                  result: lastSelection.result,
              }
          });
      }

      // Check the last selection result for the user
      const checkLastSelectionQuery = `
          SELECT selected_team, result FROM user_selections 
          WHERE user_id = ? ORDER BY match_date DESC LIMIT 1
      `;

      conn.query(checkLastSelectionQuery, [userId], (err, lastResults) => {
          if (err) {
              console.error('Database error:', err);
              return res.status(500).json({
                  status: 'error',
                  message: 'Failed to check user selection',
              });
          }

          if (lastResults.length > 0) {
              const lastResult = lastResults[0].result;

              // Check if the last result is pending (0) or lost (1)
              if (lastResult === 0 || lastResult === 1) {
                  console.log(`User has been eliminated from the pool. Last result was ${lastResult === 0 ? 'pending' : 'lost'}.`);
                  return res.json({
                      status: 'info',
                      message: 'You have been eliminated from the pool due to your last team result.',
                  });
              }

              // Ensure the user cannot select the same team again if they have won (3) or tied (2)
              if (lastResult === 2 || lastResult === 3) {
                  console.log(`User's last team result was ${lastResult === 2 ? 'tie' : 'win'}.`);
                  if (lastResults[0].selected_team === selectedTeam) {
                      console.log('User cannot select the same team again for a new match.');
                      return res.json({
                          status: 'info',
                          message: 'You cannot select the same team again for a new match.',
                      });
                  }
              }
          }

          // No existing selection, proceed to insert the new selection
          const sqlQuery = `
              INSERT INTO user_selections (match_id, selected_team, user_id, match_date, username, email, phone, week_id) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `;

          conn.query(sqlQuery, [matchId, selectedTeam, userId, match_date, username, email, phone, currentWeek], (err, result) => {
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
      });
  });
};


// // to check user have selected team for this match previous

// exports.fetchUserSelections = (req, res) => {
//   const userId = req.params.userId; // Get user ID from URL params

//   if (!userId) {
//       return res.status(400).json({
//           status: 'error',
//           message: 'User ID is required',
//       });
//   }

//   // Query to get all selections made by the user
//   const sqlQuery = `SELECT * FROM user_selections WHERE user_id = ?`;

//   conn.query(sqlQuery, [userId], (err, results) => {
//       if (err) {
//           console.error('Database error:', err);
//           return res.status(500).json({
//               status: 'error',
//               message: 'Failed to retrieve user selections from the database',
//           });
//       }

//       if (results.length === 0) {
//           return res.status(404).json({
//               status: 'error',
//               message: 'No selections found for this user',
//           });
//       }

//       return res.status(200).json({
//           status: 'success',
//           data: results,
//       });
//   });
// };

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


// exports.submitSelection = async (req, res) => {
//     const matchId = req.params.id;
//     const { selectedTeam, userId, match_date, username, email, phone } = req.body; // Retrieve selected team and user details from the body

//     // Validate inputs
//     if (!matchId || !selectedTeam || !userId || !match_date || !username || !email || !phone) {
//         return res.status(400).json({
//             status: 'error',
//             message: 'Match ID, selected team, user ID, match date, username, email, and phone are required',
//         });
//     }

//     // Get the current week based on the match date
//     const weekId = getWeekIdFromDate(match_date); // You can implement this function to map match_date to week_id

//     if (!weekId) {
//         return res.status(400).json({
//             status: 'error',
//             message: 'No active NFL week found for the provided match date.',
//         });
//     }

//     // Check if the user has already selected a team in the current week
//     const checkCurrentWeekQuery = `
//         SELECT * FROM user_selections 
//         WHERE user_id = ? AND week_id = ?
//     `;

//     conn.query(checkCurrentWeekQuery, [userId, weekId], (err, currentWeekSelections) => {
//         if (err) {
//             console.error('Database error:', err);
//             return res.status(500).json({
//                 status: 'error',
//                 message: 'Failed to check user selections for the current week',
//             });
//         }

//         if (currentWeekSelections.length > 0) {
//             return res.status(400).json({
//                 status: 'error',
//                 message: 'You have already selected a team for this week.',
//             });
//         }

//         // Check the user's last result
//         const checkLastSelectionQuery = `
//             SELECT selected_team, result, week_id FROM user_selections 
//             WHERE user_id = ? 
//             ORDER BY match_date DESC LIMIT 1
//         `;

//         conn.query(checkLastSelectionQuery, [userId], (err, lastResults) => {
//             if (err) {
//                 console.error('Database error:', err);
//                 return res.status(500).json({
//                     status: 'error',
//                     message: 'Failed to check user selection',
//                 });
//             }

//             if (lastResults.length > 0) {
//                 const lastResult = lastResults[0].result;

//                 // If the last result was a loss (1), the user is out of the pool
//                 if (lastResult === 1) {
//                     return res.status(400).json({
//                         status: 'error',
//                         message: 'You have been eliminated from the pool due to your last team result (loss).',
//                     });
//                 }

//                 // If the last result was a tie (2) or win (3), they can select a team, but not the same team
//                 if (lastResult === 2 || lastResult === 3) {
//                     if (lastResults[0].selected_team === selectedTeam) {
//                         return res.status(400).json({
//                             status: 'error',
//                             message: 'You cannot select the same team again for a new match after a tie or win.',
//                         });
//                     }

//                     // Ensure the user selects only for the next week
//                     if (lastResults[0].week_id >= weekId) {
//                         return res.status(400).json({
//                             status: 'error',
//                             message: 'You can only select a team for the next week.',
//                         });
//                     }
//                 }
//             }

//             // No issues, proceed to insert the new selection
//             const insertSelectionQuery = `
//                 INSERT INTO user_selections (match_id, selected_team, user_id, match_date, username, email, phone, week_id) 
//                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
//             `;

//             conn.query(insertSelectionQuery, [matchId, selectedTeam, userId, match_date, username, email, phone, weekId], (err, result) => {
//                 if (err) {
//                     console.error('Database error:', err);
//                     return res.status(500).json({
//                         status: 'error',
//                         message: 'Failed to save selection to the database',
//                     });
//                 }

//                 return res.status(200).json({
//                     status: 'success',
//                     message: 'Selection submitted successfully!',
//                 });
//             });
//         });
//     });
// };