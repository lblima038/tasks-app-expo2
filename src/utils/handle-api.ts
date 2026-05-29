import axios from 'axios';
import { Platform } from 'react-native';
import React from 'react';

const defaultURL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
const baseURL = process.env.EXPO_PUBLIC_API_URL ?? defaultURL;
const api = axios.create({ baseURL });

let onUnauthorizedCallback: (() => void) | null = null;

export const setUnauthorizedCallback = (callback: () => void) => {
  onUnauthorizedCallback = callback;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }
    return Promise.reject(error);
  }
);

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export interface TaskItem {
  _id: string;
  text: string;
  completed?: boolean;
  dueDate?: string;
}

export const getAllTasks = (
  setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>,
  setLoading?: React.Dispatch<React.SetStateAction<boolean>>
) => {
  if (setLoading) setLoading(true);

  api
    .get<TaskItem[]>('/')
    .then(({ data }) => {
      setTasks(data);
      if (setLoading) setLoading(false);
    })
    .catch((err) => {
      console.log(err);
      if (setLoading) setLoading(false);
    });
};

export const addTask = (
  text: string,
  completed: boolean,
  dueDate: string | null,
  setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>,
  onSuccess: () => void
) => {
  api
    .post('/save', { text, completed, dueDate })
    .then(() => {
      onSuccess();
      getAllTasks(setTasks);
    })
    .catch((err) => console.log(err));
};

export const updateTask = (
  taskId: string,
  text: string,
  completed: boolean,
  dueDate: string | null,
  setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>,
  onSuccess: () => void
) => {
  api
    .post('/update', { _id: taskId, text, completed, dueDate })
    .then(() => {
      onSuccess();
      getAllTasks(setTasks);
    })
    .catch((err) => console.log(err));
};

export const deleteTask = (
  _id: string,
  setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>
) => {
  api
    .post('/delete', { _id })
    .then(() => {
      getAllTasks(setTasks);
    })
    .catch((err) => console.log(err));
};

export const signup = (email: string, password: string) =>
  api.post('/api/auth/signup', { email, password });

export const login = (email: string, password: string) =>
  api.post('/api/auth/login', { email, password });

export const logout = () => api.post('/api/auth/logout');
