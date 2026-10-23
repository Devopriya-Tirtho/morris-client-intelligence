import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { PortalContext } from "./PortalContext";
import { seed } from "../data/seed";
import { visibleData } from "../domain/analytics";
import type { PortalData, Role } from "../domain/types";
import { Overview } from "../pages/Overview";
import { Projects } from "../pages/Projects";
import { ProjectDetail } from "../pages/ProjectDetail";
import { ServiceAreas } from "../pages/ServiceAreas";
import { TeamDirectory } from "../pages/TeamDirectory";
import { InsightsStudio } from "../pages/InsightsStudio";
import { Presentation, chapters } from "../pages/Presentation";
import { TimeReview, Forecast, ContentControls } from "../pages/Intelligence";
function render(
  component: ReturnType<typeof createElement>,
  role: Role = "client",
  data: PortalData = seed,
  path = "/",
) {
  const projected = role === "client" ? visibleData(data) : data;
  return renderToStaticMarkup(
    createElement(
      PortalContext.Provider,
      {
        value: {
          data: projected,
          role,
          setRole: () => {},
          update: async () => true,
          reset: () => {},
          notify: () => {},
        },
      },
      createElement(MemoryRouter, { initialEntries: [path] }, component),
    ),
  );
}
test("client and admin overviews have distinct compositions", () => {
  const client = render(createElement(Overview));
  assert.match(client, /Shared priorities/);
  assert.doesNotMatch(client, /UNALLOCATED HOURS/);
  const admin = render(createElement(Overview), "admin");
  assert.match(admin, /UNALLOCATED HOURS/);
  assert.match(admin, /Portfolio control centre/);
  assert.doesNotMatch(admin, /Shared priorities/);
});
test("all primary views render empty and hidden-team client states", () => {
  const data = structuredClone(seed);
  data.people.forEach((p) => (p.clientVisible = false));
  for (const element of [
    createElement(Overview),
    createElement(Projects),
    createElement(ServiceAreas),
    createElement(TeamDirectory),
    createElement(InsightsStudio),
    createElement(Forecast),
  ])
    assert.ok(render(element, "client", data).length > 0);
  const detail = createElement(
    Routes,
    null,
    createElement(Route, {
      path: "/projects/:id",
      element: createElement(ProjectDetail),
    }),
  );
  assert.match(
    render(detail, "client", data, "/projects/p1"),
    /Contact not shared/,
  );
  data.projects.forEach((p) => (p.managed.visible = false));
  for (const element of [
    createElement(Overview),
    createElement(Projects),
    createElement(ServiceAreas),
    createElement(TeamDirectory),
    createElement(InsightsStudio),
    createElement(Forecast),
  ])
    assert.ok(render(element, "client", data).length > 0);
});
test("internal views expose source and ownership controls", () => {
  assert.match(
    render(createElement(TimeReview), "admin"),
    /RAW SOURCE ASSIGNMENT/,
  );
  assert.match(
    render(createElement(TimeReview), "admin"),
    /MORRIS REPORTING ALLOCATION/,
  );
  assert.match(
    render(createElement(ServiceAreas), "admin"),
    /Archive \/ merge/,
  );
  assert.match(
    render(createElement(ContentControls), "admin"),
    /Client visibility/,
  );
});
test("each presentation chapter renders the shared client snapshot", () => {
  const routes = createElement(
    Routes,
    null,
    createElement(Route, {
      path: "/presentation/:chapter",
      element: createElement(Presentation),
    }),
  );
  for (let i = 1; i <= 10; i++) {
    const html = render(routes, "client", seed, `/presentation/${i}`);
    assert.ok(html.includes(chapters[i - 1].replace("&", "&amp;")));
    assert.match(html, /DEMONSTRATION ENVIRONMENT/);
    assert.doesNotMatch(html, /Edit project|Morris Internal|Save changes/);
    assert.match(html, /Start over/);
    assert.match(html, /Exit presentation/);
    if (i === 1) assert.match(html, /out of 100/);
    if (i === 6) {
      for (const upcoming of seed.projects.filter(
        (p) => p.managed.status === "Upcoming",
      )) {
        assert.ok(!html.includes(upcoming.narrative.value));
      }
    }
    if (i === 10) {
      assert.match(html, /Finish review/);
      assert.doesNotMatch(html, /disabled=""/);
    }
  }
});
