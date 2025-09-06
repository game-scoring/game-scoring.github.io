/**
 * Shared Game Utilities
 * Common functionality for all game scoring pages
 */

class GameUtils {
    constructor(gameName, gameThemeColor = 'blue') {
        this.gameName = gameName;
        this.gameThemeColor = gameThemeColor;
        this.playerData = [];
    }

    /**
     * Create player name input HTML
     * @param {number} playerNum - Player number (1-based)
     * @param {string} themeColor - CSS color class (e.g., 'blue', 'red', 'purple')
     * @returns {string} HTML string for player name input
     */
    createPlayerNameInput(playerNum, themeColor = this.gameThemeColor) {
        return `
            <div class="flex items-center mb-6 pb-4 border-b border-gray-200">
                <div class="bg-${themeColor}-100 text-${themeColor}-800 rounded-full w-8 h-8 flex items-center justify-center font-semibold text-sm mr-3">
                    ${playerNum}
                </div>
                <div class="flex-1">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Player ${playerNum} Name:</label>
                    <input type="text" id="p${playerNum}_name" placeholder="Player ${playerNum}" value="Player ${playerNum}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${themeColor}-500 focus:border-${themeColor}-500"
                           onchange="gameUtils.updatePlayerName(${playerNum})">
                </div>
            </div>
        `;
    }

    /**
     * Get player name from input or default
     * @param {number} playerNum - Player number (1-based)
     * @returns {string} Player name
     */
    getPlayerName(playerNum) {
        const nameInput = document.getElementById(`p${playerNum}_name`);
        return nameInput ? (nameInput.value.trim() || `Player ${playerNum}`) : `Player ${playerNum}`;
    }

    /**
     * Update player name (called from input onChange)
     * @param {number} playerNum - Player number
     */
    updatePlayerName(playerNum) {
        // Trigger recalculation in the main game
        if (typeof calculateScores === 'function') {
            calculateScores();
        }
    }

    /**
     * Create winner display text with player names
     * @param {Array} sortedScores - Scores sorted by total (highest first)
     * @param {string} emoji - Winner emoji (default: 🏆)
     * @returns {string} Winner text
     */
    createWinnerText(sortedScores, emoji = '🏆') {
        const winner = sortedScores[0];
        const tiedPlayers = sortedScores.filter(p => p.total === winner.total);
        
        if (tiedPlayers.length > 1) {
            return `🤝 Tie between ${tiedPlayers.map(p => p.playerName).join(' and ')}!`;
        } else {
            return `${emoji} ${winner.playerName} Wins!`;
        }
    }

    /**
     * Create scores HTML display
     * @param {Array} sortedScores - Scores sorted by total (highest first)
     * @param {string} themeColor - CSS color class for winner highlight
     * @param {Function} formatScore - Optional function to format score display
     * @returns {string} HTML string for scores display
     */
    createScoresHTML(sortedScores, themeColor = this.gameThemeColor, formatScore = null) {
        return sortedScores.map((score, index) => {
            const scoreText = formatScore ? formatScore(score) : `${score.total} points`;
            return `
                <div class="flex justify-between items-center py-3 px-4 ${index === 0 ? `bg-${themeColor}-50 rounded-lg` : ''}">
                    <span class="font-medium">${index + 1}. ${score.playerName}</span>
                    <span class="font-semibold">${scoreText}</span>
                </div>
            `;
        }).join('');
    }

    /**
     * Save game session to unified storage
     * @param {Array} scores - Player scores with names and details
     * @param {Object} gameSpecificData - Game-specific scoring breakdown
     */
    saveGameSession(scores, gameSpecificData = {}) {
        try {
            const sortedScores = [...scores].sort((a, b) => b.total - a.total);
            const session = {
                id: this.generateId(),
                gameType: this.gameName,
                date: new Date().toISOString().split('T')[0],
                timestamp: new Date().toISOString(),
                players: scores.map(s => s.playerName),
                scores: scores,
                winner: sortedScores[0].playerName,
                gameSpecificData: gameSpecificData,
                finished: true
            };

            // Get existing sessions
            const sessions = JSON.parse(localStorage.getItem('unifiedGameSessions') || '[]');
            sessions.unshift(session);
            
            // Save with backup
            localStorage.setItem('unifiedGameSessions', JSON.stringify(sessions));
            localStorage.setItem('unifiedGameSessions_backup', JSON.stringify(sessions));
            
            return session;
        } catch (e) {
            console.error('Failed to save game session:', e);
            return null;
        }
    }

    /**
     * Add "Save Session" button to results section
     * @param {string} containerId - ID of container to add button to
     * @param {Array} scores - Current scores
     * @param {Object} gameSpecificData - Game-specific data to save
     */
    addSaveSessionButton(containerId, scores, gameSpecificData = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Remove existing save button if present
        const existingButton = container.querySelector('.save-session-btn');
        if (existingButton) {
            existingButton.remove();
        }

        // Only add button if there are valid scores
        const hasValidScores = scores.some(s => s.total > 0);
        if (!hasValidScores) return;

        const saveButton = document.createElement('button');
        saveButton.className = 'save-session-btn w-full mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium';
        saveButton.innerHTML = `
            <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            Save Game Session
        `;
        
        saveButton.onclick = () => {
            const session = this.saveGameSession(scores, gameSpecificData);
            if (session) {
                alert(`Game session saved! Winner: ${session.winner}`);
            } else {
                alert('Failed to save game session. Please try again.');
            }
        };

        container.appendChild(saveButton);
    }

    /**
     * Generate unique ID
     * @returns {string} Unique identifier
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Get all saved sessions for this game type
     * @returns {Array} Array of saved sessions
     */
    getSavedSessions() {
        try {
            const allSessions = JSON.parse(localStorage.getItem('unifiedGameSessions') || '[]');
            return allSessions.filter(session => session.gameType === this.gameName);
        } catch (e) {
            console.error('Failed to load saved sessions:', e);
            return [];
        }
    }
}

// Initialize global gameUtils variable when script loads
// This will be set by each game page with their specific game name and theme
let gameUtils = null;