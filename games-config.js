/**
 * Shared Games Configuration
 * Centralized data for all built-in games across the application
 */

window.GAMES_CONFIG = {
    // Built-in games with detailed configuration
    builtInGames: [
        {
            id: 'mottainai',
            title: 'Mottainai',
            designer: 'Carl Chudyk',
            description: 'Complex end-game scoring with works, sales coverage, and material type majorities in a Japanese temple setting.',
            icon: '🏯',
            color: 'red',
            gradientFrom: 'red-100',
            gradientTo: 'orange-100',
            fallbackGradient: 'linear-gradient(135deg, #dc2626, #ea580c)',
            cardImage: 'images/mottainai-card.jpg',
            backgroundImage: 'images/mottainai-bg.jpg',
            file: 'mottainai.html',
            implemented: true,
            hasPlayerNames: true,
            hasSessions: true
        },
        {
            id: 'scythe',
            title: 'Scythe',
            designer: 'Jamey Stegmaier', 
            description: 'Popularity-based multipliers applied to achievements, territory control, and resource collection in alternate history Europa.',
            icon: '⚙️',
            color: 'blue',
            gradientFrom: 'gray-700',
            gradientTo: 'gray-900',
            fallbackGradient: 'linear-gradient(135deg, #374151, #111827)',
            cardImage: 'images/scythe-card.jpg',
            backgroundImage: 'images/scythe-bg.jpg',
            file: 'scythe.html',
            implemented: true,
            hasPlayerNames: true,
            hasSessions: true
        },
        {
            id: 'spirit-island',
            title: 'Spirit Island',
            designer: 'R. Eric Reuss',
            description: 'Optional performance scoring system that tracks results across different difficulty levels and spirit choices.',
            icon: '🌿',
            color: 'green',
            gradientFrom: 'green-600',
            gradientTo: 'green-800',
            fallbackGradient: 'linear-gradient(135deg, #16a34a, #15803d)',
            cardImage: 'images/spirit-island-card.jpg',
            backgroundImage: 'images/spirit-island-bg.jpg',
            file: 'spirit-island.html',
            implemented: true,
            hasPlayerNames: true,
            hasSessions: true
        },
        {
            id: 'ticket-to-ride',
            title: 'Ticket to Ride',
            designer: 'Alan R. Moon',
            description: 'Score calculation for railway routes, destination tickets, and longest path bonuses across various map editions.',
            icon: '🚂',
            color: 'purple',
            gradientFrom: 'blue-400',
            gradientTo: 'purple-500',
            fallbackGradient: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            cardImage: 'images/ticket-to-ride-card.jpg',
            backgroundImage: 'images/ticket-to-ride-bg.jpg',
            file: 'ticket-to-ride.html',
            implemented: true,
            hasPlayerNames: true,
            hasSessions: true
        },
        {
            id: 'wingspan',
            title: 'Wingspan',
            designer: 'Elizabeth Hargrave',
            description: 'Comprehensive scoring for bird cards, bonus objectives, round goals, and habitat development strategies.',
            icon: '🦅',
            color: 'teal',
            gradientFrom: 'teal-100',
            gradientTo: 'blue-200',
            fallbackGradient: 'linear-gradient(135deg, #0d9488, #0891b2)',
            cardImage: 'images/wingspan-card.jpg',
            backgroundImage: 'images/wingspan-bg.jpg',
            file: 'wingspan.html',
            implemented: true,
            hasPlayerNames: true,
            hasSessions: true
        }
    ],

    // Helper functions
    getGameById: function(gameId) {
        return this.builtInGames.find(game => game.id === gameId);
    },

    getGameByTitle: function(title) {
        return this.builtInGames.find(game => game.title === title);
    },

    getImplementedGames: function() {
        return this.builtInGames.filter(game => game.implemented);
    },

    getGamesWithSessions: function() {
        return this.builtInGames.filter(game => game.hasSessions);
    },

    getAllGames: function() {
        return this.builtInGames;
    }
};

// Make it available globally
window.gamesConfig = window.GAMES_CONFIG;