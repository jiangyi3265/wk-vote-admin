<template>
  <div class="app-container stat-page">
    <el-card shadow="never" class="mb12">
      <div class="toolbar">
        <div class="tb-left">
          <span class="tb-label">投票活动：</span>
          <el-select v-model="activityId" placeholder="请选择活动" style="width: 280px" @change="loadStat">
            <el-option v-for="a in activities" :key="a.activityId" :label="a.title" :value="a.activityId" />
          </el-select>
          <el-tag v-if="stat.activity" :type="statusType(stat.activity.status)" style="margin-left:10px">{{ statusLabel(stat.activity.status) }}</el-tag>
        </div>
        <el-button type="primary" icon="Refresh" @click="loadStat">刷新数据</el-button>
      </div>
    </el-card>

    <el-row :gutter="16" class="mb12">
      <el-col :span="6" v-for="c in summaryCards" :key="c.label">
        <div class="stat-card" :style="{ background: c.bg }">
          <div class="sc-icon">{{ c.icon }}</div>
          <div class="sc-body">
            <div class="sc-num">{{ c.value }}</div>
            <div class="sc-label">{{ c.label }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-card shadow="never" class="mb12">
      <template #header><span class="card-title">🏆 各维度冠军榜</span></template>
      <el-empty v-if="!stat.options || !stat.options.length" description="暂无维度数据" />
      <el-row :gutter="16" v-else>
        <el-col :xs="12" :sm="8" :md="6" :lg="4" v-for="o in stat.options" :key="o.optionId">
          <div class="champ-card" :style="{ borderColor: o.color || '#6366f1' }">
            <div class="champ-dim"><span class="champ-emoji">{{ o.icon }}</span>{{ o.name }}</div>
            <template v-if="o.winner">
              <div class="champ-avatar" :style="{ background: o.color || '#6366f1' }">{{ (o.winner.name || '?').slice(-2) }}</div>
              <div class="champ-name">{{ o.winner.name }}</div>
              <div class="champ-votes" :style="{ color: o.color || '#6366f1' }">{{ o.winner.votes }} 票</div>
            </template>
            <div v-else class="champ-empty">暂无投票</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header><span class="card-title">📊 总人气榜 TOP 10</span></template>
          <div ref="overallChart" style="height: 420px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <span class="card-title">📈 分维度排行</span>
            <el-select v-model="curOption" size="small" style="width: 150px; float:right" @change="renderOptionChart">
              <el-option v-for="o in stat.options" :key="o.optionId" :label="o.name" :value="o.optionId" />
            </el-select>
          </template>
          <div ref="optionChart" style="height: 420px"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup name="VoteStatistics">
import * as echarts from "echarts"
import { getStatistics } from "@/api/vote/record"
import { listActivity } from "@/api/vote/activity"

const { proxy } = getCurrentInstance()

const activities = ref([])
const activityId = ref(undefined)
const stat = ref({})
const curOption = ref(undefined)

const overallChart = ref(null)
const optionChart = ref(null)
let overallIns = null
let optionIns = null

const statusOptions = [{ label: "未开始", value: "0" }, { label: "进行中", value: "1" }, { label: "已结束", value: "2" }]
const statusLabel = (v) => (statusOptions.find(o => o.value === v) || {}).label || "未知"
const statusType = (v) => (v === "1" ? "success" : v === "2" ? "info" : "warning")

const summaryCards = computed(() => {
  const s = stat.value.summary || {}
  return [
    { label: "参与人数", value: s.voterCount || 0, icon: "👥", bg: "linear-gradient(135deg,#667eea,#764ba2)" },
    { label: "总票数", value: s.totalBallots || 0, icon: "🗳️", bg: "linear-gradient(135deg,#f093fb,#f5576c)" },
    { label: "候选人数", value: s.candidateCount || 0, icon: "🧑", bg: "linear-gradient(135deg,#4facfe,#00f2fe)" },
    { label: "评选维度", value: s.optionCount || 0, icon: "🏷️", bg: "linear-gradient(135deg,#43e97b,#38f9d7)" }
  ]
})

function loadActivities() {
  return listActivity({ pageNum: 1, pageSize: 100 }).then(res => {
    activities.value = res.rows
    if (!activityId.value && res.rows[0]) activityId.value = res.rows[0].activityId
  })
}

function loadStat() {
  if (!activityId.value) return
  getStatistics(activityId.value).then(res => {
    stat.value = res.data
    if (stat.value.options && stat.value.options.length) {
      if (!stat.value.options.find(o => o.optionId === curOption.value)) {
        curOption.value = stat.value.options[0].optionId
      }
    }
    nextTick(() => { renderOverallChart(); renderOptionChart() })
  })
}

function renderOverallChart() {
  if (!overallChart.value) return
  if (!overallIns) overallIns = echarts.init(overallChart.value)
  const list = (stat.value.overall || []).slice(0, 10).reverse()
  overallIns.setOption({
    grid: { left: 80, right: 30, top: 20, bottom: 30 },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    xAxis: { type: "value", minInterval: 1 },
    yAxis: { type: "category", data: list.map(x => x.name) },
    series: [{
      type: "bar", data: list.map(x => x.votes), barWidth: "55%",
      itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: "#667eea" }, { offset: 1, color: "#f5576c" }]), borderRadius: [0, 6, 6, 0] },
      label: { show: true, position: "right" }
    }]
  })
}

