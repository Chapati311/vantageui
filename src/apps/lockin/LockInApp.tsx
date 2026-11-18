import { useState } from 'react';
import { CircleButton } from '../../components/CircleButton';
import { LockIcon, MoonIcon } from '../../components/glyphs';
import { AppShell, SegmentedControl, TabBar } from '../../components/kit';
import { LockInIcon } from '../../system/appIcons';
import { BlockingPage } from './BlockingPage';
import { FocusTab } from './FocusTab';
import { GradesView, SubjectSheet } from './GradesView';
import { useLockIn } from './lockInStore';
import { ExamsView, HomeworkView, ProjectsView, TasksView, TimetableView } from './PlannerViews';
import { Setup } from './Setup';
import { StatsTab } from './StatsTab';
import { WindDownTab } from './WindDownTab';
import { CalendarIcon, ListIcon } from './icons';

type Tab = 'focus' | 'school' | 'winddown' | 'stats';
type SchoolView = 'grades' | 'timetable' | 'homework' | 'exams';
type WorkView = 'tasks' | 'projects';

/** Lock In: Focus, School (or Work), Wind Down and Stats. */
export function LockInApp() {
  const data = useLockIn();
  const [tab, setTab] = useState<Tab>('focus');
  const [schoolView, setSchoolView] = useState<SchoolView>('grades');
  const [workView, setWorkView] = useState<WorkView>('tasks');
  const [blocking, setBlocking] = useState(false);
  const [addingProject, setAddingProject] = useState(false);

  if (!data.setupDone) return <Setup />;
  if (blocking) return <BlockingPage onBack={() => setBlocking(false)} />;

  const student = data.role === 'student';
  const titles: Record<Tab, string> = { focus: 'Lock In', school: student ? 'School' : 'Work', winddown: 'Wind Down', stats: 'Stats' };

  return (
    <AppShell
      title={titles[tab]}
      trailing={
        <CircleButton small label="App blocking" onClick={() => setBlocking(true)}>
          <LockIcon />
        </CircleButton>
      }
      header={
        tab === 'school' ? (
          student ? (
            <SegmentedControl
              label="School"
              value={schoolView}
              onChange={setSchoolView}
              options={[
                { id: 'grades', label: 'Grades' },
                { id: 'timetable', label: 'Week' },
                { id: 'homework', label: 'Homework' },
                { id: 'exams', label: 'Exams' },
              ]}
            />
          ) : (
            <SegmentedControl
              label="Work"
              value={workView}
              onChange={setWorkView}
              options={[
                { id: 'tasks', label: 'Tasks' },
                { id: 'projects', label: 'Projects' },
              ]}
            />
          )
        ) : undefined
      }
      tabBar={
        <TabBar
          tabs={[
            { id: 'focus', label: 'Focus', icon: LockInIcon },
            { id: 'school', label: student ? 'School' : 'Work', icon: student ? CalendarIcon : ListIcon },
            { id: 'winddown', label: 'Wind Down', icon: MoonIcon },
            { id: 'stats', label: 'Stats', icon: ListIcon },
          ]}
          value={tab}
          onChange={setTab}
        />
      }
    >
      {tab === 'focus' && <FocusTab />}
      {tab === 'school' && student && schoolView === 'grades' && <GradesView />}
      {tab === 'school' && student && schoolView === 'timetable' && <TimetableView />}
      {tab === 'school' && student && schoolView === 'homework' && <HomeworkView />}
      {tab === 'school' && student && schoolView === 'exams' && <ExamsView />}
      {tab === 'school' && !student && workView === 'tasks' && <TasksView />}
      {tab === 'school' && !student && workView === 'projects' && (
        <>
          <ProjectsView onAdd={() => setAddingProject(true)} />
          <SubjectSheet open={addingProject} onClose={() => setAddingProject(false)} label="project" />
        </>
      )}
      {tab === 'winddown' && <WindDownTab />}
      {tab === 'stats' && <StatsTab />}
    </AppShell>
  );
}
