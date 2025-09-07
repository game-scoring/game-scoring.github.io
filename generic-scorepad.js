let currentState = {
    selectedGameId: null,
    currentSession: null,
    editingGameId: null
};

// Data management functions with persistence guarantees
function getGames() {
    try {
        const data = localStorage.getItem('customGames');
        if (!data) {
            // Initialize with timestamp to track data creation
            const initialData = [];
            saveGames(initialData);
            return initialData;
        }
        return JSON.parse(data);
    } catch (e) {
        console.warn('Error reading games data, initializing fresh:', e);
        return [];
    }
}

function saveGames(games) {
    try {
        // Add timestamp to track last update
        const dataWithMeta = {
            games: games,
            lastUpdated: new Date().toISOString(),
            version: '1.0'
        };
        localStorage.setItem('customGames', JSON.stringify(games));
        localStorage.setItem('customGames_meta', JSON.stringify(dataWithMeta));
        
        // Create backup in separate key
        localStorage.setItem('customGames_backup', JSON.stringify(games));
    } catch (e) {
        console.error('Failed to save games data:', e);
        alert('Warning: Unable to save games data. Please check browser storage.');
    }
}

function getSessions() {
    try {
        // Get both custom generic sessions and specific game sessions
        const genericSessions = JSON.parse(localStorage.getItem('gameSessions') || '[]');
        const unifiedSessions = JSON.parse(localStorage.getItem('unifiedGameSessions') || '[]');
        
        // Combine all sessions
        const allSessions = [...genericSessions, ...unifiedSessions];
        
        return allSessions;
    } catch (e) {
        console.warn('Error reading sessions data, initializing fresh:', e);
        return [];
    }
}

function saveSessions(sessions) {
    try {
        // Add timestamp to track last update
        const dataWithMeta = {
            sessions: sessions,
            lastUpdated: new Date().toISOString(),
            version: '1.0'
        };
        localStorage.setItem('gameSessions', JSON.stringify(sessions));
        localStorage.setItem('gameSessions_meta', JSON.stringify(dataWithMeta));
        
        // Create backup in separate key
        localStorage.setItem('gameSessions_backup', JSON.stringify(sessions));
    } catch (e) {
        console.error('Failed to save sessions data:', e);
        alert('Warning: Unable to save sessions data. Please check browser storage.');
    }
}

// Data recovery functions
function recoverData() {
    let recovered = false;
    
    // Try to recover games from backup
    try {
        const gamesBackup = localStorage.getItem('customGames_backup');
        if (gamesBackup && (!localStorage.getItem('customGames') || JSON.parse(localStorage.getItem('customGames')).length === 0)) {
            localStorage.setItem('customGames', gamesBackup);
            recovered = true;
        }
    } catch (e) {
        console.warn('Games backup recovery failed:', e);
    }
    
    // Try to recover sessions from backup
    try {
        const sessionsBackup = localStorage.getItem('gameSessions_backup');
        if (sessionsBackup && (!localStorage.getItem('gameSessions') || JSON.parse(localStorage.getItem('gameSessions')).length === 0)) {
            localStorage.setItem('gameSessions', sessionsBackup);
            recovered = true;
        }
    } catch (e) {
        console.warn('Sessions backup recovery failed:', e);
    }
    
    if (recovered) {
        console.log('Data recovered from backup');
        return true;
    }
    return false;
}

