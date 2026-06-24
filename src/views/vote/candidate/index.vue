<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="所属活动" prop="activityId">
        <el-select v-model="queryParams.activityId" placeholder="请选择活动" style="width: 240px" @change="handleQuery">
          <el-option v-for="a in activities" :key="a.activityId" :label="a.title" :value="a.activityId" />
        </el-select>
      </el-form-item>
      <el-form-item label="姓名" prop="name">
        <el-input v-model="queryParams.name" placeholder="请输入候选人姓名" clearable style="width: 180px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['vote:candidate:add']">新增候选人</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="DocumentAdd" @click="openBatch" v-hasPermi="['vote:candidate:add']">批量添加</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['vote:candidate:remove']">删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="candidateList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" align="center" prop="no" width="80" />
      <el-table-column label="姓名" align="center" prop="name" width="140" />
      <el-table-column label="简介/宣言" align="center" prop="description" :show-overflow-tooltip="true" min-width="220" />
      <el-table-column label="排序" align="center" prop="sort" width="80" />
      <el-table-column label="状态" align="center" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.status === '0' ? 'success' : 'info'">{{ scope.row.status === '0' ? '正常' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="160" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['vote:candidate:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['vote:candidate:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 新增/修改 -->
    <el-dialog :title="title" v-model="open" width="540px" append-to-body>
      <el-form ref="candidateRef" :model="form" :rules="rules" label-width="90px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="form.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="编号" prop="no">
              <el-input v-model="form.no" placeholder="如 01" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="简介/宣言" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="请输入简介或参选宣言" />
        </el-form-item>
        <el-form-item label="头像URL" prop="avatar">
          <el-input v-model="form.avatar" placeholder="可选，留空则用文字头像" />
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="form.sort" :min="0" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-radio-group v-model="form.status">
                <el-radio value="0">正常</el-radio>
                <el-radio value="1">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 批量添加 -->
    <el-dialog title="批量添加候选人" v-model="batchOpen" width="520px" append-to-body>
      <el-alert type="info" :closable="false" title="每行一个姓名，编号将自动生成（01、02……）" style="margin-bottom:12px" />
      <el-input v-model="batchText" type="textarea" :rows="10" placeholder="张三&#10;李四&#10;王五" />
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitBatch" :loading="batchLoading">确 定</el-button>
          <el-button @click="batchOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="VoteCandidate">
import { listCandidate, getCandidate, delCandidate, addCandidate, updateCandidate } from "@/api/vote/candidate"
import { listActivity } from "@/api/vote/activity"

const { proxy } = getCurrentInstance()
const route = useRoute()

const candidateList = ref([])
const activities = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const multiple = ref(true)
const total = ref(0)
const title = ref("")

const batchOpen = ref(false)
const batchText = ref("")
const batchLoading = ref(false)

const data = reactive({
  form: {},
  queryParams: { pageNum: 1, pageSize: 10, activityId: undefined, name: undefined },
  rules: {
    name: [{ required: true, message: "姓名不能为空", trigger: "blur" }]
  }
})
const { queryParams, form, rules } = toRefs(data)

function loadActivities() {
  return listActivity({ pageNum: 1, pageSize: 100 }).then(res => {
    activities.value = res.rows
    if (!queryParams.value.activityId) {
      const fromQuery = route.query.activityId ? Number(route.query.activityId) : undefined
      queryParams.value.activityId = fromQuery || (res.rows[0] && res.rows[0].activityId)
    }
  })
}
function getList() {
  if (!queryParams.value.activityId) { candidateList.value = []; total.value = 0; loading.value = false; return }
  loading.value = true
  listCandidate(queryParams.value).then(res => {
    candidateList.value = res.rows
    total.value = res.total
    loading.value = false
  })
}
function cancel() { open.value = false; reset() }
function reset() {
  form.value = { candidateId: undefined, activityId: queryParams.value.activityId, name: undefined, no: undefined, avatar: undefined, description: undefined, sort: 0, status: "0" }
  proxy.resetForm("candidateRef")
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { const keepAct = queryParams.value.activityId; proxy.resetForm("queryRef"); queryParams.value.activityId = keepAct; handleQuery() }
function handleSelectionChange(selection) { ids.value = selection.map(i => i.candidateId); multiple.value = !selection.length }
function handleAdd() {
  if (!queryParams.value.activityId) { proxy.$modal.msgWarning("请先选择活动"); return }
  reset(); open.value = true; title.value = "新增候选人"
}
function handleUpdate(row) {
  reset()
  getCandidate(row.candidateId || ids.value[0]).then(res => { form.value = res.data; open.value = true; title.value = "修改候选人" })
}
function submitForm() {
  proxy.$refs["candidateRef"].validate(valid => {
    if (!valid) return
    form.value.activityId = queryParams.value.activityId
    const action = form.value.candidateId != undefined ? updateCandidate : addCandidate
    action(form.value).then(() => {
      proxy.$modal.msgSuccess(form.value.candidateId != undefined ? "修改成功" : "新增成功")
      open.value = false; getList()
    })
  })
}
function handleDelete(row) {
  const _ids = row.candidateId || ids.value
  proxy.$modal.confirm('是否确认删除所选候选人？').then(() => delCandidate(_ids))
    .then(() => { getList(); proxy.$modal.msgSuccess("删除成功") }).catch(() => {})
}
function openBatch() {
  if (!queryParams.value.activityId) { proxy.$modal.msgWarning("请先选择活动"); return }
  batchText.value = ""; batchOpen.value = true
}
async function submitBatch() {
  const names = batchText.value.split("\n").map(s => s.trim()).filter(Boolean)
  if (!names.length) { proxy.$modal.msgWarning("请输入至少一个姓名"); return }
  batchLoading.value = true
  try {
    const base = total.value
    for (let i = 0; i < names.length; i++) {
      const idx = base + i + 1
      await addCandidate({ activityId: queryParams.value.activityId, name: names[i], no: String(idx).padStart(2, "0"), sort: idx, status: "0" })
    }
    proxy.$modal.msgSuccess(`成功添加 ${names.length} 位候选人`)
    batchOpen.value = false; getList()
  } finally {
    batchLoading.value = false
  }
}

loadActivities().then(getList)
</script>
