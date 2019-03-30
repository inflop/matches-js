const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');
const btnAddMatch = document.querySelector('#btnAddMatch');
const btnClear = document.querySelector('#btnClear');
const btnSave = document.querySelector('#btnSave');
const numMatchesCount = document.querySelector('#numMatchesCount');

class Match {
    constructor(x, y) {
        this.x = x || canvas.width / 2;
        this.y = y || canvas.height / 2;
        this.width = 10;
        this.height = 150;
        this.dragged = false;
        this.isSelected = false;
        this.dragOffset = { x: 0, y: 0};
        this._rotated = false;
    }

    draw(ctx) {
        ctx.fillStyle = "yellow";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.lineWidth = 1;
        ctx.strokeStyle = this.isSelected ? "black" : "grey";
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
        this.context = ctx;
    }

    get matches() {
        return this._matches;
    }

    drawMatches() {
        this._matches.forEach(match => {
            match.draw(this.context);
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
        this._matches.forEach(m => m.isSelected = false);
        match.isSelected = true;
        this.drawMatches();
    }

    rotateSelectedMatch() {
        if(!this.selectedMatch) return;

        this.context.clearRect(0, 0, canvas.width, canvas.height);
        this.selectedMatch.rotate();
        this.drawMatches();
    }

    deleteSelectedMatch() {
        if (!this.selectedMatch) return;

        this._matches = this._matches.filter(m => !m.isSelected);
        this.context.clearRect(0, 0, canvas.width, canvas.height);
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
        if (!this.draggedMatch) return;

        this.draggedMatch.dragOffset = { x: 0, y: 0 };
        this.draggedMatch.dragged = false;
    }

    moveDraggedMatchToPoint(point = { x, y }) {
        if (!this.draggedMatch) return;

        this.draggedMatch.x = point.x;
        this.draggedMatch.y = point.y;
        this.context.clearRect(0, 0, canvas.width, canvas.height);
        this.drawMatches();
    }

    get draggedMatch() {
        return this._matches.filter(m => m.dragged)[0];
    }

    get selectedMatch() {
        return this._matches.filter(m => m.isSelected)[0];
    }

    clearMatches() {
        this._matches = [];
        this.context.clearRect(0, 0, canvas.width, canvas.height);
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

class CanvasManager {
    constructor(matchesManager) {
        this.matchesManager = matchesManager;
        this.canvas = this.matchesManager.context.canvas;

        this.canvas.width = window.innerWidth-50;
        this.canvas.height = window.innerHeight-50;

        this._mouseDownRef = null;
        this._contextmenuRef = null;
        this._mouseMoveRef = null;
        this._mouseUpRef = null;

        let self = this;
        this.canvas.addEventListener('mousedown', self._mouseDownRef = (e) => self.mouseDown(e), false);
        this.canvas.addEventListener('contextmenu', self._contextmenuRef = (e) => self.contextMenu(e), false);
    }

    refresh() {
        this.matchesManager.drawMatches();
    }

    mouseUp(e) {
        let self = this;
        this.canvas.addEventListener('mousedown', self._mouseDownRef = (e) => self.mouseDown(e), false);
        this.canvas.removeEventListener("mouseup", self._mouseUpRef, false);
        this.canvas.removeEventListener("mousemove", self._mouseMoveRef, false);

        if (!this.matchesManager.draggedMatch) return;
        this.matchesManager.dropMatch();
    }

    mouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const point = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        this.matchesManager.selectMatchAtPoint(point);
        this.matchesManager.dragMatchAtPoint(point);

        let self = this;
        this.canvas.addEventListener('mousemove', self._mouseMoveRef = (e) => self.mouseMove(e), false);
        this.canvas.addEventListener("mouseup", self._mouseUpRef = (e) => self.mouseUp(e), false);
        this.canvas.removeEventListener('mousedown', self._mouseDownRef, false);
    }

    mouseMove(e) {
        if (!this.matchesManager.draggedMatch) return;

        const rect = this.canvas.getBoundingClientRect();
        const point = {
            x: e.clientX - rect.left - this.matchesManager.draggedMatch.dragOffset.x,
            y: e.clientY - rect.top - this.matchesManager.draggedMatch.dragOffset.y
        };

        this.matchesManager.moveDraggedMatchToPoint(point);
    }

    contextMenu(e) {
        e.preventDefault();
        this.matchesManager.rotateSelectedMatch();
    }
}

const matchesManager = new MatchesManager(context);
const canvasManager = new CanvasManager(matchesManager);

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
    canvasManager.mouseUp(e);
};

mouseDown = (e) => {
    canvasManager.mouseDown(e);
};

mouseMove = (e) => {
    canvasManager.mouseMove(e);
};

keyDown = (e) => {
    switch(e.keyCode) {
        case 82:
            matchesManager.rotateSelectedMatch();            
            break;
        case 46:
            matchesManager.deleteSelectedMatch();
            break;
        case 45:
            matchesManager.addMatches(1);
            break;
        default:
            break;
    }
};

contextMenu = (e) => {
    canvasManager.contextMenu(e);
};

window.addEventListener("keydown", keyDown, false);