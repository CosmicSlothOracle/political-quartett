// Lobby and matchmaking system

let socket;
let currentLobbyId = null;
let isLobbyCreator = false;
let players = [];

function initializeLobbySystem() {
    socket = io();

    // Socket event listeners
    socket.on('connect', () => {
        console.log('Connected to server');
        showLobbyBrowser();
    });

    socket.on('lobbies', (lobbies) => {
        displayLobbies(lobbies);
    });

    socket.on('lobbyCreated', (lobbyData) => {
        handleLobbyCreated(lobbyData);
    });

    socket.on('playerJoined', (playerData) => {
        players.push(playerData);
        updatePlayerList();
    });

    socket.on('playerLeft', (playerId) => {
        players = players.filter(player => player.id !== playerId);
        updatePlayerList();
    });

    socket.on('lobbyJoined', (lobbyData) => {
        handleLobbyJoined(lobbyData);
    });

    socket.on('gameStarted', () => {
        window.location.href = '/game.html?lobby=' + currentLobbyId;
    });

    socket.on('error', (errorMessage) => {
        showError(errorMessage);
    });

    // Request initial lobbies
    socket.emit('getLobbies');
}

// UI Functions
function showLobbyScreen() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('lobby-screen').style.display = 'flex';

    if (currentLobbyId) {
        showCurrentLobby();
    } else {
        showLobbyBrowser();
    }
}

function showMainMenu() {
    if (currentLobbyId) {
        leaveLobby();
    }
    document.getElementById('lobby-screen').style.display = 'none';
    document.getElementById('main-menu').style.display = 'flex';
}

function showLobbyBrowser() {
    document.getElementById('lobby-browser').style.display = 'block';
    document.getElementById('current-lobby').style.display = 'none';
    socket.emit('getLobbies');
}

function showCurrentLobby() {
    document.getElementById('lobby-browser').style.display = 'none';
    document.getElementById('current-lobby').style.display = 'block';
    updatePlayerList();

    // Show or hide start game button based on creator status
    const startGameButton = document.getElementById('start-game-button');
    if (startGameButton) {
        startGameButton.style.display = isLobbyCreator ? 'block' : 'none';
    }
}

function displayLobbies(lobbies) {
    const lobbyListElement = document.getElementById('lobby-list');
    lobbyListElement.innerHTML = '';

    if (lobbies.length === 0) {
        lobbyListElement.innerHTML = '<div class="no-lobbies-message">No lobbies available. Create one to get started!</div>';
        return;
    }

    lobbies.forEach(lobby => {
        const lobbyItem = document.createElement('div');
        lobbyItem.className = 'lobby-item';

        const lobbyInfo = document.createElement('div');
        lobbyInfo.className = 'lobby-info';

        const lobbyName = document.createElement('div');
        lobbyName.className = 'lobby-name';
        lobbyName.textContent = lobby.name;

        const lobbyPlayers = document.createElement('div');
        lobbyPlayers.className = 'lobby-players';
        lobbyPlayers.textContent = `${ lobby.players.length } / 4 players`;

        lobbyInfo.appendChild(lobbyName);
        lobbyInfo.appendChild(lobbyPlayers);

        const joinButton = document.createElement('button');
        joinButton.className = 'join-button';
        joinButton.textContent = 'Join';
        joinButton.onclick = () => joinLobby(lobby.id);

        // Disable join button if lobby is full
        if (lobby.players.length >= 4) {
            joinButton.disabled = true;
            joinButton.textContent = 'Full';
        }

        lobbyItem.appendChild(lobbyInfo);
        lobbyItem.appendChild(joinButton);

        lobbyListElement.appendChild(lobbyItem);
    });
}

function updatePlayerList() {
    const playerListElement = document.getElementById('player-list');
    playerListElement.innerHTML = '';

    players.forEach(player => {
        const playerItem = document.createElement('div');
        playerItem.className = 'player-item';
        playerItem.textContent = player.name + (player.isCreator ? ' (Host)' : '');
        playerListElement.appendChild(playerItem);
    });

    // Show waiting message if fewer than 2 players
    const waitingElement = document.getElementById('waiting-message');
    if (waitingElement) {
        waitingElement.style.display = players.length < 2 ? 'block' : 'none';
    }

    // Enable/disable start game button based on player count
    const startGameButton = document.getElementById('start-game-button');
    if (startGameButton && isLobbyCreator) {
        startGameButton.disabled = players.length < 2;
    }
}

function copyInviteCode() {
    const inviteCode = document.getElementById('invite-code').textContent;
    navigator.clipboard.writeText(inviteCode)
        .then(() => {
            const copyButton = document.querySelector('.copy-button');
            copyButton.classList.add('copied');
            copyButton.textContent = 'Copied!';

            setTimeout(() => {
                copyButton.classList.remove('copied');
                copyButton.textContent = 'Copy';
            }, 2000);
        })
        .catch(err => {
            console.error('Failed to copy: ', err);
        });
}

function showError(message) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';

        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    } else {
        console.error(message);
    }
}

// Lobby Actions
function createLobby() {
    const lobbyName = document.getElementById('create-lobby-name').value.trim() ||
        `${ socket.id.substr(0, 6) }'s Lobby`;

    socket.emit('createLobby', { name: lobbyName });
}

function joinLobby(lobbyId) {
    socket.emit('joinLobby', { lobbyId });
}

function joinLobbyByCode() {
    const code = document.getElementById('join-lobby-code').value.trim();
    if (!code) {
        showError('Please enter an invite code');
        return;
    }

    socket.emit('joinLobby', { lobbyId: code });
}

function leaveLobby() {
    if (currentLobbyId) {
        socket.emit('leaveLobby', { lobbyId: currentLobbyId });
        currentLobbyId = null;
        isLobbyCreator = false;
        players = [];
        showLobbyBrowser();
    }
}

function startGame() {
    if (currentLobbyId && isLobbyCreator) {
        socket.emit('startGame', { lobbyId: currentLobbyId });
    }
}

// Event Handlers
function handleLobbyCreated(lobbyData) {
    currentLobbyId = lobbyData.id;
    isLobbyCreator = true;
    players = lobbyData.players;

    document.getElementById('invite-code').textContent = lobbyData.id;
    showCurrentLobby();
}

function handleLobbyJoined(lobbyData) {
    currentLobbyId = lobbyData.id;
    isLobbyCreator = lobbyData.isCreator;
    players = lobbyData.players;

    document.getElementById('invite-code').textContent = lobbyData.id;
    showCurrentLobby();
}

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Setup button event listeners
    document.getElementById('create-lobby-button').addEventListener('click', createLobby);
    document.getElementById('join-by-code-button').addEventListener('click', joinLobbyByCode);
    document.getElementById('back-to-menu-button').addEventListener('click', showMainMenu);
    document.getElementById('copy-invite-button').addEventListener('click', copyInviteCode);
    document.getElementById('leave-lobby-button').addEventListener('click', leaveLobby);
    document.getElementById('start-game-button').addEventListener('click', startGame);

    // Refresh lobby list periodically
    setInterval(() => {
        if (!currentLobbyId) {
            socket.emit('getLobbies');
        }
    }, 5000);
});

// Export functions for use in other modules
window.showLobbyScreen = showLobbyScreen;
window.initializeLobbySystem = initializeLobbySystem;