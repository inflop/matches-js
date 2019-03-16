const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');
const btnAddMatch = document.querySelector('#btnAddMatch');
const numMatchesCount = document.querySelector('#numMatchesCount');

canvas.width = 1000;
canvas.height = 500;

class Match {
    constructor(x, y) {
        this.x = x || 0;
        this.y = y || 0;
        this.width = 10;
        this.height = 150;
        this.dragged = false;
    }

    draw = (ctx) => {
        ctx.fillStyle = "yellow";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "black";
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    
        // var rad = 90 * Math.PI / 180;
        // ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        // ctx.rotate(rad);
    }

    contains = (point = { x, y }) => {
        let contains =  point.x >= this.x &&
                        point.x <= this.x + this.width &&
                        point.y >= this.y &&
                        point.y <= this.y + this.height;
        return contains;
    }
}

class MatchesManager {
    constructor(ctx) {
        this._matches = [];
        this._ctx = ctx;
    }

    get matches() {
        return this._matches;
    }

    drawMatches = () => {
        this._matches.forEach(match => {
            match.draw(this._ctx);
        });
    }

    addMatch = (count) => {
        count = count || 1;
        const offset = 15;
        for (let i = 0; i < count; i++) {
            const index = this._matches.length > 0 ? this._matches.length - 1 : 0;
            const lastMatch = index > -1 ? this._matches[index] : null;
            let newMatch = new Match(offset, offset);
            if(!!lastMatch) {
                newMatch = new Match(lastMatch.x+offset, lastMatch.y+offset);
            }
            this._matches.push(newMatch);
        }
        this.drawMatches();
    }

    dragMatchAtPoint = (point = {x, y}) => {
        let match = this.getMatchContainsPoint(point);
        this.dragMatch(match);
    }

    dragMatch = (match) => {
        if (!match) return;
        match.dragged = true;
    }

    dropMatch = () => {
        let match = this.draggedMatch;
        if (!match) return;
        match.dragged = false;
    }

    get draggedMatch() {
        return this._matches.filter(m => m.dragged)[0];
    }

    getMatchContainsPoint = (point = {x, y}) => {
        let match;
        for(let index = this._matches.length - 1; index >= 0; index--) {
            if(this._matches[index].contains(point)) {
                match = this._matches[index];
                break;
            }
        }
        return match;
    }
}

class CanvasManager {
    constructor() {
    }


}

const matchesManager = new MatchesManager(context);

btnAddMatch.addEventListener('click', () => {
    const count = numMatchesCount.value || 1;
    matchesManager.addMatch(count);
});

mouseUp = (e) => {
    if(!matchesManager.draggedMatch) return;

	canvas.addEventListener("mousedown", mouseDown, false);
    canvas.removeEventListener("mouseup", mouseUp, false);
    canvas.removeEventListener("mousemove", mouseMove, false);

    matchesManager.dropMatch();
};

mouseDown = (e) => {
    const rect = canvas.getBoundingClientRect();
    const point = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };

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

    matchesManager.draggedMatch.x = point.x;
    matchesManager.draggedMatch.y = point.y;
    context.clearRect(0, 0, canvas.width, canvas.height);
    matchesManager.drawMatches();
};

canvas.addEventListener('mousedown', mouseDown, false);