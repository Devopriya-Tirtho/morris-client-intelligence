import { test } from "node:test";
import assert from "node:assert/strict";
import { seed } from "../data/seed";
import { analytics, portfolio, visibleData } from "./analytics";
import {
  archiveCategory,
  convertUpcoming,
  experienceInsights,
  forecastConfidence,
  hierarchyLabel,
  projectHealth,
  serviceArea,
  sortedCategories,
  utilizationBand,
} from "./experience";
import { validateData } from "./validation";
import { PortalService } from "../services/PortalService";
import { MemoryPortalRepository } from "../adapters/mock/MemoryPortalRepository";
test("category rename propagates by ID without altering assignments or totals", async () => {
  const service = new PortalService(new MemoryPortalRepository());
  const before = await service.fetchPortfolioData("admin");
  await service.editWorkspace("admin", (d) => ({
    ...d,
    categories: d.categories.map((c) =>
      c.id === "c4" ? { ...c, name: "People & Culture" } : c,
    ),
  }));
  const after = await service.fetchPortfolioData("admin");
  assert.deepEqual(after.projects, before.projects);
  assert.equal(portfolio(after).hours, portfolio(before).hours);
  assert.equal(
    after.categories.find((c) => c.id === after.projects[1].managed.categoryId)!
      .name,
    "People & Culture",
  );
});
test("archive requires reassignment and preserves raw time, totals and stable IDs", () => {
  assert.throws(() => archiveCategory(seed, "c4"), /destination/);
  const result = archiveCategory(seed, "c4", "c1");
  validateData(result);
  assert.equal(result.categories.find((c) => c.id === "c4")!.archived, true);
  assert.equal(result.projects[1].managed.categoryId, "c1");
  assert.deepEqual(
    result.entries.map((t) => t.external),
    seed.entries.map((t) => t.external),
  );
  assert.equal(portfolio(result).hours, 1054);
  assert.equal(
    result.entries.some((t) => t.managed.categoryId === "c4"),
    false,
  );
  result.categories.find((c) => c.id === "c4")!.archived = false;
  validateData(result);
  assert.equal(result.projects[1].managed.categoryId, "c1");
});
test("category default transfers on merge; invalid archival bypass is rejected", () => {
  const result = archiveCategory(seed, "c1", "c5");
  assert.equal(result.categories.filter((c) => c.isDefault).length, 1);
  assert.equal(result.categories.find((c) => c.id === "c5")!.isDefault, true);
  const invalid = structuredClone(seed);
  invalid.categories.find((c) => c.id === "c1")!.archived = true;
  assert.throws(() => validateData(invalid), /Reassign/);
  const duplicate = structuredClone(seed);
  duplicate.categories[0].name = duplicate.categories[1].name.toUpperCase();
  assert.throws(() => validateData(duplicate), /Duplicate/);
});
test("category order is deterministic and service-area effort reconciles", () => {
  const data = structuredClone(seed);
  data.categories[0].order = 99;
  assert.equal(sortedCategories(data.categories).at(-1)!.id, "c0");
  assert.equal(
    data.categories.reduce((s, c) => s + serviceArea(data, c.id).hours, 0),
    portfolio(data).hours,
  );
});
test("hierarchy labels distinguish umbrellas, children, standalone and uninitialized", () => {
  assert.equal(hierarchyLabel(seed, seed.projects[0]), "Umbrella project");
  assert.equal(hierarchyLabel(seed, seed.projects[1]), "Child work order");
  assert.equal(hierarchyLabel(seed, seed.projects[10]), "Standalone project");
  assert.equal(
    hierarchyLabel(seed, seed.projects[11]),
    "Upcoming · no work order",
  );
});
test("upcoming conversion preserves authored metadata and transitions status", async () => {
  const p = structuredClone(seed.projects[11]);
  p.managed.forecastOverride = { hours: 300, reason: "Scope planning" };
  const converted = convertUpcoming(p, " WO1600 ");
  assert.equal(converted.id, p.id);
  assert.equal(converted.external.workOrder, "WO1600");
  assert.equal(converted.managed.status, "On track");
  assert.deepEqual({ ...converted.managed, status: "Upcoming" }, p.managed);
  assert.deepEqual(converted.narrative, p.narrative);
  const service = new PortalService(new MemoryPortalRepository());
  await service.editWorkspace("admin", (d) => ({
    ...d,
    projects: d.projects.map((x) => (x.id === p.id ? converted : x)),
  }));
  assert.equal((await service.fetchProjectDetail(p.id)).project.id, p.id);
  assert.throws(() => convertUpcoming(seed.projects[0], "WO1601"));
});
test("utilization thresholds and health classification have explicit boundaries", () => {
  assert.equal(utilizationBand(84.99), "Within plan");
  assert.equal(utilizationBand(85), "Approaching cap");
  assert.equal(utilizationBand(100), "Approaching cap");
  assert.equal(utilizationBand(100.01), "Over cap");
  assert.equal(projectHealth(seed, seed.projects[7]), "At risk");
  assert.equal(projectHealth(seed, seed.projects[10]), "Complete");
  assert.equal(projectHealth(seed, seed.projects[11]), "Planned");
  assert.equal(projectHealth(seed, seed.projects[1]), "Watch");
  const data = structuredClone(seed);
  data.projects[0].managed.cap = 100;
  assert.equal(projectHealth(data, data.projects[0]), "At risk");
});
test("insight generation is deterministic, traceable and visibility-safe", () => {
  assert.deepEqual(experienceInsights(seed), experienceInsights(seed));
  assert.ok(experienceInsights(seed).every((i) => i.rule));
  const data = structuredClone(seed);
  data.projects[0].managed.visible = false;
  data.projects[7].narrative.published = false;
  const view = visibleData(data);
  const insights = experienceInsights(view);
  assert.ok(
    !insights.some((i) => ["p1", "p2", "p3", "p4"].includes(i.projectId || "")),
  );
  assert.ok(!insights.some((i) => i.body === data.projects[7].narrative.risk));
  assert.equal(portfolio(view).hours, 534);
});
test("hidden team members leave client directory without changing project effort", () => {
  const data = structuredClone(seed);
  data.people[0].clientVisible = false;
  const view = visibleData(data);
  assert.equal(
    view.people.some((p) => p.id === "person0"),
    false,
  );
  assert.equal(analytics(view, "p1").hours, 520);
});
test("forecast confidence uses descriptive evidence and does not invent probability", () => {
  assert.equal(
    forecastConfidence(seed.projects[11], 0).label,
    "Limited evidence",
  );
  assert.equal(
    forecastConfidence(seed.projects[10], 112).label,
    "Actual delivered",
  );
  assert.equal(forecastConfidence(seed.projects[0], 520).label, "Indicative");
});

