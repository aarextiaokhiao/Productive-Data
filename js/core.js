var game = {
	production: null,
	bits: 0,
	bytes: 0,
	upgrades: [0,0,0],
	options: {},
	statistics: {
		playtime: 0
	},
	version: "0.0.0.0",
	lastTick: new Date().getTime()
}

function produce(id) {
	if (game.production) document.getElementById("produce_"+game.production).textContent = "Produce"
	document.getElementById("produce_"+id).textContent = "Producing"
	game.production = id
}

function gameTick() {
	var diff = new Date().getTime() - game.lastTick
	game.lastTick += diff
	diff /= 1e3
	game.statistics.playtime += diff
}