// 3D Ludo Game using Three.js

class LudoGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.setClearColor(0xb3d9ff);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowShadowMap;

        this.camera.position.set(0, 12, 12);
        this.camera.lookAt(0, 0, 0);

        this.players = [
            { color: 0xff6b6b, name: 'Player 1', pieces: [], position: 0 },
            { color: 0xffd93d, name: 'Player 2', pieces: [], position: 1 },
            { color: 0x4ecdc4, name: 'Player 3', pieces: [], position: 2 },
            { color: 0x95e1d3, name: 'Player 4', pieces: [], position: 3 }
        ];

        this.currentPlayer = 0;
        this.diceValue = 0;
        this.selectedPiece = null;

        this.setupLights();
        this.createBoard();
        this.createPieces();
        this.createDice();
        this.setupControls();
        this.animate();
    }

    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 15, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        this.scene.add(directionalLight);
    }

    createBoard() {
        const boardSize = 10;
        const cellSize = 1;

        // Create main board with checkerboard pattern
        const geometry = new THREE.PlaneGeometry(boardSize * cellSize, boardSize * cellSize);
        const material = new THREE.MeshLambertMaterial({ color: 0xf5deb3 });
        const board = new THREE.Mesh(geometry, material);
        board.receiveShadow = true;
        this.scene.add(board);

        // Create cells with grid pattern
        const cellGeometry = new THREE.PlaneGeometry(cellSize * 0.95, cellSize * 0.95);
        const colors = [0xff6b6b, 0xffd93d, 0x4ecdc4, 0x95e1d3];

        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                const material = new THREE.MeshLambertMaterial({
                    color: (i + j) % 2 === 0 ? 0xffffff : 0xf0e68c
                });
                const cell = new THREE.Mesh(cellGeometry, material);
                cell.position.set(
                    (i - boardSize / 2) * cellSize + cellSize / 2,
                    0.01,
                    (j - boardSize / 2) * cellSize + cellSize / 2
                );
                cell.receiveShadow = true;
                this.scene.add(cell);
            }
        }

        // Add border
        const borderGeometry = new THREE.EdgesGeometry(geometry);
        const borderMaterial = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 3 });
        const border = new THREE.LineSegments(borderGeometry, borderMaterial);
        border.position.z = 0.02;
        this.scene.add(border);
    }

    createPieces() {
        const pieceRadius = 0.3;
        const pieceGeometry = new THREE.SphereGeometry(pieceRadius, 32, 32);

        const startPositions = [
            [-4, -4],
            [4, -4],
            [4, 4],
            [-4, 4]
        ];

        this.players.forEach((player, playerIndex) => {
            player.pieces = [];
            const startPos = startPositions[playerIndex];

            for (let i = 0; i < 4; i++) {
                const material = new THREE.MeshStandardMaterial({
                    color: player.color,
                    metalness: 0.3,
                    roughness: 0.4
                });

                const piece = new THREE.Mesh(pieceGeometry, material);
                piece.castShadow = true;
                piece.receiveShadow = true;
                piece.position.set(
                    startPos[0] + (i % 2) * 0.8,
                    0.35,
                    startPos[1] + Math.floor(i / 2) * 0.8
                );
                piece.playerIndex = playerIndex;
                piece.pieceIndex = i;
                piece.boardPosition = -1;
                piece.isHome = true;

                this.scene.add(piece);
                player.pieces.push(piece);
            }
        });
    }

    createDice() {
        const diceSize = 0.8;
        const diceGeometry = new THREE.BoxGeometry(diceSize, diceSize, diceSize);
        const diceMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.2,
            roughness: 0.3
        });

        this.dice = new THREE.Mesh(diceGeometry, diceMaterial);
        this.dice.castShadow = true;
        this.dice.receiveShadow = true;
        this.dice.position.set(-6, 0.5, -6);
        this.scene.add(this.dice);

        // Add dots to dice
        this.addDiceDots();
    }

    addDiceDots() {
        const dotRadius = 0.1;
        const dotGeometry = new THREE.SphereGeometry(dotRadius, 16, 16);
        const dotMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });

        const dotPositions = [
            // Top face (face 1)
            [{ x: 0, y: 0.42, z: 0 }],
            // Face 2
            [{ x: -0.2, y: 0.42, z: -0.2 }, { x: 0.2, y: 0.42, z: 0.2 }],
            // Face 3
            [{ x: -0.2, y: 0.42, z: -0.2 }, { x: 0, y: 0.42, z: 0 }, { x: 0.2, y: 0.42, z: 0.2 }],
            // Face 4
            [{ x: -0.2, y: 0.42, z: -0.2 }, { x: 0.2, y: 0.42, z: -0.2 }, { x: -0.2, y: 0.42, z: 0.2 }, { x: 0.2, y: 0.42, z: 0.2 }],
            // Face 5
            [{ x: -0.2, y: 0.42, z: -0.2 }, { x: 0.2, y: 0.42, z: -0.2 }, { x: 0, y: 0.42, z: 0 }, { x: -0.2, y: 0.42, z: 0.2 }, { x: 0.2, y: 0.42, z: 0.2 }],
            // Face 6
            [{ x: -0.2, y: 0.42, z: -0.25 }, { x: 0.2, y: 0.42, z: -0.25 }, { x: -0.2, y: 0.42, z: 0 }, { x: 0.2, y: 0.42, z: 0 }, { x: -0.2, y: 0.42, z: 0.25 }, { x: 0.2, y: 0.42, z: 0.25 }]
        ];
    }

    setupControls() {
        document.getElementById('rollDice').addEventListener('click', () => this.rollDice());
        document.getElementById('newGame').addEventListener('click', () => this.resetGame());
    }

    rollDice() {
        this.diceValue = Math.floor(Math.random() * 6) + 1;
        document.getElementById('diceValue').textContent = this.diceValue;
        
        // Animate dice
        this.animateDice();
        
        // Update UI
        this.updatePlayerDisplay();
        
        // Auto move to next player after a delay
        setTimeout(() => {
            this.currentPlayer = (this.currentPlayer + 1) % 4;
            this.updatePlayerDisplay();
        }, 1500);
    }

    animateDice() {
        let rotations = 0;
        const maxRotations = 15;
        const startRotation = { x: this.dice.rotation.x, y: this.dice.rotation.y, z: this.dice.rotation.z };
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / 500, 1);

            this.dice.rotation.x = startRotation.x + Math.random() * Math.PI * 2;
            this.dice.rotation.y = startRotation.y + Math.random() * Math.PI * 2;
            this.dice.rotation.z = startRotation.z + Math.random() * Math.PI * 2;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    updatePlayerDisplay() {
        const playerSpan = document.querySelector('.player');
        const colors = ['red', 'yellow', 'blue', 'green'];
        playerSpan.className = `player ${colors[this.currentPlayer]}`;
        playerSpan.textContent = this.players[this.currentPlayer].name;
    }

    resetGame() {
        this.currentPlayer = 0;
        this.diceValue = 0;
        document.getElementById('diceValue').textContent = '0';
        this.updatePlayerDisplay();
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Rotate pieces slightly
        this.players.forEach(player => {
            player.pieces.forEach(piece => {
                piece.rotation.x += 0.005;
                piece.rotation.y += 0.005;
            });
        });

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new LudoGame();
});

// Handle window resize
window.addEventListener('resize', () => {
    const canvas = document.getElementById('gameCanvas');
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    // Camera and renderer resize logic can be added here
});
