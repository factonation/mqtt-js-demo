const brokerUrl = 'ws://broker.emqx.io:8083/mqtt'
const clientId = 'mqttjs_' + Math.random().toString(16).substring(2, 8)
const options = {
  keepalive: 60,
  clientId: clientId,
  protocolId: 'MQTT',
  protocolVersion: 4,
  clean: true,
  reconnectPeriod: 1000,
  connectTimeout: 30 * 1000,
  will: {
    topic: 'factonation/mqtt-hmi/will',
    payload: 'Connection Closed abnormally..!',
    qos: 0,
    retain: false
  },
}

const topic = 'factonation/mqtt-hmi/data'

const client = mqtt.connect(brokerUrl)

const data = []

client.on('connect', () => {
  console.log(`Connected, id ${clientId}`);
  client.subscribe(topic, { qos: 0 }, (err) => {
    if (!err) {
      console.log(`Subscribed to topic: ${topic}`)
    }
  });
});

client.on('reconnect', function () {
  console.log('Reconnecting...')
})

client.on('close', function () {
  console.log('Disconnected')
})

client.on('offline', function () {
  console.log('offline')
})

client.on('error', function (error) {
  console.log(error)
})

client.on('message', (topic, message) => {
  const payload = JSON.parse(message.toString())
  payload.timestamp = new Date()

  data.push(payload)

  if (data.length > 20) data.shift()

  updateVisualizations()
})

const margin = { top: 20, right: 20, bottom: 40, left: 50 }
const width = 500 - margin.left - margin.right
const height = 300 - margin.top - margin.bottom

updateLED = () => {
  const led = document.getElementById("led")
  led.style.backgroundColor = data.at(-1).y0 ? "#2ecc71" : "gray"
}

updateBarChart = () => {
  d3.select("#bar").selectAll("*").remove();
  const svg = d3.select("#bar").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`)

  const xScale = d3.scaleTime()
    .domain(d3.extent(data, d => d.timestamp))
    .range([0, width])

  const yScale = d3.scaleLinear()
    .domain([0, 100])
    .range([height, 0])

  const xAxis = d3.axisBottom(xScale)
    .tickFormat(d3.timeFormat("%H:%M:%S"))

  const yAxis = d3.axisLeft(yScale)

  svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(xAxis)

  svg.append("g").call(yAxis)

  svg.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", d => xScale(d.timestamp) - 5)
    .attr("y", d => yScale(d.d0))
    .attr("width", 10)
    .attr("height", d => height - yScale(d.d0))
    .attr("fill", "steelblue")
}

updateTrendChart = () => {
  d3.select("#trend").selectAll("*").remove();
  const svg = d3.select("#trend").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`)

  const xScale = d3.scaleTime()
    .domain(d3.extent(data, d => d.timestamp))
    .range([0, width])

  const yScale = d3.scaleLinear()
    .domain([0, 100])
    .range([height, 0])

  const xAxis = d3.axisBottom(xScale)
    .tickFormat(d3.timeFormat("%H:%M:%S"))

  const yAxis = d3.axisLeft(yScale)

  const line = d3.line()
    .x(d => xScale(d.timestamp))
    .y(d => yScale(d.d0))

  svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(xAxis)

  svg.append("g").call(yAxis);

  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "orange")
    .attr("stroke-width", 2)
    .attr("d", line)
}

dataDump = () => {
  document.getElementById("data").textContent = JSON.stringify(data, null, 2)
}

updateVisualizations = () => {
  updateLED()
  updateBarChart()
  updateTrendChart()
  dataDump()
}