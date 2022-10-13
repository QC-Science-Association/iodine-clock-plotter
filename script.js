const storageKey = "qc-science-asso-iodine-clock-plot";

const model = { m: 0, c: 0 };
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
function eSquared() {
	let error = 0;
	for (const data of dataPoints) error += (data[1] - modelYAt(data[0])) * (data[1] - modelYAt(data[0]));
	return error / dataPoints.length;
}
function rSquared() {
	const avg = dataPoints.reduce((a, v) => a + v[1], 0) / dataPoints.length;
	const SStot = dataPoints.reduce((a, v) => a + (v[1] - avg) * (v[1] - avg), 0) / dataPoints.length;
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
	for (let i = 0; i < 300000; i++) {
		const dm = diffESquared_M(), dc = diffESquared_C();
		model.m -= 0.0001 / Math.sign(dm) * (Math.abs(dm) + 1);
		model.c -= 0.0001 / Math.sign(dc) * (Math.abs(dc) + 1);
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
	document.getElementById("equationpredictor").innerText = `${model.m.toFixed(7)}t + ${model.c.toFixed(7)}`;
	document.getElementById("rsquared").innerText = rSquared().toFixed(5);
}

function rerenderDatapointsAndTrain() {
	trainModel();
	rerenderDatapoints();
	updateTimeEstimate();
	localStorage.setItem(storageKey, JSON.stringify(dataPoints));
}


function updateTimeEstimate() {
	if (dataPoints.length < 2) return document.getElementById("outputpredicttime").innerText = "???mL";
	document.getElementById("outputpredicttime").innerText = `${Math.exp(modelYAt(
		Number(document.getElementById("inputpredicttime").value)
	)).toFixed(3)}mL`;
}


const c = document.getElementById("canvas");
const ctx = c.getContext("2d");
function maxX() { return dataPoints.reduce((a, v) => Math.max(a, v[0]), 0); }
function maxY() { return dataPoints.reduce((a, v) => Math.max(a, v[1]), 0); }
function minX() { return dataPoints.reduce((a, v) => Math.min(a, v[0]), 0); }
function minY() { return dataPoints.reduce((a, v) => Math.min(a, v[1]), 0); }
function rangeX() { return maxX() - minX(); }
function rangeY() { return maxY() - minY(); }

function renderData() {
	if (dataPoints.length < 2) return;
	ctx.clearRect(0, 0, c.width, c.height);
	// TODO implement this
}