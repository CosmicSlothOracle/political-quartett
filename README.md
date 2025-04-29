# Political Quartett

A multiplayer card game featuring political figures, each with their unique attributes. Players strategically select attributes to compete against their opponents in an attempt to collect all cards.

## Game Description

In this game, players compete using cards representing political figures. Each card features six attributes:
- Charisma
- Leadership
- Influence
- Integrity
- Trickery
- Wealth

Each attribute is rated between 1 and 10. Players must strategically select a category to challenge their opponent, aiming to collect all cards to win.

## How to Play

1. Each player starts with 5 randomly distributed cards
2. The starting player selects a category and plays a card
3. The opponent plays their card for comparison
4. The player with the higher value in the selected category wins both cards
5. In case of a tie, players immediately play their next cards, continuing with the same category
6. The first player to collect all cards wins the game

## Features

- Play against AI or other players online
- Beautifully designed cards with political figures
- Intuitive user interface
- Real-time online matchmaking

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm

### Installation

1. Clone the repository
```
git clone https://github.com/yourusername/political-quartett.git
cd political-quartett
```

2. Install dependencies
```
npm install
```

3. Start the server
```
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

### Development Mode

For development with auto-restart on file changes:
```
npm run dev
```

## Deployment

The game can be deployed to services like Heroku or Vercel. For Heroku:

1. Create a Heroku account and install the Heroku CLI
2. Log in to Heroku
```
heroku login
```

3. Create a new Heroku app
```
heroku create
```

4. Deploy your code
```
git push heroku main
```

## Built With

- HTML5, CSS3, and JavaScript for the frontend
- Node.js and Express for the server
- Socket.io for real-time communication

## License

This project is licensed under the MIT License.

## Acknowledgments

- Card images stored in the `cards/` directory
- Game rules adapted from the traditional card game "Quartett"