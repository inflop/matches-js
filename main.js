const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');
const btnAddMatch = document.querySelector('#btnAddMatch');
const btnClear = document.querySelector('#btnClear');
const btnSave = document.querySelector('#btnSave');
const numMatchesCount = document.querySelector('#numMatchesCount');

canvas.width = 1000;
canvas.height = 500;

class Match {
    constructor(x, y) {
        this.x = x || canvas.width / 2;
        this.y = y || canvas.height / 2;
        this.width = 10;
        this.height = 150;
        this.dragged = false;
        this.selected = false;
        this.dragOffset = { x: 0, y: 0};
        this._rotated = false;
    }

    draw(ctx) {
        ctx.fillStyle = "yellow";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "black";
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        this._drawHead(ctx);
    }

    _drawHead(ctx) {
        ctx.fillStyle = "brown";
        let height = this._rotated ? this.height : this.height / 12;
        let width = this._rotated ? this.width / 12 : this.width;
        ctx.fillRect(this.x, this.y, width, height);
    }

    rotate() {
        this._rotated = !this._rotated;
        let w = this.width;
        let h = this.height;

        this.width = h;
        this.height = w;
    }

    get isRotated() {
        return this._rotated;
    }

    contains(point = { x, y }) {
        let contains =  point.x >= this.x &&
                        point.x <= this.x + this.width &&
                        point.y >= this.y &&
                        point.y <= this.y + this.height;
        return contains;
    }
};

class MatchesManager {
    constructor(ctx) {
        this._matches = [];
        this._ctx = ctx;
    }

    get matches() {
        return this._matches;
    }

    drawMatches() {
        this._matches.forEach(match => {
            match.draw(this._ctx);
        });
    }

    addMatches(count) {
        count = count || 1;
        const offset = 5;
        for (let i = 0; i < count; i++) {
            const index = this._matches.length > 0 ? this._matches.length - 1 : 0;
            const lastMatch = index > -1 ? this._matches[index] : null;
            let newMatch = new Match();
            if(!!lastMatch) {
                newMatch = new Match(lastMatch.x+offset, lastMatch.y+offset);
            }
            this.addMatch(newMatch);
        }
    }

    addMatch(match) {
        this._matches.push(match);
        this.drawMatches();
    }

    selectMatchAtPoint(point = {x, y}) {
        let match = this.getMatchContainsPoint(point);
        this.selectMatch(match);
    }

    selectMatch(match) {
        if (!match) return;
        this._matches.forEach(m => m.selected = false);
        match.selected = true;
    }

    rotateSelectedMatch() {
        if(!this.selectedMatch) return;

        this._ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.selectedMatch.rotate();
        this.drawMatches();
    }

    dragMatchAtPoint(point = {x, y}) {
        let match = this.getMatchContainsPoint(point);
        if (!match) return;

        match.dragOffset = {
            x: point.x-match.x,
            y: point.y-match.y,
        };
        this.dragMatch(match);
    }

    dragMatch(match) {
        if (!match) return;
        match.dragged = true;
    }

    dropMatch() {
        let match = this.draggedMatch;
        if (!match) return;
        match.dragOffset = { x: 0, y: 0 };
        match.dragged = false;
    }

    get draggedMatch() {
        return this._matches.filter(m => m.dragged)[0];
    }

    get selectedMatch() {
        return this._matches.filter(m => m.selected)[0];
    }

    clearMatches() {
        this._matches = [];
        this._ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    getMatchContainsPoint(point = {x, y}) {
        let match;
        for(let index = this._matches.length - 1; index >= 0; index--) {
            if(this._matches[index].contains(point)) {
                match = this._matches[index];
                break;
            }
        }
        return match;
    }

    saveMatches() {
        let items = this._matches.map(function(m) {
            return {
                x: m.x,
                y: m.y,
                w: m.isRotated ? m.height : m.width,
                h: m.isRotated ? m.width : m.height,
                r: m.isRotated
            };
        });
        localStorage.setItem('matches', JSON.stringify(items));
    }

    loadMatches() {
        let matchesJson = localStorage.getItem('matches');
        if (!matchesJson) return;
    
        this.clearMatches();
        let items = JSON.parse(matchesJson);
        for(let item of items) {
            let match = new Match(item.x, item.y);
            match.width = item.w;
            match.height = item.h;
            if (item.r) {
                match.rotate();
            }
            this.addMatch(match);
        }
    }
};

const matchesManager = new MatchesManager(context);

btnAddMatch.addEventListener('click', () => {
    const count = numMatchesCount.value || 1;
    matchesManager.addMatches(count);
});

btnClear.addEventListener('click', () => {
    matchesManager.clearMatches();
});

btnSave.addEventListener('click', () => {
    matchesManager.saveMatches();
});

btnLoad.addEventListener('click', () => {
    matchesManager.loadMatches();
});

mouseUp = (e) => {
	canvas.addEventListener("mousedown", mouseDown, false);
    canvas.removeEventListener("mouseup", mouseUp, false);
    canvas.removeEventListener("mousemove", mouseMove, false);

    if(!matchesManager.draggedMatch) return;
    matchesManager.dropMatch();
};

mouseDown = (e) => {
    const rect = canvas.getBoundingClientRect();
    const point = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };

    matchesManager.selectMatchAtPoint(point);
    matchesManager.dragMatchAtPoint(point);    

    canvas.addEventListener('mousemove', mouseMove, false);
    canvas.addEventListener("mouseup", mouseUp, false);
    canvas.removeEventListener('mousedown', mouseDown, false);
};

mouseMove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const point = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };

    if(!matchesManager.draggedMatch) return;

    matchesManager.draggedMatch.x = point.x-matchesManager.draggedMatch.dragOffset.x;
    matchesManager.draggedMatch.y = point.y-matchesManager.draggedMatch.dragOffset.y;
    context.clearRect(0, 0, canvas.width, canvas.height);
    matchesManager.drawMatches();
};

keyDown = (e) => {
    switch(e.keyCode) {
        case 82:
            matchesManager.rotateSelectedMatch();
            break;
        default:
            break;
    }
};

contextMenu = (e) => {
    e.preventDefault();
    matchesManager.rotateSelectedMatch();
};

canvas.addEventListener('mousedown', mouseDown, false);
canvas.addEventListener('contextmenu', contextMenu, false);
window.addEventListener("keydown", keyDown, false);