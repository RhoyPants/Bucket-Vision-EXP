const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function loadTs(relativePath, imports = {}) {
  const source = fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, process: { env: {} }, URL, FormData, File, Blob, setTimeout, document: { createElement: () => ({ click() {} }) }, require: (name) => { assert.ok(name in imports, `Unexpected dependency: ${name}`); return imports[name]; } });
  return exports;
}
const plain = (value) => JSON.parse(JSON.stringify(value));
const urls = loadTs("app/lib/apiUrl.ts");
const requests = [];
const transport = {};
for (const method of ["get", "post", "put", "patch", "delete"]) transport[method] = async (...args) => { requests.push({ method, args }); return { data: { success: true, data: { id: "saved" } } }; };
const service = loadTs("app/api-service/incidentManagementService.ts", { "@/app/lib/axios": transport, "@/app/lib/apiUrl": urls });
const workflowLevel = (extra = {}) => ({ order: 1, assignmentType: "REQUESTER_BU_HEAD", completionRule: "ANY_ONE", slaValue: 3, slaUnit: "DAYS", isFinal: false, ...extra });
const notificationLevel = (extra = {}) => ({ order: 1, assignmentType: "ROLE", roleId: "role-op", notifyAfterValue: 0, notifyAfterUnit: "DAYS", ...extra });

test("all new maintenance URLs include exactly one /api segment", async () => {
  await service.incidentWorkflowService.list();
  assert.equal(requests.at(-1).args[0], "http://localhost:4000/api/admin/incident-workflows");
  await service.notificationMatrixService.list();
  assert.equal(requests.at(-1).args[0], "http://localhost:4000/api/admin/escalation-notification-matrices");
  assert.equal(urls.joinApiUrl("/api/admin/incident-types", "https://vision.example/api/"), "https://vision.example/api/admin/incident-types");
});

test("workflow serialization preserves IDs and requires an SLA on the final level", () => {
  const output = plain(service.serializeWorkflowLevels([
    workflowLevel({ id: "finance", order: 3, assignmentType: "ROLE", roleId: "role-finance", userId: "stale", responsiblePartyLabel: "Finance", slaValue: 7, isFinal: true }),
    workflowLevel({ id: "buh", order: 1 }),
  ]));
  assert.deepEqual(output, [
    { id: "finance", order: 1, assignmentType: "ROLE", roleId: "role-finance", completionRule: "ANY_ONE", slaValue: 7, slaUnit: "DAYS", isFinal: false },
    { id: "buh", order: 2, assignmentType: "REQUESTER_BU_HEAD", completionRule: "ANY_ONE", slaValue: 3, slaUnit: "DAYS", isFinal: true },
  ]);
  assert.deepEqual(plain(service.validateWorkflow({ name: "Workflow", levels: [workflowLevel({ isFinal: true })] })), {});
  assert.ok(service.validateWorkflow({ name: "Workflow", levels: [workflowLevel({ slaValue: null, slaUnit: null, isFinal: true })] })["levels[0].slaValue"]);
});

test("working-day SLAs reject fractional days while elapsed-hour SLAs accept decimals", () => {
  const validate = (value, unit) => service.validateWorkflow({ name: "Workflow", levels: [workflowLevel({ slaValue: value, slaUnit: unit, isFinal: true })] });
  for (const value of [0, -1, 36501, NaN, Infinity, 1.5]) assert.ok(validate(value, "DAYS")["levels[0].slaValue"]);
  assert.deepEqual(plain(validate(36500, "DAYS")), {});
  assert.deepEqual(plain(validate(0.5, "HOURS")), {});
});

test("notification timing allows zero or positive delays at every level", () => {
  assert.deepEqual(plain(service.validateNotificationMatrix({ name: "Executive", levels: [notificationLevel({ notifyAfterValue: 3 })] })), {});
  assert.deepEqual(plain(service.validateNotificationMatrix({ name: "Executive", levels: [notificationLevel(), notificationLevel({ notifyAfterValue: 0 })] })), {});
  assert.ok(service.validateNotificationMatrix({ name: "Executive", levels: [notificationLevel({ notifyAfterValue: -1 })] })["levels[0].notifyAfterValue"]);
  const serialized = plain(service.serializeNotificationLevels([notificationLevel({ id: "op", notifyAfterValue: 3 }), notificationLevel({ id: "ceo", notifyAfterValue: 7 })]));
  assert.equal(serialized[0].notifyAfterValue, 3);
  assert.equal("isFinal" in serialized[0], false);
});

