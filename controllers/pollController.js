
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
