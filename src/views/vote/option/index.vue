<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="所属活动" prop="activityId">
        <el-select v-model="queryParams.activityId" placeholder="请选择活动" style="width: 240px" @change="handleQuery">
          <el-option v-for="a in activities" :key="a.activityId" :label="a.title" :value="a.activityId" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['vote:option:add']">新增维度</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['vote:option:remove']">删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="optionList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="维度" align="center" min-width="160">
        <template #default="scope">
          <span style="font-size:18px;margin-right:6px">{{ scope.row.icon }}</span>
          <span :style="{ color: scope.row.color, fontWeight: 600 }">{{ scope.row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="图标" align="center" prop="icon" width="100" />
      <el-table-column label="主题色" align="center" width="120">
        <template #default="scope">
          <span class="color-dot" :style="{ background: scope.row.color }"></span>
          <span>{{ scope.row.color }}</span>
        </template>
      </el-table-column>
      <el-table-column label="排序" align="center" prop="sort" width="80" />
      <el-table-column label="状态" align="center" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.status === '0' ? 'success' : 'info'">{{ scope.row.status === '0' ? '正常' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="160" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['vote:option:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['vote:option:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="480px" append-to-body>
      <el-form ref="optionRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="维度名称" prop="name">
          <el-input v-model="form.name" placeholder="如 最帅 / 最美 / 幽默" />
        </el-form-item>
        <el-form-item label="图标(emoji)" prop="icon">
          <el-input v-model="form.icon" placeholder="如 😎" maxlength="4" style="width:120px" />
          <span style="margin-left:10px;font-size:22px">{{ form.icon }}</span>
        </el-form-item>
        <el-form-item label="主题色" prop="color">
          <el-color-picker v-model="form.color" />
          <el-input v-model="form.color" placeholder="#3b82f6" style="width:140px;margin-left:10px" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" controls-position="right" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio value="0">正常</el-radio>
            <el-radio value="1">停用</el-radio>
          </el-radio-group>
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

<script setup name="VoteOption">
import { listOption, getOption, delOption, addOption, updateOption } from "@/api/vote/option"
import { listActivity } from "@/api/vote/activity"

const { proxy } = getCurrentInstance()
const route = useRoute()

const optionList = ref([])
const activities = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const multiple = ref(true)
const total = ref(0)
const title = ref("")

const data = reactive({
  form: {},
  queryParams: { pageNum: 1, pageSize: 50, activityId: undefined },
  rules: {
    name: [{ required: true, message: "维度名称不能为空", trigger: "blur" }]
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
  if (!queryParams.value.activityId) { optionList.value = []; total.value = 0; loading.value = false; return }
  loading.value = true
  listOption(queryParams.value).then(res => { optionList.value = res.rows; total.value = res.total; loading.value = false })
}
function cancel() { open.value = false; reset() }
function reset() {
  form.value = { optionId: undefined, activityId: queryParams.value.activityId, name: undefined, icon: "⭐", color: "#3b82f6", sort: 0, status: "0" }
  proxy.resetForm("optionRef")
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { const keep = queryParams.value.activityId; proxy.resetForm("queryRef"); queryParams.value.activityId = keep; handleQuery() }
function handleSelectionChange(selection) { ids.value = selection.map(i => i.optionId); multiple.value = !selection.length }
function handleAdd() {
  if (!queryParams.value.activityId) { proxy.$modal.msgWarning("请先选择活动"); return }
  reset(); open.value = true; title.value = "新增评选维度"
}
function handleUpdate(row) {
  reset()
  getOption(row.optionId || ids.value[0]).then(res => { form.value = res.data; open.value = true; title.value = "修改评选维度" })
}
function submitForm() {
  proxy.$refs["optionRef"].validate(valid => {
    if (!valid) return
    form.value.activityId = queryParams.value.activityId
    const action = form.value.optionId != undefined ? updateOption : addOption
    action(form.value).then(() => {
      proxy.$modal.msgSuccess(form.value.optionId != undefined ? "修改成功" : "新增成功")
      open.value = false; getList()
    })
  })
}
function handleDelete(row) {
  const _ids = row.optionId || ids.value
  proxy.$modal.confirm('是否确认删除所选维度？').then(() => delOption(_ids))
    .then(() => { getList(); proxy.$modal.msgSuccess("删除成功") }).catch(() => {})
}

loadActivities().then(getList)
</script>

<style scoped>
.color-dot { display:inline-block; width:12px; height:12px; border-radius:50%; margin-right:6px; vertical-align:middle; }
</style>
