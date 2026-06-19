import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather, AntDesign } from '@expo/vector-icons';

interface TaskProps {
  text: string;
  updateMode: () => void;
  deleteTask: () => void;
}

const Task: React.FC<TaskProps> = ({ text, updateMode, deleteTask }) => {
  return (
    <View className="bg-white rounded-lg shadow-md p-4 mt-4 flex-row items-center justify-between">
      <Text className="text-gray-900 text-base flex-1">{text}</Text>
      <View className="flex-row space-x-4 ml-4">
        <TouchableOpacity onPress={updateMode} className="p-2">
          <Feather name="edit" size={20} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity onPress={deleteTask} className="p-2">
          <AntDesign name="delete" size={20} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Task;
