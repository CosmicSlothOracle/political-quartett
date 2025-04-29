/**
 * Card Data for Political Quartett Game
 */
const CARD_DATA = [
    {
        id: 'trump',
        name: 'Donald Trump',
        image: 'cards/card_Trump.png',
        stats: {
            charisma: 9,
            leadership: 6,
            influence: 9,
            integrity: 2,
            trickery: 10,
            wealth: 9
        },
        quote: "My fingers are long and beautiful, as, it has been well documented, are various other parts of my body."
    },
    {
        id: 'obama',
        name: 'Barack Obama',
        image: 'cards/card_Obama.png',
        stats: {
            charisma: 10,
            leadership: 9,
            influence: 9,
            integrity: 8,
            trickery: 3,
            wealth: 6
        },
        quote: "Change will not come if we wait for some other person or some other time."
    },
    {
        id: 'erdogan',
        name: 'Recep Tayyip Erdoğan',
        image: 'cards/card_Erdoğan.png',
        stats: {
            charisma: 7,
            leadership: 8,
            influence: 8,
            integrity: 3,
            trickery: 8,
            wealth: 7
        },
        quote: "Democracy is like a streetcar. When you come to your stop, you get off."
    },
    {
        id: 'lauterbach',
        name: 'Karl Lauterbach',
        image: 'cards/card_5_lauterbach.png',
        stats: {
            charisma: 5,
            leadership: 6,
            influence: 6,
            integrity: 7,
            trickery: 3,
            wealth: 4
        },
        quote: "Grilled meat is always harmful."
    },
    {
        id: 'merkel',
        name: 'Angela Merkel',
        image: 'cards/card_Merkel.png',
        stats: {
            charisma: 6,
            leadership: 8,
            influence: 8,
            integrity: 7,
            trickery: 4,
            wealth: 6
        },
        quote: "Wir schaffen das."
    },
    {
        id: 'thunberg',
        name: 'Greta Thunberg',
        image: 'cards/card_Thunberg.png',
        stats: {
            charisma: 7,
            leadership: 6,
            influence: 7,
            integrity: 9,
            trickery: 2,
            wealth: 2
        },
        quote: "How dare you!"
    },
    {
        id: 'selenskyj',
        name: 'Wolodymyr Selenskyj',
        image: 'cards/card_Selenskyj.png',
        stats: {
            charisma: 8,
            leadership: 9,
            influence: 9,
            integrity: 7,
            trickery: 5,
            wealth: 5
        },
        quote: "I am no Hero, I am the President"
    },
    {
        id: 'steinbrueck',
        name: 'Peer Steinbrück',
        image: 'cards/card_Steinbruec.png',
        stats: {
            charisma: 5,
            leadership: 6,
            influence: 5,
            integrity: 6,
            trickery: 3,
            wealth: 4
        },
        quote: "Kavalleriepferde"
    },
    {
        id: 'putin',
        name: 'Wladimir Putin',
        image: 'cards/card_Putin.png',
        stats: {
            charisma: 7,
            leadership: 9,
            influence: 10,
            integrity: 2,
            trickery: 10,
            wealth: 10
        },
        quote: "I am not a woman, so I don't have bad days."
    },
    {
        id: 'soeder',
        name: 'Markus Söder',
        image: 'cards/card_Soeder.png',
        stats: {
            charisma: 7,
            leadership: 7,
            influence: 7,
            integrity: 5,
            trickery: 6,
            wealth: 5
        },
        quote: "I love wings!"
    }
];

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CARD_DATA };
}