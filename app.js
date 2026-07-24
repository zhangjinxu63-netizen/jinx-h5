const defaultData = {
  "主线资产池": {
    caption: "核心资产与另类投资",
    groups: [
      {
        name: "核心指数",
        items: [
          { name: "沪深300", code: "SH000300 · 中国核心大盘资产", pe: "14.64", pb: "1.48", dy: "2.69%", temp: 42, direct: true },
          { name: "恒生科技", code: "HKHSTECH · 港股科技龙头", pe: "22.60", pb: "2.53", dy: "0.98%", temp: 35, direct: true },
          { name: "标普500", code: "SP500 · 美国大盘股核心基准", pe: "28.65", pb: "5.75", dy: "1.03%", temp: 82, direct: true },
          { name: "纳斯达克100", code: "NDX · 美国大型科技与成长公司", pe: "35.08", pb: "10.29", dy: "0.43%", temp: 75, direct: true }
        ]
      },
      {
        name: "另类投资",
        items: [
          { name: "黄金", code: "XAU/USD · 国际现货金（美元/盎司）", pe: "$—", pb: "1.12×", dy: "—", temp: 63, direct: true, gold: true, label1: "现货价格", label2: "200周均线倍数", label3: "计价单位", valueLabel: "USD/oz" },
          { name: "BTC", code: "BTC-USD · 实时 + 链上估值", pe: "$—", pb: "—", dy: "—", temp: 50, direct: true, crypto: true, label1: "实时价格", label2: "200周均线倍数", label3: "NVT Signal", valueLabel: "BTC-USD" }
        ]
      }
    ]
  },
  "中国策略专题": {
    caption: "红利、现金流、成长与小盘",
    groups: [
      {
        name: "中国策略指数",
        items: [
          { name: "中证红利", code: "SH000922 · 高股息与稳定分红策略", pe: "7.88", pb: "0.82", dy: "5.71%", temp: 28, direct: true },
          { name: "中证全指自由现金流", code: "SH932365 · 等待可靠指数估值源", pe: "—", pb: "—", dy: "—", temp: 50, direct: false },
          { name: "中证A500", code: "SH000510 · 行业均衡核心宽基", pe: "15.10", pb: "1.55", dy: "2.42%", temp: 46, direct: true },
          { name: "创业板指", code: "SZ399006 · 创新成长型企业代表", pe: "29.80", pb: "3.82", dy: "0.76%", temp: 38, direct: true },
          { name: "科创50", code: "SH000688 · 科创板核心龙头代表", pe: "42.30", pb: "3.67", dy: "0.38%", temp: 32, direct: true },
          { name: "中证1000", code: "SH000852 · A股小盘公司代表", pe: "31.60", pb: "1.91", dy: "1.37%", temp: 45, direct: true }
        ]
      }
    ]
  }
}

const markets = window.INDEX_DATA || defaultData
const marketNames = Object.keys(markets)
let currentMarket = marketNames[0]
let currentIndex = 0
let currentYears = 5

const tabs = document.querySelector("#marketTabs")
const groupList = document.querySelector("#groupList")
const viewport = document.querySelector("#candleViewport")

function flatItems(market) {
  return market.groups.flatMap(group => group.items.map(item => ({ ...item, group: group.name })))
}

function findRawItem(predicate) {
  for (const market of Object.values(markets)) {
    for (const group of market.groups) {
      const found = group.items.find(predicate)
      if (found) return found
    }
  }
  return null
}

marketNames.forEach(name => {
  const button = document.createElement("button")
  button.textContent = name
  button.addEventListener("click", () => {
    currentMarket = name
    currentIndex = 0
    render()
  })
  tabs.appendChild(button)
})

document.querySelectorAll("[data-years]").forEach(button => {
  button.addEventListener("click", () => {
    currentYears = Number(button.dataset.years)
    document.querySelectorAll("[data-years]").forEach(item => item.classList.toggle("active", item === button))
    drawLineChart()
  })
})

function tempLabel(value) {
  if (value < 20) return "偏冷"
  if (value < 40) return "较低"
  if (value < 60) return "中性"
  if (value < 80) return "偏热"
  return "高温"
}

function render() {
  const market = markets[currentMarket]
  const items = flatItems(market)
  const item = items[currentIndex]
  const temp = Math.max(0, Math.min(100, Number(item.temp ?? 50)))

  Array.from(tabs.children).forEach(button => button.classList.toggle("active", button.textContent === currentMarket))
  document.querySelector("#listTitle").textContent = item.group
  document.querySelector("#listCaption").textContent = market.caption
  document.querySelector("#focusRegion").textContent = `${currentMarket} · ${item.group}`
  document.querySelector("#focusName").textContent = item.name
  document.querySelector("#focusCode").textContent = item.code
  document.querySelector("#focusPe").textContent = item.pe
  document.querySelector("#focusPb").textContent = item.pb
  document.querySelector("#focusYield").textContent = item.dy
  document.querySelector("#focusTemp").textContent = Math.round(temp)
  document.querySelector("#tempLabel").textContent = tempLabel(temp)
  document.querySelector("#tempMarker").style.left = `${temp}%`
  document.querySelector("#metricLabel1").textContent = item.label1 || "PE"
  document.querySelector("#metricLabel2").textContent = item.label2 || "PB"
  document.querySelector("#metricLabel3").textContent = item.label3 || "股息率"
  document.querySelector("#temperatureTitle").textContent = item.crypto ? "BTC 综合估值温度" : item.gold ? "黄金周期温度" : "PE 估值温度"
  document.querySelector("#chartTitle").textContent = item.crypto || item.gold ? "平滑价格趋势" : "平滑估值趋势"

  const tag = document.querySelector("#focusTag")
  tag.textContent = item.crypto ? "实时行情" : item.gold ? "周期温度" : item.direct ? "指数估值" : "待接入"
  tag.className = `source-tag ${item.direct ? "direct-tag" : "proxy-tag"}`

  groupList.innerHTML = ""
  let globalIndex = 0
  market.groups.forEach(group => {
    const title = document.createElement("div")
    title.className = "group-title"
    title.textContent = group.name
    groupList.appendChild(title)

    const list = document.createElement("div")
    list.className = "index-list"
    group.items.forEach(row => {
      const index = globalIndex
      const button = document.createElement("button")
      button.className = `index-item ${index === currentIndex ? "selected" : ""}`
      button.innerHTML = `<span class="index-icon ${row.direct ? "" : "proxy"}">${row.name.slice(0, 2)}</span><span class="index-copy"><strong>${row.name}</strong><span>${row.code}</span></span><span class="index-value"><strong>${row.pe}</strong><span>${row.valueLabel || "PE (TTM)"}</span></span>`
      button.addEventListener("click", () => {
        currentIndex = index
        render()
      })
      list.appendChild(button)
      globalIndex += 1
    })
    groupList.appendChild(list)
  })

  drawLineChart()
}