function renderOptionChart() {
  if (!optionChart.value) return
  if (!optionIns) optionIns = echarts.init(optionChart.value)
  const opt = (stat.value.options || []).find(o => o.optionId === curOption.value)
  const list = ((opt && opt.ranking) || []).slice(0, 10).reverse()
  const color = (opt && opt.color) || "#6366f1"
  optionIns.setOption({
    grid: { left: 80, right: 30, top: 20, bottom: 30 },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    xAxis: { type: "value", minInterval: 1 },
    yAxis: { type: "category", data: list.map(x => x.name) },
    series: [{
      type: "bar", data: list.map(x => x.votes), barWidth: "55%",
      itemStyle: { color: color, borderRadius: [0, 6, 6, 0] },
      label: { show: true, position: "right" }
    }]
  })
}

function onResize() { overallIns && overallIns.resize(); optionIns && optionIns.resize() }
onMounted(() => { window.addEventListener("resize", onResize) })
onBeforeUnmount(() => { window.removeEventListener("resize", onResize); overallIns && overallIns.dispose(); optionIns && optionIns.dispose() })

loadActivities().then(loadStat)
</script>

<style scoped>
.mb12 { margin-bottom: 16px; }
.toolbar { display: flex; align-items: center; justify-content: space-between; }
.tb-label { font-weight: 600; }
.card-title { font-weight: 600; font-size: 15px; }
.stat-card { display: flex; align-items: center; border-radius: 12px; padding: 18px 20px; color: #fff; box-shadow: 0 6px 18px rgba(0,0,0,.08); }
.sc-icon { font-size: 38px; margin-right: 16px; }
.sc-num { font-size: 30px; font-weight: 700; line-height: 1.1; }
.sc-label { font-size: 13px; opacity: .9; margin-top: 4px; }
.champ-card { border: 2px solid #6366f1; border-radius: 12px; padding: 14px 8px; text-align: center; margin-bottom: 14px; transition: transform .2s; background:#fff; }
.champ-card:hover { transform: translateY(-4px); }
.champ-dim { font-weight: 600; margin-bottom: 8px; color:#333; }
.champ-emoji { font-size: 18px; margin-right: 4px; }
.champ-avatar { width: 52px; height: 52px; line-height: 52px; border-radius: 50%; margin: 0 auto 8px; color: #fff; font-weight: 700; font-size: 16px; }
.champ-name { font-weight: 600; font-size: 15px; }
.champ-votes { font-weight: 700; margin-top: 4px; }
.champ-empty { color: #bbb; padding: 18px 0; }
</style>
