const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');
const btnAddMatch = document.querySelector('#btnAddMatch');
const numMatchesCount = document.querySelector('#numMatchesCount');

canvas.width = 1000;
canvas.height = 500;

let gameWidth = canvas.width;
let newMatches = [];
let matches = [];

const drawMatches = () => {
	matches.forEach(match => {
        match.draw();
	});
};


class Match {
    constructor(x, y) {
        this.x = x || 0;
        this.y = y || 0;
        this.width = 10;
        this.height = 150;
    }

    draw = () => {
        context.fillStyle = "yellow";
        context.fillRect(this.x, this.y, this.width, this.height);
        context.lineWidth = 1;
        context.strokeStyle = "black";
        context.strokeRect(this.x, this.y, this.width, this.height);
    }

    isClicked = (x, y) => {
        let isClicked = x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
        return isClicked;
    }
};

addNewMatch = () => {
    const count = numMatchesCount.value || 1;
    const offset = 5;
    for (let i = 0; i < count; i++) {
        const index = matches.length > 0 ? matches.length - 1 : 0;
        const lastMatch = index > -1 ? matches[index] : null;
        let newMatch = new Match(offset, offset);
        if(!!lastMatch) {
            newMatch = new Match(lastMatch.x+offset, lastMatch.y+offset);
        }
        matches.push(newMatch);
    }
};

btnAddMatch.addEventListener('click', () => {
    addNewMatch();
    drawMatches();
});

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const position = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };

    let matchClicked;
    for(let index = matches.length - 1; index >= 0; index--) {
        let isClicked = matches[index].isClicked(position.x, position.y);
        if(isClicked) {
            matchClicked = matches[index];
            break;
        }
    }

    console.log({ matchClicked: matchClicked });
  });