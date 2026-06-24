<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="活动标题" prop="title">
        <el-input v-model="queryParams.title" placeholder="请输入活动标题" clearable style="width: 200px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="活动状态" clearable style="width: 160px">
          <el-option v-for="d in statusOptions" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['vote:activity:add']">新增活动</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['vote:activity:remove']">删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="activityList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" align="center" prop="activityId" width="80" />
      <el-table-column label="活动标题" align="center" prop="title" :show-overflow-tooltip="true" min-width="180" />
      <el-table-column label="每人票数" align="center" prop="votesPerPerson" width="90" />
      <el-table-column label="需填姓名" align="center" width="90">
        <template #default="scope">
          <el-tag :type="scope.row.requireName === '1' ? 'warning' : 'info'">{{ scope.row.requireName === '1' ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" width="120">
        <template #default="scope">
          <el-tag :type="statusType(scope.row.status)">{{ statusLabel(scope.row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="起止时间" align="center" width="320">
        <template #default="scope">
          <span>{{ parseTime(scope.row.startTime, '{y}-{m}-{d} {h}:{i}') }} ~ {{ parseTime(scope.row.endTime, '{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="320" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['vote:activity:edit']">修改</el-button>
          <el-button v-if="scope.row.status !== '1'" link type="success" icon="VideoPlay" @click="setStatus(scope.row, '1')" v-hasPermi="['vote:activity:edit']">开始</el-button>
          <el-button v-if="scope.row.status === '1'" link type="warning" icon="SwitchButton" @click="setStatus(scope.row, '2')" v-hasPermi="['vote:activity:edit']">结束</el-button>
          <el-button link type="info" icon="User" @click="goCandidate(scope.row)">候选人</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['vote:activity:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="640px" append-to-body>
      <el-form ref="activityRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="活动标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入活动标题" />
        </el-form-item>
        <el-form-item label="活动说明" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入活动说明" />
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="每人票数" prop="votesPerPerson">
              <el-input-number v-model="form.votesPerPerson" :min="1" :max="100" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="活动状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择">
                <el-option v-for="d in statusOptions" :key="d.value" :label="d.label" :value="d.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="需填姓名">
              <el-switch v-model="form.requireName" active-value="1" inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="同维度重复">
              <el-switch v-model="form.multiPerPair" active-value="1" inactive-value="0" />
              <el-tooltip content="开启后，同一候选人的同一维度可被同一人投多票" placement="top">
                <el-icon style="margin-left:6px;color:#999"><QuestionFilled /></el-icon>
              </el-tooltip>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="起止时间">
          <el-date-picker v-model="dateRange" type="datetimerange" range-separator="至" start-placeholder="开始时间" end-placeholder="结束时间" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="VoteActivity">
import { listActivity, getActivity, delActivity, addActivity, updateActivity, changeActivityStatus } from "@/api/vote/activity"

const { proxy } = getCurrentInstance()
const router = useRouter()

const statusOptions = [
  { label: "未开始", value: "0" },
  { label: "进行中", value: "1" },
  { label: "已结束", value: "2" }
]
const statusLabel = (v) => (statusOptions.find(o => o.value === v) || {}).label || "未知"
const statusType = (v) => (v === "1" ? "success" : v === "2" ? "info" : "warning")

const activityList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const multiple = ref(true)
const total = ref(0)
const title = ref("")
const dateRange = ref([])

const data = reactive({
  form: {},
  queryParams: { pageNum: 1, pageSize: 10, title: undefined, status: undefined },
  rules: {
    title: [{ required: true, message: "活动标题不能为空", trigger: "blur" }],
    votesPerPerson: [{ required: true, message: "请填写每人票数", trigger: "blur" }]
  }
})
const { queryParams, form, rules } = toRefs(data)

function getList() {
  loading.value = true
  listActivity(queryParams.value).then(res => {
    activityList.value = res.rows
    total.value = res.total
    loading.value = false
  })
}
function cancel() { open.value = false; reset() }
function reset() {
  form.value = { activityId: undefined, title: undefined, description: undefined, votesPerPerson: 8, requireName: "1", multiPerPair: "0", status: "0" }
  dateRange.value = []
  proxy.resetForm("activityRef")
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm("queryRef"); handleQuery() }
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.activityId)
  multiple.value = !selection.length
}
function handleAdd() { reset(); open.value = true; title.value = "新增投票活动" }
function handleUpdate(row) {
  reset()
  getActivity(row.activityId || ids.value[0]).then(res => {
    form.value = res.data
    dateRange.value = [res.data.startTime, res.data.endTime]
    open.value = true
    title.value = "修改投票活动"
  })
}
function submitForm() {
  proxy.$refs["activityRef"].validate(valid => {
    if (!valid) return
    form.value.startTime = dateRange.value && dateRange.value[0] ? dateRange.value[0] : null
    form.value.endTime = dateRange.value && dateRange.value[1] ? dateRange.value[1] : null
    const action = form.value.activityId != undefined ? updateActivity : addActivity
    action(form.value).then(() => {
      proxy.$modal.msgSuccess(form.value.activityId != undefined ? "修改成功" : "新增成功")
      open.value = false
      getList()
    })
  })
}
function setStatus(row, status) {
  const text = status === "1" ? "开始" : "结束"
  proxy.$modal.confirm(`确认${text}活动「${row.title}」吗？`).then(() => changeActivityStatus(row.activityId, status))
    .then(() => { proxy.$modal.msgSuccess(text + "成功"); getList() }).catch(() => {})
}
function handleDelete(row) {
  const _ids = row.activityId || ids.value
  proxy.$modal.confirm('是否确认删除活动编号为"' + _ids + '"的数据项？').then(() => delActivity(_ids))
    .then(() => { getList(); proxy.$modal.msgSuccess("删除成功") }).catch(() => {})
}
function goCandidate(row) {
  router.push({ path: "/vote/candidate", query: { activityId: row.activityId } })
}

getList()
</script>
