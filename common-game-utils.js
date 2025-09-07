/* Game Scoring - Common JavaScript Utilities */

// Global variables that each game should set
let playerCount = 2;
let currentScores = [];

// Common utility functions
function getPlayerName(playerNum) {
    const nameInput = document.getElementById(`p${playerNum}_name`);
    return nameInput ? (nameInput.value.trim() || `Player ${playerNum}`) : `Player ${playerNum}`;
}

function updatePlayerCount() {
    playerCount = parseInt(document.getElementById('playerCount').value);
    generatePlayers();
    calculateScores();
}

// Create player name input HTML
function createPlayerNameInput(playerNum, color) {
    return `
        <div class="player-header">
            <div class="player-number bg-${color}-100 text-${color}-800">
                ${playerNum}
            </div>
            <div class="player-name-container">
                <label>Player ${playerNum} Name:</label>
                <input type="text" id="p${playerNum}_name" placeholder="Player ${playerNum}" value="Player ${playerNum}" class="focus:ring-${color}-500 focus:border-${color}-500">
            </div>
        </div>
    `;
}

// Create winner text with tie handling
function createWinnerText(scores) {
    const sortedScores = [...scores].sort((a, b) => b.total - a.total);
    const winner = sortedScores[0];
    
    const winnerName = winner.playerName || `Player ${winner.player}`;
    
    // Check for ties
    const tiedPlayers = sortedScores.filter(p => p.total === winner.total);
    if (tiedPlayers.length > 1) {
        const tiedNames = tiedPlayers.map(p => p.playerName || `Player ${p.player}`);
        return `🤝 Tie between ${tiedNames.join(' and ')}!`;
    }
    
    return `🏆 ${winnerName} Wins!`;
}

// Create scores HTML for results display
function createScoresHTML(scores, winnerColor = 'blue') {
    const sortedScores = [...scores].sort((a, b) => b.total - a.total);
    
    return sortedScores.map((score, index) => {
        const playerName = score.playerName || `Player ${score.player}`;
        const isWinner = index === 0;
        
        return `<div class="score-item flex justify-between items-center py-3 px-4 ${isWinner ? `winner bg-${winnerColor}-50 rounded-lg` : ''}">
            <span class="player-name font-medium">${index + 1}. ${playerName}</span>
            <span class="points font-semibold">${score.total} points</span>
        </div>`;
    }).join('');
}

// Display results in the winner and final scores sections
function displayResults(scores, elementPrefix = '', winnerColor = 'blue') {
    const winnerElement = document.getElementById(`${elementPrefix}winner`);
    const scoresElement = document.getElementById(`${elementPrefix}finalScores`);
    
    if (winnerElement) {
        winnerElement.textContent = createWinnerText(scores);
    }
    
    if (scoresElement) {
        scoresElement.innerHTML = createScoresHTML(scores, winnerColor);
    }
}

// Create save game session button
function createSaveButton(gameType, buttonColor, saveCallback) {
    const finalScoresContainer = document.getElementById('finalScores');
    if (!finalScoresContainer.querySelector('.save-session-btn')) {
        const saveButton = document.createElement('button');
        saveButton.className = `save-session-btn save-btn bg-${buttonColor}-600 hover:bg-${buttonColor}-700`;
        saveButton.innerHTML = `
            <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            Save Game Session
        `;
        
        saveButton.onclick = saveCallback || (() => saveGameSession(gameType));
        finalScoresContainer.appendChild(saveButton);
    }
}

// Default save game session function
function saveGameSession(gameType, customData = {}) {
    if (!currentScores || currentScores.length === 0) {
        alert('No scores to save!');
        return;
    }
    
    const sortedScores = [...currentScores].sort((a, b) => b.total - a.total);
    const session = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        gameType: gameType,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        players: currentScores.map(s => s.playerName),
        scores: currentScores,
        winner: sortedScores[0].playerName,
        gameSpecificData: customData,
        finished: true
    };
    
    try {
        const sessions = JSON.parse(localStorage.getItem('unifiedGameSessions') || '[]');
        sessions.unshift(session);
        localStorage.setItem('unifiedGameSessions', JSON.stringify(sessions));
        localStorage.setItem('unifiedGameSessions_backup', JSON.stringify(sessions));
        alert(`Game session saved! Winner: ${session.winner} (${sortedScores[0].total} points)`);
    } catch (e) {
        console.error('Save failed:', e);
        alert('Failed to save game session. Please try again.');
    }
}

// Number input validation
function validateNumberInput(input, min = 0, max = null) {
    let value = parseInt(input.value) || 0;
    if (value < min) value = min;
    if (max !== null && value > max) value = max;
    input.value = value;
    return value;
}

// Initialize common functionality
function initializeGame(defaultPlayerCount = 2) {
    playerCount = defaultPlayerCount;
    
    // Set up player count dropdown if it exists
    const playerCountSelect = document.getElementById('playerCount');
    if (playerCountSelect) {
        playerCountSelect.value = playerCount;
    }
    
    // Generate initial players and calculate scores
    if (typeof generatePlayers === 'function') {
        generatePlayers();
    }
    
    if (typeof calculateScores === 'function') {
        calculateScores();
    }
}