test("presentation seed reconciles delivery windows, lifecycle and portfolio allocations", () => {
  const asOf = "2026-10-23";
  const data = visibleData(seed);
  const totals = portfolio(data);
  assert.equal(
    totals.hours,
    totals.monthly.reduce((sum, month) => sum + month.hours, 0),
  );
  assert.equal(
    totals.hours,
    totals.mix.reduce((sum, category) => sum + category.hours, 0),
  );
  assert.equal(
    totals.hours,
    totals.roots.reduce(
      (sum, project) => sum + analytics(data, project.id).hours,
      0,
    ),
  );
  for (const project of data.projects) {
    const m = project.managed;
    assert.ok(m.start <= m.end, project.id);
    assert.ok(project.narrative.updatedAt <= asOf, project.id);
    if (m.status === "Upcoming") {
      assert.ok(m.start > asOf, project.id);
      assert.equal(m.progress, 0);
      assert.equal(analytics(data, project.id).hours, 0);
    }
    if (m.status === "Completed") {
      assert.equal(m.progress, 100);
      assert.ok(m.milestones.every((item) => item.done));
      assert.ok(m.end <= asOf);
      assert.equal(analytics(data, project.id).remaining, 0);
    }
    for (const entry of data.entries.filter(
      (entry) => entry.managed.projectId === project.id,
    )) {
      assert.ok(
        entry.external.date >= m.start &&
          entry.external.date <= m.end &&
          entry.external.date <= asOf,
        entry.id,
      );
    }
  }
});