// Export data for external backup
function exportData() {
    try {
        const exportData = {
            customGames: getGames(),
            genericSessions: JSON.parse(localStorage.getItem('gameSessions') || '[]'),
            builtInGameSessions: JSON.parse(localStorage.getItem('unifiedGameSessions') || '[]'),
            allSessions: getSessions(), // Combined view for convenience
            exported: new Date().toISOString(),
            version: '2.0'
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `game-scoring-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        alert('Data exported successfully! Includes all custom games and sessions from all game types.');
    } catch (e) {
        console.error('Export failed:', e);
        alert('Failed to export data. Please try again.');
    }
}

// Import data from external backup
function importData(file) {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Handle both old and new backup formats
            if (importedData.version === '2.0' && importedData.customGames) {
                if (confirm('This will replace all existing data (custom games and all game sessions). Are you sure?')) {
                    // Import custom games
                    saveGames(importedData.customGames || []);
                    
                    // Import generic sessions
                    localStorage.setItem('gameSessions', JSON.stringify(importedData.genericSessions || []));
                    
                    // Import built-in game sessions
                    localStorage.setItem('unifiedGameSessions', JSON.stringify(importedData.builtInGameSessions || []));
                    
                    alert('All data imported successfully! Custom games and sessions from all game types restored.');
                    showGamesView();
                }
            } else if (importedData.games && importedData.sessions) {
                // Legacy format
                if (confirm('This will replace existing custom games and generic sessions. Are you sure?')) {
                    saveGames(importedData.games);
                    localStorage.setItem('gameSessions', JSON.stringify(importedData.sessions));
                    alert('Legacy data imported successfully!');
                    showGamesView();
                }
            } else {
                alert('Invalid backup file format.');
            }
        } catch (e) {
            console.error('Import failed:', e);
            alert('Failed to import data. Please check the file format.');
        }
    };
    reader.readAsText(file);
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Navigation functions
function showGamesView() {
    hideAllViews();
    document.getElementById('gamesView').classList.remove('hidden');
    updateBreadcrumb('My Games');
    loadGamesList();
}

function showGameForm(gameId = null) {
    hideAllViews();
    document.getElementById('gameFormView').classList.remove('hidden');
    
    currentState.editingGameId = gameId;
    
    if (gameId) {
        const games = getGames();
        const game = games.find(g => g.id === gameId);
        if (game) {
            document.getElementById('gameFormTitle').textContent = 'Edit Game';
            document.getElementById('gameTitle').value = game.title;
            
            // Load players
            const playersList = document.getElementById('playersList');
            playersList.innerHTML = '';
            game.defaultPlayers.forEach((player, index) => {
                const playerDiv = document.createElement('div');
                playerDiv.className = 'flex items-center space-x-2';
                playerDiv.innerHTML = `
                    <input type="text" value="${player}" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                    <button type="button" onclick="removePlayer(this)" class="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
                `;
                playersList.appendChild(playerDiv);
            });
            updateBreadcrumb('My Games > Edit Game');
        }
    } else {
        document.getElementById('gameFormTitle').textContent = 'Create New Game';
        document.getElementById('gameTitle').value = '';
        resetPlayersList();
        updateBreadcrumb('My Games > Create Game');
    }
}

function showCreateGameForm() {
    showGameForm();
}

function showSessionsView(gameId, gameTitle = null) {
    hideAllViews();
    document.getElementById('sessionsView').classList.remove('hidden');
    currentState.selectedGameId = gameId;
    
    // Handle both custom games and built-in games
    let displayTitle = gameTitle;
    if (!displayTitle) {
        const customGames = getGames();
        const customGame = customGames.find(g => g.id === gameId);
        if (customGame) {
            displayTitle = customGame.title;
        } else {
            // Built-in game
            const builtInGames = {
                'mottainai': 'Mottainai',
                'scythe': 'Scythe',
                'spirit-island': 'Spirit Island',
                'ticket-to-ride': 'Ticket to Ride',
                'wingspan': 'Wingspan'
            };
            displayTitle = builtInGames[gameId] || 'Unknown Game';
        }
    }
    
    document.getElementById('sessionGameTitle').textContent = displayTitle;
    updateBreadcrumb(`My Games > ${displayTitle}`);
    
    // Update the New Session button text based on game type
    const builtInGamesConfig = window.gamesConfig ? window.gamesConfig.getAllGames() : [];
    const builtInGame = builtInGamesConfig.find(game => game.id === gameId);
    const newSessionButton = document.querySelector('#sessionsView button[onclick="startNewSession()"]');
    
    if (newSessionButton) {
        if (builtInGame) {
            newSessionButton.textContent = 'Play Again';
        } else {
            newSessionButton.textContent = 'New Session';
        }
    }
    
    loadSessionsList(gameId, displayTitle);
}

function showSessionSetup() {
    hideAllViews();
    document.getElementById('sessionSetupView').classList.remove('hidden');
    
    const games = getGames();
    const game = games.find(g => g.id === currentState.selectedGameId);
    if (game) {
        document.getElementById('setupGameTitle').textContent = game.title;
        document.getElementById('sessionDate').value = new Date().toISOString().split('T')[0];
        
        // Load default players
        const sessionPlayersList = document.getElementById('sessionPlayersList');
        sessionPlayersList.innerHTML = '';
        game.defaultPlayers.forEach((player, index) => {
            addSessionPlayerWithName(player);
        });
        
        updateBreadcrumb(`My Games > ${game.title} > New Session`);
    }
}

function hideAllViews() {
    const views = ['gamesView', 'gameFormView', 'sessionsView', 'sessionSetupView', 'activeSessionView'];
    views.forEach(viewId => {
        document.getElementById(viewId).classList.add('hidden');
    });
}

function updateBreadcrumb(text) {
    document.getElementById('breadcrumbContent').textContent = text;
}

// Game management functions
function loadGamesList() {
    const customGames = getGames();
    const allSessions = getSessions();
    const gamesContainer = document.getElementById('gamesList');
    
    // Get built-in games from shared config
    const builtInGamesConfig = window.gamesConfig ? window.gamesConfig.getAllGames() : [];
    
    // Combine all games with their session counts
    const builtInGames = builtInGamesConfig.map(game => ({
        ...game,
        type: 'built-in',
        sessions: allSessions.filter(s => s.gameType === game.title || s.gameId === game.id)
    }));

    const customGamesWithSessions = customGames.map(game => ({
        ...game,
        type: 'custom',
        sessions: allSessions.filter(s => s.gameId === game.id)
    }));

    // **ONLY SHOW GAMES WITH SESSIONS** (plus custom games which can always be managed)
    const builtInGamesWithSessions = builtInGames.filter(game => game.sessions.length > 0);
    const allGames = [...builtInGamesWithSessions, ...customGamesWithSessions];
    
    if (allGames.length === 0) {
        gamesContainer.innerHTML = `
            <div class="text-center py-12">
                <p class="text-gray-500 mb-4">No games with saved sessions yet</p>
                <p class="text-sm text-gray-400">Play some games and save sessions to see them here!</p>
            </div>
        `;
        return;
    }

    gamesContainer.innerHTML = allGames.map(game => {
        const sessionCount = game.sessions.length;
        
        if (game.type === 'built-in') {
            return `
                <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div class="flex justify-between items-start mb-2">
                        <div class="flex-1">
                            <h3 class="font-semibold text-gray-900 mb-1">${game.icon} ${game.title}</h3>
                            <p class="text-sm text-gray-600">Built-in game with session history</p>
                            <p class="text-sm text-gray-500">${sessionCount} session${sessionCount !== 1 ? 's' : ''} played</p>
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <a href="${game.file}" class="flex-1 px-4 py-2 bg-${game.color}-100 text-${game.color}-700 rounded-lg hover:bg-${game.color}-200 transition-colors font-medium text-center">
                            Play Again
                        </a>
                        <button onclick="showSessionsView('${game.id}', '${game.title}')" class="flex-1 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium">
                            View Sessions
                        </button>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div class="flex justify-between items-start mb-2">
                        <div class="flex-1">
                            <h3 class="font-semibold text-gray-900 mb-1">${game.title}</h3>
                            <p class="text-sm text-gray-600">Default Players: ${game.defaultPlayers.join(', ')}</p>
                            <p class="text-sm text-gray-500">${sessionCount} session${sessionCount !== 1 ? 's' : ''} played</p>
                        </div>
                        <div class="flex space-x-2">
                            <button onclick="editGame('${game.id}')" class="text-blue-600 hover:text-blue-700 text-sm px-2 py-1 rounded">
                                Edit
                            </button>
                            <button onclick="deleteGameWithConfirmation('${game.id}')" class="text-red-600 hover:text-red-700 text-sm px-2 py-1 rounded">
                                Delete
                            </button>
                        </div>
                    </div>
                    <button onclick="showSessionsView('${game.id}', '${game.title}')" class="w-full mt-3 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium">
                        ${sessionCount > 0 ? 'View Sessions' : 'Start Playing'}
                    </button>
                </div>
            `;
        }
    }).join('');
}

function editGame(gameId) {
    showGameForm(gameId);
}

function deleteGameWithConfirmation(gameId) {
    const games = getGames();
    const game = games.find(g => g.id === gameId);
    const sessions = getSessions().filter(s => s.gameId === gameId);
    
    let confirmMessage = `Are you sure you want to delete "${game.title}"?`;
    if (sessions.length > 0) {
        confirmMessage += `\n\nThis will also delete ${sessions.length} associated session${sessions.length !== 1 ? 's' : ''}.`;
    }
    
    if (confirm(confirmMessage)) {
        // Delete the game
        const updatedGames = games.filter(g => g.id !== gameId);
        saveGames(updatedGames);
        
        // Delete associated sessions
        const updatedSessions = getSessions().filter(s => s.gameId !== gameId);
        saveSessions(updatedSessions);
        
        loadGamesList();
    }
}

// Player management functions
function addPlayer() {
    const playersList = document.getElementById('playersList');
    const playerCount = playersList.children.length + 1;
    const playerDiv = document.createElement('div');
    playerDiv.className = 'flex items-center space-x-2';
    playerDiv.innerHTML = `
        <input type="text" placeholder="Player ${playerCount}" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
        <button type="button" onclick="removePlayer(this)" class="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
        </button>
    `;
    playersList.appendChild(playerDiv);
}

function removePlayer(button) {
    const playersList = button.closest('#playersList, #sessionPlayersList');
    if (playersList.children.length > 1) {
        button.parentElement.remove();
    }
}

function resetPlayersList() {
    const playersList = document.getElementById('playersList');
    playersList.innerHTML = `
        <div class="flex items-center space-x-2">
            <input type="text" placeholder="Player 1" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
            <button type="button" onclick="removePlayer(this)" class="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
            </button>
        </div>
    `;
}

function addSessionPlayer() {
    addSessionPlayerWithName('');
}

function addSessionPlayerWithName(name) {
    const sessionPlayersList = document.getElementById('sessionPlayersList');
    const playerCount = sessionPlayersList.children.length + 1;
    const playerDiv = document.createElement('div');
    playerDiv.className = 'flex items-center space-x-2';
    playerDiv.innerHTML = `
        <input type="text" value="${name}" placeholder="Player ${playerCount}" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
        <button type="button" onclick="removePlayer(this)" class="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
        </button>
    `;
    sessionPlayersList.appendChild(playerDiv);
}

// Game form handling
document.getElementById('gameForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const gameTitle = document.getElementById('gameTitle').value.trim();
    if (!gameTitle) {
        alert('Please enter a game title');
        return;
    }

    const playerInputs = document.querySelectorAll('#playersList input');
    const players = [];
    
    playerInputs.forEach((input, index) => {
        const name = input.value.trim() || `Player ${index + 1}`;
        players.push(name);
    });

    if (players.length === 0) {
        alert('Please add at least one player');
        return;
    }

    const games = getGames();
    
    if (currentState.editingGameId) {
        // Update existing game
        const gameIndex = games.findIndex(g => g.id === currentState.editingGameId);
        if (gameIndex !== -1) {
            games[gameIndex].title = gameTitle;
            games[gameIndex].defaultPlayers = players;
            games[gameIndex].updatedAt = new Date().toISOString();
        }
    } else {
        // Create new game
        const newGame = {
            id: generateId(),
            title: gameTitle,
            defaultPlayers: players,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        games.push(newGame);
    }

    saveGames(games);
    showGamesView();
});

// Session management functions
function loadSessionsList(gameId, gameTitle) {
    const allSessions = getSessions();
    const sessions = allSessions.filter(s => {
        // Match by gameId (custom games) or gameType (built-in games)
        return s.gameId === gameId || s.gameType === gameTitle;
    });
    
    const sessionsContainer = document.getElementById('sessionsList');
    
    if (sessions.length === 0) {
        sessionsContainer.innerHTML = '<p class="text-gray-500 text-center py-8">No sessions played yet</p>';
        return;
    }

    sessions.sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date));

    sessionsContainer.innerHTML = sessions.map(session => {
        // Handle different session formats
        const sessionDate = session.date || session.timestamp?.split('T')[0] || 'Unknown date';
        const sessionInfo = getSessionDisplayInfo(session);
        
        return `
            <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h3 class="font-semibold text-gray-900">${new Date(sessionDate).toLocaleDateString()}</h3>
                        <p class="text-sm text-gray-600">${sessionInfo.description}</p>
                    </div>
                    <button onclick="deleteSessionWithConfirmation('${session.id}')" class="text-red-600 hover:text-red-700 text-sm px-2 py-1 rounded">
                        Delete Session
                    </button>
                </div>
                <div class="mb-2">
                    <span class="text-sm font-medium text-green-600">Winner: ${session.winner} ${sessionInfo.winnerScore}</span>
                </div>
                <div class="text-sm text-gray-600">
                    <strong>Players:</strong> ${sessionInfo.playersText}
                </div>
                ${sessionInfo.gameSpecific ? `<div class="text-xs text-gray-500 mt-2">${sessionInfo.gameSpecific}</div>` : ''}
            </div>
        `;
    }).join('');
}

function getSessionDisplayInfo(session) {
    // Handle generic score pad sessions
    if (session.rounds && session.playerTotals) {
        return {
            description: `${session.rounds.length} rounds played`,
            winnerScore: `(${session.playerTotals[0].total} points)`,
            playersText: session.playerTotals.map(p => `${p.player}: ${p.total}`).join(', '),
            gameSpecific: null
        };
    }
    
    // Handle specific game sessions (from built-in games)
    if (session.scores) {
        const topScore = Math.max(...session.scores.map(s => s.total));
        let gameSpecific = '';
        
        if (session.gameSpecificData) {
            if (session.gameType === 'Mottainai' && session.gameSpecificData.playerBreakdowns) {
                gameSpecific = 'Mottainai scoring: Works, Sales, Majorities';
            } else if (session.gameType === 'Scythe' && session.gameSpecificData.playerBreakdowns) {
                gameSpecific = 'Scythe scoring: Stars, Territories, Resources, Popularity';
            }
        }
        
        return {
            description: `${session.gameType || 'Game'} session`,
            winnerScore: `(${topScore} points)`,
            playersText: session.scores.map(s => `${s.playerName}: ${s.total}`).join(', '),
            gameSpecific: gameSpecific
        };
    }
    
    // Fallback for other formats
    return {
        description: 'Game session',
        winnerScore: '',
        playersText: session.players ? session.players.join(', ') : 'Unknown players',
        gameSpecific: null
    };
}

function startNewSession() {
    // Check if this is a built-in game that should redirect to its own page
    const builtInGamesConfig = window.gamesConfig ? window.gamesConfig.getAllGames() : [];
    const builtInGame = builtInGamesConfig.find(game => game.id === currentState.selectedGameId);
    
    if (builtInGame) {
        // Redirect to the built-in game's page
        window.location.href = builtInGame.file;
    } else {
        // This is a custom game, show the generic session setup
        showSessionSetup();
    }
}

function backToSessions() {
    showSessionsView(currentState.selectedGameId);
}

function startSession() {
    const sessionDate = document.getElementById('sessionDate').value;
    const playerInputs = document.querySelectorAll('#sessionPlayersList input');
    const players = [];
    
    playerInputs.forEach((input, index) => {
        const name = input.value.trim() || `Player ${index + 1}`;
        players.push(name);
    });

    if (players.length === 0) {
        alert('Please add at least one player');
        return;
    }

    const games = getGames();
    const game = games.find(g => g.id === currentState.selectedGameId);

    currentState.currentSession = {
        id: generateId(),
        gameId: currentState.selectedGameId,
        gameTitle: game.title,
        date: sessionDate || new Date().toISOString().split('T')[0],
        players: players,
        rounds: [],
        finished: false
    };

    hideAllViews();
    document.getElementById('activeSessionView').classList.remove('hidden');
    
    document.getElementById('activeGameTitle').textContent = currentState.currentSession.gameTitle;
    document.getElementById('activeSessionDate').textContent = new Date(currentState.currentSession.date).toLocaleDateString();
    
    updateBreadcrumb(`My Games > ${game.title} > Active Session`);
    setupScoreTable();
}

function deleteSessionWithConfirmation(sessionId) {
    if (confirm('Are you sure you want to delete this game session? This cannot be undone.')) {
        // Get both storage types separately
        const genericSessions = JSON.parse(localStorage.getItem('gameSessions') || '[]');
        const unifiedSessions = JSON.parse(localStorage.getItem('unifiedGameSessions') || '[]');
        
        // Find which storage contains this session
        const sessionInGeneric = genericSessions.find(s => s.id === sessionId);
        const sessionInUnified = unifiedSessions.find(s => s.id === sessionId);
        
        let deleted = false;
        
        if (sessionInGeneric) {
            // Delete from generic sessions
            const updatedGenericSessions = genericSessions.filter(s => s.id !== sessionId);
            saveSessions(updatedGenericSessions);
            deleted = true;
            console.log('Deleted session from generic sessions:', sessionId);
        } else if (sessionInUnified) {
            // Delete from unified sessions
            const updatedUnifiedSessions = unifiedSessions.filter(s => s.id !== sessionId);
            localStorage.setItem('unifiedGameSessions', JSON.stringify(updatedUnifiedSessions));
            deleted = true;
            console.log('Deleted session from unified sessions:', sessionId);
        } else {
            console.error('Session not found in either storage:', sessionId);
            console.log('Available generic session IDs:', genericSessions.map(s => s.id));
            console.log('Available unified session IDs:', unifiedSessions.map(s => s.id));
        }
        
        if (deleted) {
            // Refresh the entire sessions view to ensure proper state
            showSessionsView(currentState.selectedGameId);
        } else {
            alert('Session could not be found. Please refresh the page and try again.');
        }
    }
}

// Active session functions
function setupScoreTable() {
    const table = document.getElementById('scoreTable');
    const thead = table.querySelector('thead tr');
    const tbody = document.getElementById('scoreTableBody');
    const tfoot = table.querySelector('tfoot tr');

    // Set up header with just Player and Round 1 (no Total initially)
    thead.innerHTML = '<th class="border border-gray-300 px-4 py-3 text-left font-medium text-gray-900">Player</th><th class="border border-gray-300 px-4 py-3 text-center font-medium text-gray-900">Round 1</th>';
    tbody.innerHTML = '';
    tfoot.innerHTML = '<td class="border border-gray-300 px-4 py-3 font-bold">Total</td><td class="border border-gray-300 px-4 py-3 text-center font-bold">0</td>';

    // Create rows for each player with just Round 1 input (no total cell initially)
    const firstRoundScores = [];
    currentState.currentSession.players.forEach((player, playerIndex) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="border border-gray-300 px-4 py-3 font-medium">${player}</td>
            <td class="border border-gray-300 px-2 py-2">
                <input type="number" value="0" class="w-full px-2 py-1 text-center border-0 focus:ring-2 focus:ring-purple-500 rounded" onchange="updateTotals()">
            </td>
        `;
        tbody.appendChild(row);
        firstRoundScores.push(0);
    });

    // Initialize the session with the first round
    currentState.currentSession.rounds = [firstRoundScores];
}

