import Cohorts from "../Data/Cohorts";
import Tracks from "../Data/Tracks";
import WorkingSector from "../Data/WorkingSector";
import NotificationSetup from "../Data/NotificationSetup";
import { OnlyAdmin } from "../Other/AccessDashboard";

const sections = [
  {
    id: "notification-setup",
    title: "Notification templates",
    description: "Edit the message and actions used for automated notifications.",
    content: <NotificationSetup />,
  },
  {
    id: "cohorts",
    title: "Cohorts",
    description: "Cohorts group members who joined the programme together.",
    content: <Cohorts />,
  },
  {
    id: "tracks",
    title: "Tracks",
    description: "Tracks classify members by their YALI programme track.",
    content: <Tracks />,
  },
  {
    id: "working-sectors",
    title: "Working sectors",
    description: "Sectors used to describe where members and organizations work.",
    content: <WorkingSector />,
  },
];

export default function DataPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Data management</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Manage the reference data and notification templates used across the application.
        </p>
      </header>

      <OnlyAdmin>
        <div className="flex flex-col gap-10">
          {sections.map((section) => (
            <section key={section.id} aria-labelledby={section.id}>
              <div className="mb-3">
                <h2 id={section.id} className="text-lg font-semibold text-foreground">
                  {section.title}
                </h2>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>
              {section.content}
            </section>
          ))}
        </div>
      </OnlyAdmin>
    </div>
  );
}