test("configuration validation checks recipients and required names", () => {
  assert.ok(service.validateWorkflow({ name: " ", levels: [] }).name);
  for (const [assignmentType, field] of [["ROLE", "roleId"], ["SPECIFIC_USER", "userId"]]) {
    assert.ok(service.validateNotificationMatrix({ name: "Matrix", levels: [notificationLevel({ assignmentType, roleId: undefined })] })[`levels[0].${field}`]);
  }
});

test("dropdown helper collects every page", async () => {
  const calls = [];
  const items = await service.allPages(async (page) => { calls.push(page); return { data: [{ id: `item-${page}` }], pagination: { totalPages: 3 } }; });
  assert.deepEqual(calls, [1, 2, 3]);
  assert.deepEqual(plain(items), [{ id: "item-1" }, { id: "item-2" }, { id: "item-3" }]);
});

test("workflow updates send a version precondition", async () => {
  await service.incidentWorkflowService.update("workflow-1", { version: 7, isActive: false });
  const request = requests.at(-1);
  assert.equal(request.args[0], "http://localhost:4000/api/admin/incident-workflows/workflow-1");
  assert.deepEqual(plain(request.args[1]), { version: 7, isActive: false });
  assert.equal(request.args[2].preserveApiError, true);
});

test("Incident Type creation links workflow, overall SLA, and notification matrix", async () => {
  const payload = {
    name: "Theft", description: "Missing assets", defaultCriticality: "HIGH",
    incidentWorkflowId: "workflow-theft", resolutionSlaValue: 15,
    resolutionSlaUnit: "DAYS", notificationMatrixId: "notification-executive", isActive: true,
  };
  await service.incidentTypeService.create(payload);
  const request = requests.at(-1);
  assert.equal(request.args[0], "http://localhost:4000/api/admin/incident-types");
  assert.deepEqual(plain(request.args[1]), payload);
  assert.equal("escalationMatrixId" in request.args[1], false);
});

test("notification matrix creation uses delay fields and carries no completion authority", async () => {
  const payload = { name: "Executive", description: "OP to CEO", isActive: true, levels: service.serializeNotificationLevels([notificationLevel({ id: undefined }), notificationLevel({ assignmentType: "SPECIFIC_USER", roleId: undefined, userId: "user-ceo", notifyAfterValue: 7 })]) };
  await service.notificationMatrixService.create(payload);
  const sent = plain(requests.at(-1).args[1]);
  assert.equal(sent.levels[0].notifyAfterValue, 0);
  assert.equal(sent.levels[1].userId, "user-ceo");
  assert.equal("isFinal" in sent.levels[1], false);
  assert.equal("completionRule" in sent.levels[0], false);
});

test("new incidents complete workflow levels while legacy incidents retain resolve", async () => {
  const incidents = loadTs("app/api-service/incidentService.ts", { "@/app/lib/axios": transport, "./incidentManagementService": service }).incidentService;
  await incidents.completeWorkflowLevel("incident-1", { activeLevelId: "runtime-level-2", remarks: "HR review completed" });
  assert.equal(requests.at(-1).args[0], "http://localhost:4000/api/incidents/incident-1/workflow/complete-level");
  assert.deepEqual(plain(requests.at(-1).args[1]), { activeLevelId: "runtime-level-2", remarks: "HR review completed" });
  await incidents.resolve("legacy-1", { activeLevelId: "legacy-level", remarks: "Closed" });
  assert.equal(requests.at(-1).args[0], "http://localhost:4000/api/incidents/legacy-1/resolve");
});

test("incident creation leaves workflow selection to the Incident Type", async () => {
  const incidents = loadTs("app/api-service/incidentService.ts", { "@/app/lib/axios": transport, "./incidentManagementService": service }).incidentService;
  await incidents.create({ projectId: "project-1", incidentTypeId: "type-1", title: "Theft", description: "Missing equipment", occurredAt: "2026-09-10T01:00:00.000Z", location: "Warehouse A" }, [new File(["evidence"], "evidence.txt")]);
  const form = requests.at(-1).args[1];
  assert.equal(form.get("incidentTypeId"), "type-1");
  assert.equal(form.get("incidentWorkflowId"), null);
  assert.equal(form.get("notificationMatrixId"), null);
  assert.equal(requests.at(-1).args[2].headers["Content-Type"], undefined);
});

test("Manila incident input converts to UTC and round-trips", () => {
  const dates = loadTs("app/utils/incidentCase.ts");
  assert.equal(dates.manilaTimestamp("2026-09-10T09:00"), "2026-09-10T01:00:00.000Z");
  assert.equal(dates.manilaInput("2026-09-10T01:00:00.000Z"), "2026-09-10T09:00");
});