function addRound() {
    const roundNumber = currentState.currentSession.rounds.length + 1;
    
    // Add new round scores to session data
    const newRoundScores = [];
    currentState.currentSession.players.forEach(() => {
        newRoundScores.push(0);
    });
    currentState.currentSession.rounds.push(newRoundScores);
    
    // Rebuild the entire table to avoid column insertion issues
    rebuildScoreTable();
    updateTotals();
}

function rebuildScoreTable() {
    const table = document.getElementById('scoreTable');
    const thead = table.querySelector('thead tr');
    const tbody = document.getElementById('scoreTableBody');
    const tfoot = table.querySelector('tfoot tr');
    
    const numRounds = currentState.currentSession.rounds.length;
    
    // Build header: Player | Round 1 | Round 2 | ... (| Total only if > 1 round)
    let headerHTML = '<th class="border border-gray-300 px-4 py-3 text-left font-medium text-gray-900">Player</th>';
    for (let i = 1; i <= numRounds; i++) {
        headerHTML += `<th class="border border-gray-300 px-4 py-3 text-center font-medium text-gray-900">Round ${i}</th>`;
    }
    // Only add Total column if more than 1 round
    if (numRounds > 1) {
        headerHTML += '<th class="border border-gray-300 px-4 py-3 text-center font-medium text-gray-900">Total</th>';
    }
    thead.innerHTML = headerHTML;
    
    // Build body rows
    tbody.innerHTML = '';
    currentState.currentSession.players.forEach((player, playerIndex) => {
        const row = document.createElement('tr');
        let rowHTML = `<td class="border border-gray-300 px-4 py-3 font-medium">${player}</td>`;
        
        // Add input cells for each round
        for (let roundIndex = 0; roundIndex < numRounds; roundIndex++) {
            const score = currentState.currentSession.rounds[roundIndex][playerIndex] || 0;
            rowHTML += `<td class="border border-gray-300 px-2 py-2">
                <input type="number" value="${score}" class="w-full px-2 py-1 text-center border-0 focus:ring-2 focus:ring-purple-500 rounded" onchange="updateTotals()">
            </td>`;
        }
        
        // Only add total cell if more than 1 round
        if (numRounds > 1) {
            rowHTML += '<td class="border border-gray-300 px-4 py-3 text-center font-bold">0</td>';
        }
        row.innerHTML = rowHTML;
        tbody.appendChild(row);
    });
    
    // Build footer: Total | Round1Total | Round2Total | ... (| GrandTotal only if > 1 round)
    let footerHTML = '<td class="border border-gray-300 px-4 py-3 font-bold">Total</td>';
    for (let i = 0; i < numRounds; i++) {
        footerHTML += '<td class="border border-gray-300 px-4 py-3 text-center font-bold">0</td>';
    }
    // Only add grand total if more than 1 round
    if (numRounds > 1) {
        footerHTML += '<td class="border border-gray-300 px-4 py-3 text-center font-bold">0</td>';
    }
    tfoot.innerHTML = footerHTML;
}

