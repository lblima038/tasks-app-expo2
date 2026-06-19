import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar as RNStatusBar,
  Image,
  Pressable,
  ActivityIndicator,
  Modal,
  Button,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { Input as GInput, Button as GButton, ButtonText as GButtonText, AlertDialog as GAlertDialog, Text as GText, Heading } from '@gluestack-ui/react';
import { Alert } from 'react-native';
import Checkbox from 'expo-checkbox';
import DateTimePicker from '@react-native-community/datetimepicker';
import TaskList from './src/components/TaskList';
import EmptyState from './src/components/EmptyState';
import LoginScreen from './src/components/LoginScreen';
import SignupScreen from './src/components/SignupScreen';
import {
  addTask,
  deleteTask,
  getAllTasks,
  updateTask,
  setAuthToken,
  signup,
  login,
  TaskItem,
  setUnauthorizedCallback,
} from './src/utils/handle-api';
import { globalStyles } from './src/styles/global';
import AboutScreen from './src/components/AboutScreen';

const STORAGE_TOKEN = 'sessionToken';
const STORAGE_EMAIL = 'userEmail';

export default function App() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [text, setText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [taskId, setTaskId] = useState('');
  const [taskLoading, setTaskLoading] = useState(true);
  const [logoError, setLogoError] = useState(false);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');

  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [priority, setPriority] = useState<'Baixa' | 'Média' | 'Alta'>('Baixa');

  const [sessionToken, setSessionTokenState] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [screen, setScreen] = useState<'login' | 'signup' | 'tasks'>('login');

  useEffect(() => {
    const loadSession = async () => {
      try {
        const token = await AsyncStorage.getItem(STORAGE_TOKEN);
        const email = await AsyncStorage.getItem(STORAGE_EMAIL);
        if (token) {
          setSessionTokenState(token);
          setAuthToken(token);
          setUserEmail(email);
          setScreen('tasks');
        }
      } catch (error) {
        console.log('Erro ao carregar sessão:', error);
      } finally {
        setIsSessionLoading(false);
      }
    };

    loadSession();
  }, []);

  useEffect(() => {
    if (screen === 'tasks' && sessionToken) {
      getAllTasks(setTasks, setTaskLoading);
    }
  }, [screen, sessionToken]);

  const resetForm = () => {
    setText('');
    setCompleted(false);
    setDueDate(null);
    setPriority('Baixa');
    setIsUpdating(false);
    setTaskId('');
    setModalVisible(false);
  };

  const updateMode = (task: TaskItem) => {
    setIsUpdating(true);
    setTaskId(task._id);
    setText(task.text);
    setCompleted(!!task.completed);
    setDueDate(task.dueDate ? new Date(task.dueDate) : null);
    setModalVisible(true);
  };

  const handleSave = () => {
    const formattedDate = dueDate ? dueDate.toISOString() : null;
    if (isUpdating) {
      updateTask(taskId, text, completed, formattedDate, setTasks, resetForm);
    } else {
      addTask(text, completed, formattedDate, setTasks, resetForm);
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Confirmar', 'Tem certeza que deseja excluir esta tarefa?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => deleteTask(id, setTasks) },
    ]);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove([STORAGE_TOKEN, STORAGE_EMAIL]);
    } catch (error) {
      console.log('Erro ao limpar sessão:', error);
    }
    setSessionTokenState(null);
    setUserEmail(null);
    setAuthToken(null);
    setTasks([]);
    setScreen('login');
  };

  useEffect(() => {
    setUnauthorizedCallback(handleLogout);
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setAuthError(null);
    setAuthLoading(true);

    try {
      const response = await login(email, password);
      const { token, user } = response.data;

      setSessionTokenState(token);
      setUserEmail(user.email);
      setAuthToken(token);
      await AsyncStorage.setItem(STORAGE_TOKEN, token);
      await AsyncStorage.setItem(STORAGE_EMAIL, user.email);
      setScreen('tasks');
      setTaskLoading(true);
      getAllTasks(setTasks, setTaskLoading);
    } catch (error: any) {
      const message =
        error?.response?.data?.error ||
        error?.message ||
        'Erro ao autenticar. Verifique suas credenciais.';
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignup = async (email: string, password: string) => {
    setAuthError(null);
    setAuthLoading(true);

    try {
      const response = await signup(email, password);
      const { token, user } = response.data;

      setSessionTokenState(token);
      setUserEmail(user.email);
      setAuthToken(token);
      await AsyncStorage.setItem(STORAGE_TOKEN, token);
      await AsyncStorage.setItem(STORAGE_EMAIL, user.email);
      setScreen('tasks');
      setTaskLoading(true);
      getAllTasks(setTasks, setTaskLoading);
    } catch (error: any) {
      const message =
        error?.response?.data?.error ||
        error?.message ||
        'Erro ao criar conta. Tente novamente.';
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  const renderAuthScreen = () => {
    if (screen === 'signup') {
      return (
        <SignupScreen
          onSignup={handleSignup}
          onSwitchScreen={() => setScreen('login')}
          loading={authLoading}
          error={authError ?? undefined}
        />
      );
    }

    return (
      <LoginScreen
        onLogin={handleLogin}
        onSwitchScreen={() => setScreen('signup')}
        loading={authLoading}
        error={authError ?? undefined}
      />
    );
  };

  if (isSessionLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Carregando sessão...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!sessionToken) {
    return renderAuthScreen();
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100" style={Platform.OS === 'android' ? { paddingTop: RNStatusBar.currentHeight } : undefined}>
      <View className="flex-1 max-w-[600px] w-full self-center px-4">
        <View style={styles.headerContainer}>
          {logoError ? (
            <Text style={styles.header}>Gerenciador de Tarefas</Text>
          ) : (
            <Image
              source={require('./assets/task-app-banner.png')}
              style={styles.logo}
              onError={() => setLogoError(true)}
            />
          )}
          {!logoError && <Text style={styles.header}>Tarefas</Text>}
        </View>

        <View style={styles.sessionContainer}>
          <View>
            <Text style={styles.welcomeText}>Olá, {userEmail ?? 'usuário'}!</Text>
            <Text style={styles.sessionSubtitle}>Acesse suas tarefas protegidas.</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>Total de Tarefas: {tasks.length}</Text>
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' ? styles.filterButtonActive : styles.filterButtonInactive]}
            onPress={() => setFilter('all')}
          >
            <Text style={filter === 'all' ? styles.filterTextActive : styles.filterTextInactive}>Todas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'completed' ? styles.filterButtonActive : styles.filterButtonInactive]}
            onPress={() => setFilter('completed')}
          >
            <Text style={filter === 'completed' ? styles.filterTextActive : styles.filterTextInactive}>Concluídas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'pending' ? styles.filterButtonActive : styles.filterButtonInactive]}
            onPress={() => setFilter('pending')}
          >
            <Text style={filter === 'pending' ? styles.filterTextActive : styles.filterTextInactive}>Pendentes</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionButtonsContainer}>
          <GButton onPress={() => setModalVisible(true)} className="flex-1 mr-2">
            <GButtonText>Nova Tarefa</GButtonText>
          </GButton>

          <GButton onPress={() => setTasks([])} className="flex-1 ml-2" colorScheme="danger">
            <GButtonText>Excluir todas</GButtonText>
          </GButton>
        </View>

        <View style={styles.aboutButtonContainer}>
          <Button title="Sobre o App" onPress={() => setAboutModalVisible(true)} />
        </View>

        {(() => {
          const filtered = tasks.filter((t) => {
            if (filter === 'completed') return t.completed;
            if (filter === 'pending') return !t.completed;
            return true;
          });
          return filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <TaskList
              tasks={filtered}
              onUpdate={updateMode}
              onDelete={confirmDelete}
            />
          );
        })()}

        {taskLoading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        )}
      </View>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={resetForm}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{isUpdating ? 'Editar Tarefa' : 'Nova Tarefa'}</Text>

            <GInput
              placeholder="Nome da tarefa..."
              value={text}
              maxLength={50}
              onChangeText={setText}
            />

            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Data limite:</Text>
              {Platform.OS === 'web' ? (
                // @ts-ignore
                <input
                  type="date"
                  value={dueDate ? dueDate.toISOString().split('T')[0] : ''}
                  onChange={(e: any) => {
                    const val = e.target.value;
                    if (val) {
                      const parts = val.split('-');
                      setDueDate(new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
                    } else {
                      setDueDate(null);
                    }
                  }}
                  style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', flex: 1, marginLeft: 16 }}
                />
              ) : (
                <View style={{ flex: 1, marginLeft: 16, alignItems: 'flex-start' }}>
                  <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerBtn}>
                    <Text>{dueDate ? dueDate.toLocaleDateString() : 'Selecionar Data'}</Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker value={dueDate || new Date()} mode="date" display="default" onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) setDueDate(selectedDate);
                    }} />
                  )}
                </View>
              )}
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Concluída:</Text>
              <View style={styles.checkboxContainer}>
                <Checkbox value={completed} onValueChange={setCompleted} color={completed ? '#000' : undefined} />
              </View>
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Prioridade:</Text>
              <View style={styles.priorityContainer}>
                {['Baixa', 'Média', 'Alta'].map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityButton,
                      priority === p && {
                        backgroundColor: p === 'Baixa' ? '#4caf50' : p === 'Média' ? '#ff9800' : '#f44336',
                        borderColor: p === 'Baixa' ? '#4caf50' : p === 'Média' ? '#ff9800' : '#f44336',
                      },
                    ]}
                    onPress={() => setPriority(p as any)}
                  >
                    <Text style={[styles.priorityText, priority === p && styles.priorityTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={resetForm}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, !text.trim() && styles.modalSaveBtnDisabled]}
                onPress={handleSave}
                disabled={!text.trim()}
              >
                <Text style={styles.modalSaveText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={aboutModalVisible} animationType="slide" onRequestClose={() => setAboutModalVisible(false)}>
        <AboutScreen onClose={() => setAboutModalVisible(false)} />
      </Modal>

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: globalStyles.backgroundColor,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555',
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  header: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
  },
  sessionContainer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sessionSubtitle: {
    color: '#666',
  },
  logoutButton: {
    backgroundColor: '#ff4d4d',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  counterContainer: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterText: {
    fontSize: globalStyles.bodyFontSize,
    color: '#666',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterButtonActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  filterButtonInactive: {
    backgroundColor: 'transparent',
    borderColor: '#000',
  },
  filterTextActive: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  filterTextInactive: {
    color: '#000',
    fontSize: 14,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  aboutButtonContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    flex: 1,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  actionButtonAdd: {
    backgroundColor: globalStyles.primaryColor,
    shadowColor: globalStyles.primaryColor,
  },
  actionButtonAddPressed: {
    backgroundColor: '#333',
    transform: [{ scale: 0.98 }],
    elevation: 1,
    shadowOpacity: 0.1,
  },
  deleteButton: {
    backgroundColor: '#ff4d4d',
    shadowColor: '#ff0000',
  },
  deleteButtonPressed: {
    backgroundColor: '#d9363e',
    transform: [{ scale: 0.98 }],
    elevation: 1,
    shadowOpacity: 0.1,
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  fieldLabel: {
    fontWeight: 'bold',
  },
  checkboxContainer: {
    marginLeft: 16,
  },
  datePickerBtn: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    width: '100%',
    alignItems: 'center',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 16,
  },
  priorityButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  priorityText: {
    color: '#333',
    fontWeight: 'bold',
  },
  priorityTextActive: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  modalCancelBtn: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  modalCancelText: {
    color: '#333',
    fontWeight: 'bold',
  },
  modalSaveBtn: {
    backgroundColor: '#000',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  modalSaveBtnDisabled: {
    backgroundColor: '#999',
  },
  modalSaveText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
