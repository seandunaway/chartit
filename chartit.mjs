#!/usr/bin/env node
import {exec} from 'node:child_process'
import {createServer} from 'node:http'
import {createInterface} from 'node:readline'
import {pipeline} from 'node:stream'
import {parseArgs} from 'node:util'

let data = []

let options = parseArgs({options: {
    port: {short: 'p', type: 'string', default: '3100'},
    open: {short: 'o', type: 'boolean'},
    help: {short: 'h', type: 'boolean'}
}})

if (options.values.help) {
    console.error('usage: [-p|--port <port>] [-o|--open] < [file]')
    process.exit(1)
}

let readline = createInterface({input: process.stdin})
readline.on('line', function (line) {
    let matches = line.match(/(\d+\.?\d*)/g) ?? []
    for (let match of matches) {
        data.push(match)
    }
})

let server = createServer()
server.on('request', function (request, response) {
    if (request.url !== '/data') return response.end(html)

    response.writeHead(200, {'content-type': 'text/event-stream'})
    let i = 0
    setInterval(function () {
        if (data[i] === undefined) return
        response.write(`data: ${data[i]}\n\n`)
        i++
    }, 0)
})

let host = 'localhost'
server.listen({port: options.values.port, host}, function () {
    let url = `http://${host}:${options.values.port}/`
    if (options.values.open) exec(`open ${url}`)
    console.info(`\n${url}\n`)
})

let html = `<!doctype html>
<title>chartit</title>
<canvas></canvas>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script type="module">
let labels = []
let data = []
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
let i = 0
let event_source = new EventSource('/data').addEventListener('message', function (event) {
    labels.push(i)
    data.push(Number(event.data))
    i++
    chart.update()
})
</script>`
