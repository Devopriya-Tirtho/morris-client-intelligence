import { useEffect, useState } from "react";
import {
  HashRouter,
  Routes,
  Route,
  NavLink,
  Link,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  LayoutDashboard,
  Layers3,
  FolderKanban,
  Shapes,
  CalendarRange,
  UsersRound,
  ContactRound,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  Presentation as PresentationIcon,
  GitPullRequest,
  Eye,
  Compass,
  RotateCcw,
  ArrowUpRight,
} from "lucide-react";
import { PortalProvider, usePortal } from "./services/PortalContext";
import { Overview } from "./pages/Overview";
import { Projects } from "./pages/Projects";
import { ProjectDetail, NewProject } from "./pages/ProjectDetail";
import { Forecast, TimeReview, ContentControls } from "./pages/Intelligence";
import { InsightsStudio } from "./pages/InsightsStudio";
import { ServiceAreas } from "./pages/ServiceAreas";
import { TeamDirectory } from "./pages/TeamDirectory";
import { Presentation } from "./pages/Presentation";
import { Partnership } from "./components/Experience";
import { Pacing, TeamAllocation } from "./components/PortfolioVisuals";
import { useDialogAccessibility } from "./hooks/useDialogAccessibility";
import type { Role } from "./domain/types";
const nav = [
  {
    path: "/",
    label: "Executive overview",
    admin: "Control centre",
    icon: LayoutDashboard,
  },
  { path: "/portfolio", label: "Contract portfolio", icon: Layers3 },
  {
    path: "/projects",
    label: "Projects",
    admin: "Project registry",
    icon: FolderKanban,
  },
  {
    path: "/categories",
    label: "Service areas",
    admin: "Category manager",
    icon: Shapes,
  },
  { path: "/forecast", label: "Forecast & timeline", icon: CalendarRange },
  {
    path: "/team",
    label: "Your Morris team",
    admin: "Team & identities",
    icon: UsersRound,
  },
  { path: "/contacts", label: "Contact & ownership", icon: ContactRound },
  {
    path: "/insights",
    label: "Insight briefs",
    admin: "Insights studio",
    icon: NotebookPen,
  },
];
function Internal({ children }: { children: React.ReactNode }) {
  const { role } = usePortal();
  return role === "admin" ? children : <Navigate to="/" replace />;
}
function Landing() {
  const { setRole } = usePortal();
  const navigate = useNavigate();
  const enter = (r: Role) => {
    setRole(r);
    navigate("/");
  };
  return (
    <div className="welcome-experience">
      <Partnership />
      <div>
        <span className="eyebrow">A PARTNERSHIP WITH PURPOSE</span>
        <h1>
          Clarity for today.
          <br />
          <em>Confidence for tomorrow.</em>
        </h1>
        <p>
          Your shared view of the work, people and progress supporting Zagimē
          Anishinabēk.
        </p>
        <div className="landing-roles">
          <button onClick={() => enter("client")}>
            <Eye />
            <strong>Client experience</strong>
            <span>Progress, priorities and value</span>
            <ArrowUpRight />
          </button>
          <button onClick={() => enter("admin")}>
            <FolderKanban />
            <strong>Morris internal workspace</strong>
            <span>Records, allocation and content</span>
            <ArrowUpRight />
          </button>
        </div>
      </div>
      <small>
        DEMONSTRATION ENVIRONMENT · SYNTHETIC DATA · NO SIGN-IN REQUIRED
      </small>
    </div>
  );
}
function Shell() {
  useDialogAccessibility();
  const { role, setRole, reset } = usePortal();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  if (location.pathname.startsWith("/presentation"))
    return (
      <Routes>
        <Route path="/presentation/:chapter?" element={<Presentation />} />
      </Routes>
    );
  if (location.pathname === "/welcome") return <Landing />;
  const label =
    nav.find((n) => n.path === location.pathname)?.label ||
    (
      {
        "/pipeline": "Upcoming pipeline",
        "/time": "Time allocation",
        "/content": "Client content controls",
      } as Record<string, string>
    )[location.pathname] ||
    "Project detail";
  return (
    <div
      className={`app premium-app ${collapsed ? "collapsed" : ""} ${role === "admin" ? "admin-mode" : "client-mode"}`}
    >
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Skip to content
      </a>
      <aside className="sidebar">
        <Link className="client-brand" to="/welcome">
          <strong>Zagimē</strong>
          <span>Anishinabēk</span>
          <small>CLIENT INTELLIGENCE</small>
        </Link>
        <div className="workspace-label">
          {role === "admin" ? "MORRIS INTERNAL" : "YOUR PARTNERSHIP"}
        </div>
        <nav aria-label="Main navigation">
          {nav.map((n) => (
            <NavLink
              key={n.path}
              to={n.path}
              end={n.path === "/"}
              title={role === "admin" && n.admin ? n.admin : n.label}
            >
              <n.icon size={18} />
              <span>{role === "admin" && n.admin ? n.admin : n.label}</span>
            </NavLink>
          ))}
          {role === "admin" && (
            <>
              <div className="nav-label">OPERATIONS</div>
              <NavLink to="/time" title="Time allocation">
                <GitPullRequest size={18} />
                <span>Time allocation</span>
              </NavLink>
              <NavLink to="/pipeline" title="Upcoming pipeline">
                <Compass size={18} />
                <span>Upcoming pipeline</span>
              </NavLink>
              <NavLink to="/content" title="Client content controls">
                <Eye size={18} />
                <span>Client content controls</span>
              </NavLink>
            </>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="delivery-partner">
            <small>DELIVERY PARTNER</small>
            <strong>Morris Interactive</strong>
          </div>
          <button
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
            <span>{collapsed ? "Expand" : "Collapse"} navigation</span>
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="top-context">
            <strong>Zagimē Anishinabēk</strong>
            <span>
              {role === "admin"
                ? "Morris operations workspace"
                : "Partnership intelligence"}
            </span>
          </div>
          <div className="top-actions">
            <button
              className="presentation-button"
              onClick={() => navigate("/presentation/1")}
            >
              <PresentationIcon size={17} />
              <span>Present partnership</span>
            </button>
            <label className="role-switch">
              <span className="sr-only">Prototype role</span>
              <select
                aria-label="Prototype role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                <option value="client">Zagimē client view</option>
                <option value="admin">Morris internal</option>
              </select>
            </label>
          </div>
        </header>
        <div className="environment-strip">
          <span>DEMONSTRATION ENVIRONMENT · SYNTHETIC DATA</span>
          <span>
            {role === "admin"
              ? "INTERNAL CONTROLS"
              : "READ-ONLY CLIENT EXPERIENCE"}
          </span>
        </div>
        <main id="main-content" tabIndex={-1}>
          <div className="page-breadcrumb">
            <Link to="/">Partnership</Link>
            <span>/</span>
            <span>{label}</span>
          </div>
          <motion.div
            key={location.pathname}
            initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/portfolio" element={<Projects portfolioView />} />
              <Route path="/projects" element={<Projects />} />
              <Route
                path="/projects/new"
                element={
                  <Internal>
                    <NewProject />
                  </Internal>
                }
              />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/categories" element={<ServiceAreas />} />
              <Route
                path="/forecast"
                element={
                  <>
                    <Forecast />
                    <div className="executive-columns">
                      <Pacing />
                      <TeamAllocation />
                    </div>
                  </>
                }
              />
              <Route path="/team" element={<TeamDirectory />} />
              <Route path="/contacts" element={<TeamDirectory contacts />} />
              <Route path="/insights" element={<InsightsStudio />} />
              <Route
                path="/time"
                element={
                  <Internal>
                    <TimeReview />
                  </Internal>
                }
              />
              <Route
                path="/pipeline"
                element={
                  <Internal>
                    <Projects pipeline />
                  </Internal>
                }
              />
              <Route
                path="/content"
                element={
                  <Internal>
                    <ContentControls />
                  </Internal>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </motion.div>
          <footer className="app-footer">
            <span>
              Fictional people, contact details and project data · As of October
              23, 2026
            </span>
            <span>Zagimē Anishinabēk × Morris Interactive</span>
            {role === "admin" && (
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      "Restore the original synthetic demo? This replaces this browser’s edits.",
                    )
                  )
                    reset();
                }}
              >
                <RotateCcw size={13} />
                Reset demo
              </button>
            )}
          </footer>
        </main>
      </div>
    </div>
  );
}
export default function App() {
  return (
    <HashRouter>
      <PortalProvider>
        <Shell />
      </PortalProvider>
    </HashRouter>
  );
}
