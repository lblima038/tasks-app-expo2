import React from 'react';
import { View } from 'react-native';
import { Text as GText, Heading } from '@gluestack-ui/react';

const EmptyState: React.FC = () => (
  <View className="flex-1 items-center justify-center p-4">
    <Heading>Sem tarefas</Heading>
    <GText className="text-gray-500 mt-2">Nenhuma tarefa encontrada. Adicione sua primeira tarefa.</GText>
  </View>
);

export default EmptyState;
