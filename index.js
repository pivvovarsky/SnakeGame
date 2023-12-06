// referencja do canvas i tworzenie kontekstu do manipulacji rysunku
const canvas = document.getElementById("game");
const context = canvas.getContext("2d");
const canvasBoard = document.getElementById("dashboard");
const ctxDashboard = canvasBoard.getContext("2d");

//cialo weza, x i y dla danej czesci weza
class SnakePart {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
}

class Bird {
	constructor(x, y, speed) {
		this.x = x;
		this.y = y;
		this.speed = speed;

		// Inicjalizacja obiektu obrazu ptaka
		this.birdImage = new Image();
		this.birdImage.src = "./assets/images/bird.png"; // Zmień ścieżkę dostępu do obrazu
	}

	move() {
		// przesuniecie ptaka poziomo zgodnie z jej prędkością
		this.x += this.speed;
		// Jeśli ptak wyjdzie poza prawy kraniec, przesuń go z powrotem na lewą stronę
		if (this.x > 600) {
			this.x = -50;
		}
	}

	draw() {
		const birdCanvas = document.getElementById("birdCanvas");
		const ctxBird = birdCanvas.getContext("2d");

		// Wyczyść obszar canvasa, aby narysować nową pozycję chmurki
		ctxBird.clearRect(0, 0, birdCanvas.width, birdCanvas.height);

		// Rysuj chmurę jako obraz na canvasie
		ctxBird.drawImage(this.birdImage, this.x - 20, this.y - 20, 40, 40);
	}
}

// glowna klasa, logika gry
class SnakeGame {
	constructor() {
		this.bird = new Bird(50, 50, 3);
		// ilosc kwadratow na planszy
		this.tileCount = 20;
		// wielkosc kwadratu na planszy
		this.tileSize = canvas.width / this.tileCount - 2;
		//glowa weza  - wymiary
		this.headX = 10;
		this.headY = 10;
		//startowa dlugosc weza
		this.tailLength = 2;
		//kolejne czesci - dlugosc weza
		this.snakeParts = [];
		// zmiana pozycji
		this.xVelocity = 0;
		this.yVelocity = 0;
		// jablko wymiary
		this.appleX = 5;
		this.appleY = 5;
		// gra - wynik
		this.score = 0;

		// zmienna na punkty do przyspieszenie weza
		this.pointsToSpeedUp = 3;
		// poziom przyspieszenia
		this.level = 1;
		//snake speed - 7 times by second
		this.speed = 7;

		this.gameOver = false;
		this.restart = false;

		// // tlo
		this.backgroundImage = new Image();
		this.backgroundImage.src = "./assets/images/Background2.jpg";

		// dzwieki
		this.CHOMP_SOUND = new Audio("./assets/sounds/Chomp.mp3");
		this.GAME_OVER_SOUND = new Audio("./assets/sounds/GameOver.mp3");
		this.SNAKE_HISSES_SOUND = new Audio(
			"./assets/sounds/SnakeHisseswithInhales.mp3"
		);

		this.stopHisses = false;

		document.body.addEventListener("keydown", this.keyDown.bind(this));
	}

	//rysowanie tablicy z wynikiem
	drawDashboard() {
		// Wyczyść obszar dashboardu
		ctxDashboard.clearRect(0, 0, canvasBoard.width, canvasBoard.height);

		// Rysuj trójwymiarowy wynik
		const gradient = ctxDashboard.createLinearGradient(
			0,
			0,
			canvasBoard.width,
			0
		);

		// Dodaj kolorowe stopnie do gradientu
		gradient.addColorStop("0", "red");
		gradient.addColorStop("0.5", "yellow");
		gradient.addColorStop("1.0", "green");

		// Ustaw gradient jako styl wypełnienia
		ctxDashboard.fillStyle = gradient;
		ctxDashboard.font = "bold 20px Arial";

		// Rysuj tekst wyniku
		ctxDashboard.fillText(
			"SCORE: " + this.score,
			canvasBoard.width / 3.5,
			canvasBoard.height / 2
		);
	}

	//rysowanie game over
	drawGameOverText() {
		if (this.gameOver) {
			const currentTime = Date.now();
			const gradient = context.createLinearGradient(
				0,
				0,
				canvas.width,
				0
			);

			gradient.addColorStop("0", `hsl(${currentTime % 360}, 100%, 50%)`);
			gradient.addColorStop(
				"0.5",
				`hsl(${(currentTime + 180) % 360}, 100%, 50%)`
			);
			gradient.addColorStop(
				"1.0",
				`hsl(${(currentTime + 360) % 360}, 100%, 50%)`
			);

			context.fillStyle = gradient;
			context.font = "50px Consolas";
			context.fillText(
				"GAME OVER !",
				canvas.width / 8,
				canvas.height / 2
			);

			requestAnimationFrame(this.drawGameOverText.bind(this));
		}
	}

	// logika gry, ruch weza, sprawdzenie kolizji, rysowanie elementów
	drawGame() {
		// zmiana pozycji weza
		this.moveSnakePosition();
		// sprawdzenie czy gra jest zakonczona
		let result = this.isGameOver();
		if (result) {
			this.drawGameOverText();
			return;
		}
		// czyszczenie obrazu
		this.clearScreen();

		//sprawdzenie kolizji z jablkiem
		this.checkAppleCollision();
		// rysowanie tla
		this.drawBackground();

		//rysowanie jablka
		this.drawApple();
		//rysowanie weza
		this.drawSnake();
		//przyspieszenie o 1 co 3 dodatkowe czesci weza + 1 poziom
		if (this.score % this.pointsToSpeedUp === 0 && this.score !== 0) {
			this.speed += 1; //predkosc +1
			this.pointsToSpeedUp += 3; // co 3 jablka zjedzone
			this.level += 1; // poziom +1
		}
		// odswiezaj co 1000/7
		setTimeout(this.drawGame.bind(this), 1000 / this.speed);

		//rysuj tablice
		this.drawDashboard();
		this.bird.move();
		this.bird.draw();
	}

