#!/usr/bin/env node
import {exec} from 'node:child_process'
import {createServer} from 'node:http'
import {createInterface} from 'node:readline'
import {parseArgs} from 'node:util'

let data = []

let options = parseArgs({options: {
    port: {short: 'p', type: 'string', default: '3100'},
    open: {short: 'o', type: 'boolean'},
    exit: {short: 'x', type: 'boolean'},
    help: {short: 'h', type: 'boolean'},
}})

if (options.values.help) {
    console.error('usage: [-p|--port <port>] [-o|--no-open] [-x|--no-exit] < [file]')
    process.exit(1)
}

let readline = createInterface({input: process.stdin})
for await (let line of readline) {
    let matches = line.match(/(\d+\.?\d*)/g) ?? []
    for (let match of matches) {
        data.push(Number(match))
    }
}

let server = createServer()
server.on('request', function (request, response) {
    if (request.url !== '/') return
    response.end(html)
    response.on('close', function () {
        if (! options.values.exit) process.exit(0)
    })
})

let host = 'localhost'
server.listen({port: options.values.port, host}, function () {
    let url = `http://${host}:${options.values.port}/`
    if (! options.values.open) exec(`open ${url}`)
    console.info(`${url}`)
})

let html = `<!doctype html>
<title>chartit</title>
<canvas></canvas>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script type="module">
let data = JSON.parse(document.getElementById('data').textContent)
let labels = [...data.keys()]
let chart = new Chart(document.querySelector('canvas'), {
    type: 'line',
    data: {labels, datasets: [{data}]},
    options: {
        animation: false,
        datasets: {line: {borderWidth: 1, pointRadius: 0, pointHitRadius: 0}},
        scales: {x: {display: false, grid: {display: false}}, y: {grid: {display: false}}},
        plugins: {legend: {display: false}, tooltip: {enabled: false}}
    },
})
</script>
<script id="data" type="application/json">${JSON.stringify(data)}</script>`