function updateTotals() {
    const tbody = document.getElementById('scoreTableBody');
    const numRounds = currentState.currentSession.rounds.length;
    
    currentState.currentSession.players.forEach((player, playerIndex) => {
        const row = tbody.children[playerIndex];
        const inputs = row.querySelectorAll('input[type="number"]');
        let total = 0;
        
        // Update round scores in session data
        inputs.forEach((input, roundIndex) => {
            const score = parseInt(input.value) || 0;
            currentState.currentSession.rounds[roundIndex][playerIndex] = score;
            total += score;
        });
        
        // Only update total cell if we have more than 1 round (when Total column exists)
        if (numRounds > 1) {
            const totalCell = row.lastElementChild; // Total cell is always last when it exists
            if (totalCell) {
                totalCell.textContent = total;
            }
        }
    });
    
    // Update footer totals
    const tfoot = document.querySelector('#scoreTable tfoot tr');
    const footerCells = tfoot.querySelectorAll('td');
    
    // Calculate round totals
    for (let roundIndex = 0; roundIndex < numRounds; roundIndex++) {
        let roundTotal = 0;
        for (let playerIndex = 0; playerIndex < currentState.currentSession.players.length; playerIndex++) {
            roundTotal += currentState.currentSession.rounds[roundIndex][playerIndex] || 0;
        }
        if (footerCells[roundIndex + 1]) { // +1 because first cell is "Total" label
            footerCells[roundIndex + 1].textContent = roundTotal;
        }
    }
    
    // Calculate grand total (only if more than 1 round)
    if (numRounds > 1) {
        let grandTotal = 0;
        for (let playerIndex = 0; playerIndex < currentState.currentSession.players.length; playerIndex++) {
            for (let roundIndex = 0; roundIndex < numRounds; roundIndex++) {
                grandTotal += currentState.currentSession.rounds[roundIndex][playerIndex] || 0;
            }
        }
        const grandTotalCell = footerCells[footerCells.length - 1]; // Last cell is grand total
        if (grandTotalCell) {
            grandTotalCell.textContent = grandTotal;
        }
    }
}

