const storageKey = "qc-science-asso-iodine-clock-plot";

const model = { m: 0, c: 0 };
const c = document.getElementById("canvas");
const ctx = c.getContext("2d");
function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}
let dataPoints = [];
try {
	if (localStorage.getItem(storageKey)) dataPoints = JSON.parse(localStorage.getItem(storageKey));
	rerenderDatapointsAndTrain();
} catch {}
function modelYAt(x) {
	return model.m * x + model.c;
}
function modelXAt(y) {
	return (y - model.c) / model.m;
}
function eSquared() {
	let error = 0;
	for (const data of dataPoints) error += (data[1] - modelYAt(data[0])) * (data[1] - modelYAt(data[0]));
	return error / dataPoints.length;
}
function rSquared() {
	const avg = dataPoints.reduce((a, v) => a + v[1], 0) / dataPoints.length;
	const SStot = dataPoints.reduce((a, v) => a + (v[1] - avg) * (v[1] - avg), 0) / dataPoints.length;
	if (SStot === 0) return 1;
	return 1 - (eSquared() / SStot);
}
function diffESquared_M() {
	let errorDiv = 0;
	// d/dm (y - (mx + c))^2
	for (const data of dataPoints) errorDiv += (modelYAt(data[0]) - data[1]) * 2 * data[0];
	return errorDiv / dataPoints.length;
}
function diffESquared_C() {
	let errorDiv = 0;
	// d/dc (y - (mx + c))^2
	for (const data of dataPoints) errorDiv += (modelYAt(data[0]) - data[1]) * 2;
	return errorDiv / dataPoints.length;
}

function trainModel() {
	model.m = 0;
	model.c = 0;
	for (let i = 0; i < 500000; i++) {
		const dm = diffESquared_M(), dc = diffESquared_C();
		if (dm !== 0) model.m -= 0.000003 * dm;
		if (dc !== 0) model.c -= 0.0003 * dc;
	}
}

function addData() {
	dataPoints.push([0, 0]);
	rerenderDatapointsAndTrain();
}
function removeData(id) {
	dataPoints.splice(id, 1);
	rerenderDatapointsAndTrain();
}

function rerenderDatapoints() {
	document.getElementById("datacol").innerHTML = "";
	for (let i = 0; i < dataPoints.length; i++) {
		const inputX = `Solution B used: <input type="number"
		onchange="dataPoints[${i}][1] = Math.log(Number(this.value)); rerenderDatapointsAndTrain();"
		value="${Math.round(Math.exp(dataPoints[i][1]) * 1e5) / 1e5}"/>`;
		const inputY = `Time (Seconds): <input type="number"
		onchange="dataPoints[${i}][0] = Number(this.value); rerenderDatapointsAndTrain();"
		value="${dataPoints[i][0]}"/>`;
		const deleteButton = `<button onclick="if (confirm('Delete?')) removeData(${i});">Del</button>`;
		document.getElementById("datacol").innerHTML += `<div>
			${inputX}<br>${inputY}<br>${deleteButton}
		</div>`;
	}
	if (dataPoints.length >= 2) {
		document.getElementById("equationpredictor").innerText = `${model.m.toFixed(7)}t + ${model.c.toFixed(7)}`;
		document.getElementById("rsquared").innerText = rSquared().toFixed(5);
	} else {
		document.getElementById("equationpredictor").innerText = "?t + ?";
		document.getElementById("rsquared").innerText = "?";
	}
}

function rerenderDatapointsAndTrain() {
	trainModel();
	rerenderDatapoints();
	renderData();
	updateTimeEstimate();
	updateVolEstimate();
	localStorage.setItem(storageKey, JSON.stringify(dataPoints));
}


function updateTimeEstimate() {
	if (dataPoints.length < 2) return document.getElementById("outputpredicttime").innerText = "???mL";
	document.getElementById("outputpredicttime").innerText = `${Math.exp(modelYAt(
		Number(document.getElementById("inputpredicttime").value)
	)).toFixed(3)}mL`;
}

function updateVolEstimate() {
	if (dataPoints.length < 2) return document.getElementById("outputpredictvol").innerText = "???s";
	document.getElementById("outputpredictvol").innerText = `${modelXAt(Math.log(
		Number(document.getElementById("inputpredictvol").value)
	)).toFixed(3)}s`;
}


function maxX() { return dataPoints.reduce((a, v) => Math.max(a, v[0]), -Infinity); }
function maxY() { return dataPoints.reduce((a, v) => Math.max(a, v[1]), -Infinity); }
function minX() { return dataPoints.reduce((a, v) => Math.min(a, v[0]), Infinity); }
function minY() { return dataPoints.reduce((a, v) => Math.min(a, v[1]), Infinity); }
function rangeX() { return maxX() - minX(); }
function rangeY() { return maxY() - minY(); }

function renderData() {
	if (dataPoints.length < 2) return;
	ctx.clearRect(0, 0, c.width, c.height);
	ctx.lineWidth = 5;
	const bottomY = minY() - rangeY() * 0.2;
	const topY = maxY() + rangeY() * 0.2;
	const leftX = minX() - rangeX() * 0.2;
	const rightX = maxX() + rangeX() * 0.2;

	// Draw axis lines
	ctx.fillStyle = "#000";
	ctx.fillRect(48, 0, 4, c.height - 48);
	ctx.fillRect(50, c.height - 52, c.width - 50, 4);
	for (let i = 0; i < 3; i++) {
		ctx.clearRect(45, c.height - 64 + i * 5, 10, 2);
		ctx.clearRect(52 + i * 5, c.height - 55, 2, 10);
	}
	
	// Draw gridlines
	ctx.textAlign = "right";
	ctx.textBaseline = "middle";
	ctx.font = "14px arial";
	for (let i = 25; i <= c.height - 75; i += 50) {
		ctx.fillStyle = "#000";
		const t = i / (c.height - 50);
		ctx.fillText((t * bottomY + (1 - t) * topY).toFixed(3),
		45, i);
		ctx.fillStyle = "#aaa";
		ctx.fillRect(52.5, i - 1, c.width, 2);
	}
	ctx.textAlign = "center";
	ctx.textBaseline = "top";
	for (let i = 75; i <= c.width; i += 50) {
		ctx.fillStyle = "#000";
		const t = (i - 50) / (c.width - 50);
		ctx.fillText((t * rightX + (1 - t) * leftX).toFixed(2),
		i, c.height - 45);
		ctx.fillStyle = "#aaa";
		ctx.fillRect(i - 1, 0, 2, c.height - 52.5);
	}

	// Draw data points
	const yAtLeft = modelYAt(leftX);
	const yAtRight = modelYAt(rightX);
	ctx.strokeStyle = "#000";
	ctx.beginPath();
	ctx.moveTo(50, (1 - (yAtLeft - bottomY) / (topY - bottomY)) * (c.height - 50));
	ctx.lineTo(c.width, (1 - (yAtRight - bottomY) / (topY - bottomY)) * (c.height - 50));
	ctx.stroke();
	ctx.fillStyle = "#f00";
	for (const point of dataPoints) {
		const y = (1 - (point[1] - bottomY) / (topY - bottomY)) * (c.height - 50);
		const x = (point[0] - leftX) / (rightX - leftX) * (c.width - 50) + 50;
		ctx.fillRect(x - 5, y - 5, 10, 10);
	}
}