	clearScreen() {
		context.fillRect(0, 0, canvas.width, canvas.height);
	}

	drawBackground() {
		context.drawImage(
			this.backgroundImage,
			0,
			0,
			canvas.width,
			canvas.height
		);
	}

	drawSnake() {
		context.fillStyle = "green";

		for (let i = 0; i < this.snakeParts.length; i++) {
			let part = this.snakeParts[i];
			context.fillRect(
				part.x * this.tileCount, // polozenie kolejnych czesci weza
				part.y * this.tileCount,
				this.tileSize, //rozmiar kolejnych czesci weza
				this.tileSize
			);
		}

		this.snakeParts.push(new SnakePart(this.headX, this.headY)); //dodajemy kawalek do czesci weza
		if (this.snakeParts.length > this.tailLength) {
			this.snakeParts.shift(); //usuniecie jesli jest juz wiekszy niz bazowa dlugosc
		}

		context.fillStyle = "orange";
		context.fillRect(
			this.headX * this.tileCount,
			this.headY * this.tileCount,
			this.tileSize,
			this.tileSize
		);
	}

	restartGame() {
		this.headX = 10;
		this.headY = 10;
		this.tailLength = 2;
		this.snakeParts = [];
		this.xVelocity = 0;
		this.yVelocity = 0;
		this.appleX = 5;
		this.appleY = 5;
		this.score = 0;
		this.speed = 7;

		this.gameOver = false; // Ustaw stan gry na niezakończoną

		this.drawGame(); // Rozpocznij nową grę
	}

	keyDown(event) {
		//w gore
		if (event.keyCode === 38) {
			if (this.yVelocity === 1) return; // blokowanie skretu
			this.yVelocity = -1;
			this.xVelocity = 0;

			// w dol
		} else if (event.keyCode === 40) {
			if (this.yVelocity === -1) return;
			this.yVelocity = 1;
			this.xVelocity = 0;

			// lewo
		} else if (event.keyCode === 37) {
			if (this.xVelocity === 1) return;
			this.yVelocity = 0;
			this.xVelocity = -1;

			//prawo
		} else if (event.keyCode === 39) {
			if (this.xVelocity === -1) return;
			this.yVelocity = 0;
			this.xVelocity = 1;
		}

		if (this.gameOver && event.keyCode === 13) {
			this.restartGame();
		}
	}

	moveSnakePosition() {
		this.headX = this.headX + this.xVelocity; // zmiana pozycji o xVelocity/yVelocity w zaleznosci od keyDown() co 1000/7
		this.headY = this.headY + this.yVelocity;
	}

	drawApple() {
		const pulsatingRadius = 10; // Początkowy promień pulsującego obrazka
		const pulsationSpeed = 0.005; // Szybkość pulsacji

		const centerX = (this.appleX + 0.5) * this.tileCount;
		const centerY = (this.appleY + 0.5) * this.tileCount;

		const currentTime = Date.now();
		const pulsationValue =
			pulsatingRadius * Math.abs(Math.sin(pulsationSpeed * currentTime));

		// Rysuj pulsujące jablko
		const appleImage = new Image();
		appleImage.src = "./assets/images/Apple.png"; // Ścieżka do obrazka jabłka
		context.drawImage(
			appleImage,
			centerX - pulsationValue,
			centerY - pulsationValue,
			pulsationValue * 2,
			pulsationValue * 2
		);
	}

	checkAppleCollision() {
		if (this.appleX === this.headX && this.appleY === this.headY) {
			this.appleX = Math.floor(Math.random() * this.tileCount);
			this.appleY = Math.floor(Math.random() * this.tileCount);
			this.tailLength++;
			this.CHOMP_SOUND.play();
			this.score++;
		}
	}

	isGameOver() {
		this.gameOver = false;

		if (this.xVelocity === 0 && this.yVelocity === 0) return false; // brak kolizji na start

		if (
			this.headX < 0 ||
			this.headX === this.tileCount ||
			this.headY < 0 ||
			this.headY === this.tileCount
		) {
			this.gameOver = true; // kolizja z samym soba - weza
		}

		for (let i = 0; i < this.snakeParts.length; i++) {
			let part = this.snakeParts[i];
			if (part.x === this.headX && part.y === this.headY) {
				gameOver = true;
				break;
			}
		}

		if (this.gameOver) {
			context.fillStyle = "white";
			context.font = "50px Consolas";
			var gradient = context.createLinearGradient(0, 0, canvas.width, 0);
			gradient.addColorStop("0", "magenta");
			gradient.addColorStop("0.5", "blue");
			gradient.addColorStop("1.0", "red"); // gradient game over, miejsce 0 -1, kolor
			context.fillStyle = gradient;
			context.fillText(
				"GAME OVER !",
				canvas.width / 8,
				canvas.height / 2
			);
		}

		if (this.gameOver) this.GAME_OVER_SOUND.play();

		return this.gameOver;
	}
}

//Inicjalizacja instancji gry i rozpoczecie rysowania gry.
const snakeGame = new SnakeGame();
snakeGame.drawGame();
