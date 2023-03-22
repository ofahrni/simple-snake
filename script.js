const snakeModule = (function () {
    return {
        timer: false,
        fieldCols: 11,
        fieldRows: 11,
        container: null,
        appleIndex: 0,
        moveInterval: 500,
        playerCount: 2,
        snakes: [],
        controlSets: [
            {
                'KeyW': 'up',
                'KeyS': 'down',
                'KeyA': 'left',
                'KeyD': 'right'   
            },
            {
                'ArrowUp': 'up',
                'ArrowDown': 'down',
                'ArrowLeft': 'left',
                'ArrowRight': 'right'   
            }
        ],

        init: function() {
            snakeModule.container = document.querySelector('section');
            snakeModule.startGame();

            document.querySelector('.restart').addEventListener('click', snakeModule.restartGame)
        },
        
        startGame: function() {    
            if (!snakeModule.container.children.length) {
                snakeModule.createTiles(snakeModule.fieldCols, snakeModule.fieldRows);        
            }

            const scoreContainer = document.querySelector('.score-container');
            for (let i = 0; i < snakeModule.playerCount; i++) {
                const snake = snakeModule.snakes[snakeModule.snakes.push(snakeModule.getSnake(i)) - 1];

                snakeModule.spawnSnake(snake);

                const scoreWrapper = document.createElement('div');
                scoreWrapper.classList.add('score-wrapper');

                const scoreEl = document.createElement('span');
                scoreEl.classList.add('score-' + snake.id.toString());
                scoreWrapper.appendChild(scoreEl);

                scoreWrapper.innerHTML = 'Player ' + (snake.id + 1).toString() + ': ' + scoreWrapper.innerHTML;
                scoreContainer.appendChild(scoreWrapper);

                snakeModule.updateScore(snake);
            }

            snakeModule.drawSnakes();
            snakeModule.spawnApple();
        
            window.addEventListener('keydown', snakeModule.controlSnake);  
        },

        restartGame: function() {
            snakeModule.score = 0;
            snakeModule.snakes = [];
            snakeModule.resetSnakeTiles();
            document.querySelector('.score-container').innerHTML = '';

            snakeModule.startGame();

            document.querySelector('.modal-game-end').style.display = 'none';
        },
        
        createTiles: function(cols, rows) {
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    let el = document.createElement('div')
                    el.classList.add('tile')
                    el.style.flexBasis = (100 / cols).toString() + '%';
                    el.dataset['index'] = (i * rows) + j
        
                    snakeModule.container.appendChild(el)
                }
            }
        },
        
        spawnApple: function() {
            let snakeTiles = [];
            snakeModule.snakes.forEach(snake => {
                snakeTiles = [...snakeTiles, ...snake.tileIndexes];
            });

            snakeTiles = new Array(new Set(snakeTiles));

            let nonSnakeTiles = [];
            for (let i = 0; i < (snakeModule.fieldCols * snakeModule.fieldRows) - (snakeTiles.length - 1); i++) {
                if (!snakeTiles.includes(i)) {
                    nonSnakeTiles.push(i);
                }
            }

            document.querySelectorAll('.food-tile').forEach(el => {
                el.classList.remove('food-tile');
            });

            snakeModule.appleIndex = nonSnakeTiles[Math.floor(Math.random() * nonSnakeTiles.length)];
            snakeModule.container.children[snakeModule.appleIndex].classList.add('food-tile');
        },

        getSnake: function(id) {
            return {
                id: id,
                score: 0,
                tileIndexes: [],
                headDirection: '',
                invalidDirection: '',
                controlSet: snakeModule.controlSets[id],
            }
        },
        
        spawnSnake: function(snake, startPos = 0) {
            if (!startPos || snakeModule.snakes.length > 1) {
                let snakeTiles = [];
                snakeModule.snakes.forEach(snake => {
                    snakeTiles = [...snakeTiles, ...snake.tileIndexes];
                });

                do {
                    startPos = Math.floor(Math.random() * (snakeModule.fieldCols * snakeModule.fieldRows));
                }
                while (snakeTiles.includes(startPos));
            }

            snake.tileIndexes = [];
            snake.tileIndexes.push(startPos);
        },
        
        drawSnakes: function() {
            const fieldTiles = document.querySelectorAll('.tile');

            snakeModule.snakes.forEach(snake => {
                snake.tileIndexes.forEach((tileIndex, i) => {
                    const tile = fieldTiles[tileIndex];
                    tile.classList.add('snake-tile');

                    if (i === 0) {
                        tile.classList.add('snake-head');
                        }
                    else if (snake.tileIndexes.length > 1 && i === snake.tileIndexes.length - 1) {
                        tile.classList.add('snake-tail');
                    }
                });
            });
        },

        resetSnakeTiles: function () {
            const snakeTiles = document.querySelectorAll('.tile');
            snakeTiles.forEach(tile => {
                tile.classList.remove('snake-tile');
                tile.classList.remove('snake-head');
                tile.classList.remove('snake-tail');
            })
        },
        
        controlSnake: function(e) {
            snakeModule.snakes.forEach(snake => {
                if (Object.keys(snake.controlSet).includes(e.code)) {
                    const moveDirection = snake.controlSet[e.code];

                    if (snake.invalidDirection !== moveDirection) {
                        snake.headDirection = moveDirection;
                    }
            
                    if (!snakeModule.timer) {
                        snakeModule.timer = setInterval(snakeModule.moveHandler, snakeModule.moveInterval);
                    }
                }
            });

            if (e.code == 'Space' && snakeModule.timer) {
                window.clearInterval(snakeModule.timer)
                snakeModule.timer = false;

                snakeModule.snakes.forEach(snake => {
                    snake.headDirection = '';
                });
            }
        },

        updateScore: function(snake) {
            document.querySelector('.score-' + snake.id.toString()).innerHTML = snake.score.toString();
        },

        gameOver: function(data) {
            window.clearInterval(snakeModule.timer)
            snakeModule.timer = false;

            console.log('data', data);

            let message = '';
            let player = (data.snake_id + 1).toString();
            switch (data.cause) {
                case 'own_snake':
                    message = 'Player ' + player + ' tried to eat himself...' 

                    break;
                case 'other_snake':
                    let otherPlayer = (data.other_snake_id + 1).toString();

                    message = 'Player ' + player + ' tried to eat Player ' + otherPlayer + '...' 
                    break;
            }

            document.querySelector('.end-message').innerHTML = message;
            document.querySelector('.end-score').innerHTML = document.querySelector('.score-container').innerHTML;
            document.querySelector('.modal-game-end').style.display = 'block';

            window.removeEventListener('keydown', snakeModule.controlSnake);
        },

        getSnakeTileMap: function() {
            let snakeTileMap = {}
            snakeModule.snakes.forEach(snake => {
                snake.tileIndexes.forEach(tileIndex => {
                    snakeTileMap[tileIndex] = snake.id;
                });
            });

            return snakeTileMap;
        },
        
        moveHandler: function() {
            const moveMap = {
                'up': snakeModule.fieldCols * -1, 
                'down': snakeModule.fieldCols, 
                'left': -1, 
                'right': 1
            }

            snakeModule.snakes.forEach(snake => {
                const headIndex = snake.tileIndexes[0];
                const tileCount = snakeModule.fieldRows * snakeModule.fieldCols;

                let newHeadIndex = snake.tileIndexes[0]
                if (snake.headDirection) {
                    newHeadIndex += moveMap[snake.headDirection];
                }

                switch (snake.headDirection) {
                    case 'up':
                        snake.invalidDirection = 'down';

                        if (newHeadIndex < 0) {
                            newHeadIndex = tileCount + newHeadIndex;   
                        }                        
                        break;

                    case 'down':
                        snake.invalidDirection = 'up';

                        if (newHeadIndex > tileCount - 1) {
                            newHeadIndex = newHeadIndex % snakeModule.fieldCols;
                        }
                        break;

                    case 'left':
                        snake.invalidDirection = 'right';

                        if (headIndex % snakeModule.fieldCols === 0) {
                            newHeadIndex = newHeadIndex + snakeModule.fieldCols;
                        }
                        break;

                    case 'right':
                        snake.invalidDirection = 'left';

                        if (headIndex % snakeModule.fieldCols === (snakeModule.fieldCols - 1)) {
                            newHeadIndex = newHeadIndex - snakeModule.fieldCols;
                        }
                        break;
                }

                const snakeTileMap = snakeModule.getSnakeTileMap();

                if (Object.keys(snakeTileMap).includes(newHeadIndex.toString())) {
                    const gameOver = {
                        'cause': '',
                        'snake_id': snake.id,
                        'other_snake_id': 0,
                    }
    
                    if (parseInt(snakeTileMap[newHeadIndex]) === snake.id) {
                        if (newHeadIndex != snake.tileIndexes[snake.tileIndexes.length - 1] && snake.headDirection) {
                            gameOver.cause = 'own_snake';
                        }
                    }
                    else {
                        gameOver.cause = 'other_snake';
                        gameOver.other_snake_id = snakeTileMap[newHeadIndex];
                    }
    
                    if (gameOver.cause) {
                        snakeModule.gameOver(gameOver);
                    }
                }

                if (snake.headDirection) {
                    snake.tileIndexes.unshift(newHeadIndex);
                }

                if (newHeadIndex === snakeModule.appleIndex) {
                    snake.score += 1;
                    snakeModule.updateScore(snake);
                    snakeModule.spawnApple();
                    
                }
                else if (snake.headDirection) {
                    snake.tileIndexes.pop();
                }

                if (snake.tileIndexes.length < 2) {
                    snake.invalidDirection = '';
                }
            });
            

            snakeModule.resetSnakeTiles();
            snakeModule.drawSnakes();
        }
    }
})();

window.addEventListener('load', snakeModule.init);