function drawLineChart() {
  const item = flatItems(markets[currentMarket])[currentIndex]
  const count = currentYears * 12
  const step = 10
  const width = Math.max(viewport.clientWidth || 330, count * step + 28)
  const height = 118
  const svg = document.querySelector("#candleChart")
  svg.setAttribute("width", width)
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`)

  const seed = currentIndex + marketNames.indexOf(currentMarket) * 11 + 5
  let values = item.lineValues ? item.lineValues.slice(-count) : []
  let last = item.crypto ? 58 : item.gold ? 54 : 50 + seed

  if (!values.length) {
    for (let i = 0; i < count; i += 1) {
      last = Math.max(5, last + Math.sin((i + seed) * .42) * 1.45 + (((i * 11 + seed) % 7) - 3) * .22)
      values.push(last)
    }
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const y = value => 9 + (max - value) / (max - min || 1) * 94
  const points = values.map((value, index) => ({ x: 16 + index * step, y: y(value) }))
  let path = points.length ? `M ${points[0].x} ${points[0].y}` : ""
  for (let i = 1; i < points.length; i += 1) {
    const previous = points[i - 1]
    const current = points[i]
    const midX = (previous.x + current.x) / 2
    path += ` Q ${midX} ${previous.y}, ${current.x} ${current.y}`
  }
  const lastPoint = points[points.length - 1] || { x: 0, y: height - 8 }
  const area = `${path} L ${lastPoint.x} ${height - 8} L ${points[0]?.x || 0} ${height - 8} Z`
  let html = `<defs><linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#51e0b9" stop-opacity=".28"/><stop offset="100%" stop-color="#51e0b9" stop-opacity=".01"/></linearGradient></defs><line class="candle-grid" x1="0" y1="32" x2="${width}" y2="32"/><line class="candle-grid" x1="0" y1="62" x2="${width}" y2="62"/><line class="candle-grid" x1="0" y1="92" x2="${width}" y2="92"/><path class="trend-area" d="${area}"/><path class="trend-line" d="${path}"/>`

  svg.innerHTML = html
  requestAnimationFrame(() => {
    viewport.scrollLeft = viewport.scrollWidth - viewport.clientWidth
  })
}

let dragging = false
let startX = 0
let startScroll = 0
viewport.addEventListener("pointerdown", event => {
  dragging = true
  startX = event.clientX
  startScroll = viewport.scrollLeft
  viewport.setPointerCapture(event.pointerId)
  viewport.classList.add("grabbing")
})
viewport.addEventListener("pointermove", event => {
  if (dragging) viewport.scrollLeft = startScroll - (event.clientX - startX)
})
viewport.addEventListener("pointerup", () => {
  dragging = false
  viewport.classList.remove("grabbing")
})
viewport.addEventListener("pointercancel", () => {
  dragging = false
  viewport.classList.remove("grabbing")
})

async function refreshBtcPrice() {
  const badge = document.querySelector("#liveBadge")
  try {
    const response = await fetch("https://api.kraken.com/0/public/Ticker?pair=XBTUSD")
    const payload = await response.json()
    const ticker = Object.values(payload.result || {})[0]
    const btc = findRawItem(row => row.crypto)
    if (!btc || !ticker) return
    btc.pe = `$${Number(ticker.c[0]).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
    badge.textContent = "BTC 已实时更新"
    badge.classList.add("on")
    if (flatItems(markets[currentMarket])[currentIndex].crypto) render()
  } catch (_) {
    badge.textContent = "BTC 待更新"
    badge.classList.remove("on")
  }
}

async function refreshGoldPrice() {
  try {
    const response = await fetch(`https://xaus.com/api/v1/spot?compact=1&fresh=${Date.now()}`)
    const payload = await response.json()
    const gold = findRawItem(row => row.gold)
    if (!gold || !payload.spot_usd_oz) return
    gold.pe = `$${Number(payload.spot_usd_oz).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    if (flatItems(markets[currentMarket])[currentIndex].gold) render()
  } catch (_) {
    // 保留最近一次成功值，避免接口短暂波动导致页面跳空。
  }
}

refreshBtcPrice()
refreshGoldPrice()
setInterval(refreshBtcPrice, 15000)
setInterval(refreshGoldPrice, 60000)
render()
