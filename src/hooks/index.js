/* eslint-disable no-nested-ternary */

import dayjs from 'dayjs';
import { useState, useEffect } from 'react';
/* import { unstable_concurrentAct } from 'react-dom/test-utils'; */
import { firebase } from '../firebase';
import { collatedTasksExist } from '../helpers';

export const useTasks = (selectedProject) => {
  const [tasks, setTasks] = useState([]);
  const [archivedTasks, setArchivedTasks] = useState([]);

  useEffect(() => {
    let unsubscribe = firebase
      .firestore()
      .collection('tasks')
      .where('userId', '==', 'forthetry');

    unsubscribe =
      selectedProject && collatedTasksExist(selectedProject)
        ? (unsubscribe = unsubscribe.where('projectId', '==', selectedProject))
        : selectedProject === 'TODAY'
        ? (unsubscribe = unsubscribe.where(
            'date',
            '==',
            dayjs().format('DD/MM/YYYY')
          ))
        : selectedProject === 'INBOX' || selectedProject === 0
        ? (unsubscribe = unsubscribe.where('date', '==', ''))
        : unsubscribe;

    unsubscribe = unsubscribe.onSnapshot((snapshot) => {
      const newTasks = snapshot.docs.map((task) => ({
        id: task.id,
        ...task.data(),
      }));
      setTasks(
        selectedProject === 'NEXT_7'
          ? newTasks.filter(
              (task) =>
                dayjs(task.date, 'DD-MM-YYYY').diff(dayjs(), 'days') <= 7 &&
                task.archived !== true
            )
          : newTasks.filter((task) => task.archived !== true)
      );
      setArchivedTasks(newTasks.filter((task) => task.archived !== false));
    });
    return () => unsubscribe();
  }, [selectedProject]);
  return { tasks, archivedTasks };
};

export const useProjects = () => {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    firebase
      .firestore()
      .collection('projects')
      .where('userId', '==', 'forthetry')
      .orderBy('projectId')
      .get()
      .then((snapshot) => {
        const allProjects = snapshot.docs.map((project) => ({
          ...project.data(),
          docId: project.id,
        }));
        if (JSON.stringify(allProjects) !== JSON.stringify(projects)) {
          setProjects(allProjects);
        }
      });
  }, [projects]);

  return { projects, setProjects };
};