function finishSession() {
    if (currentState.currentSession.rounds.length === 0) {
        alert('Please add at least one round before finishing the session');
        return;
    }

    currentState.currentSession.finished = true;
    currentState.currentSession.finishedAt = new Date().toISOString();
    
    const playerTotals = currentState.currentSession.players.map((player, index) => {
        const total = currentState.currentSession.rounds.reduce((sum, round) => sum + (round[index] || 0), 0);
        return { player, total };
    });
    
    playerTotals.sort((a, b) => b.total - a.total);
    
    // Check for ties
    const topScore = playerTotals[0].total;
    const winners = playerTotals.filter(p => p.total === topScore);
    
    let winnerText;
    if (winners.length > 1) {
        // It's a tie
        currentState.currentSession.winner = winners.map(w => w.player).join(' & ');
        winnerText = `Tie between ${winners.map(w => w.player).join(' and ')}! (${topScore} points each)`;
    } else {
        // Single winner
        currentState.currentSession.winner = playerTotals[0].player;
        winnerText = `Winner: ${currentState.currentSession.winner} with ${topScore} points`;
    }
    
    currentState.currentSession.playerTotals = playerTotals;

    // Save session
    const sessions = getSessions();
    sessions.push(currentState.currentSession);
    saveSessions(sessions);
    
    alert(`Session finished! ${winnerText}`);
    
    showSessionsView(currentState.selectedGameId);
}

function cancelSession() {
    if (confirm('Are you sure you want to cancel this session? All progress will be lost.')) {
        showSessionsView(currentState.selectedGameId);
    }
}

// Initialize with data recovery
document.addEventListener('DOMContentLoaded', function() {
    // Try to recover data if main storage is empty
    recoverData();
    
    // Show the games view
    showGamesView();
    
    // Set up periodic backup (every 30 seconds if there are changes)
    let lastDataHash = '';
    setInterval(function() {
        try {
            const currentData = JSON.stringify({
                games: getGames(),
                sessions: getSessions()
            });
            const currentHash = btoa(currentData).slice(0, 20); // Simple hash
            
            if (currentHash !== lastDataHash) {
                // Data has changed, update backups
                localStorage.setItem('customGames_backup', JSON.stringify(getGames()));
                localStorage.setItem('gameSessions_backup', JSON.stringify(getSessions()));
                lastDataHash = currentHash;
            }
        } catch (e) {
            console.warn('Periodic backup failed:', e);
        }
    }, 30000); // Every 30 seconds
});

// Initialize immediately for compatibility
showGamesView();
