import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import io from 'socket.io-client';
import { getSocketUrl } from '../services/config';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

const SERVER = getSocketUrl(3001);

type ChatNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;
type ChatRouteProp = RouteProp<RootStackParamList, 'Chat'>;

interface Props {
  navigation: ChatNavigationProp;
  route: ChatRouteProp;
}

export default function Chat({ route }: Props): React.JSX.Element {
  const { user, poolId } = route?.params || {};
  const [socket, setSocket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [body, setBody] = useState<string>('');

  const load = async ()=>{
    const m = await api.messages(poolId);
    setMessages(m);
  };

  useEffect(()=>{ load(); },[]);

  useEffect(() => {
    const socket = io(SERVER, { transports: ['websocket'] });
    
    socket.on('message', (message) => {
      if(message.poolId === poolId) setMessages(prev => [...prev, message]);
    });
    
    return () => {
      socket.disconnect();
    };
  }, []);

  const send = async ()=>{
    if(!body.trim()) return;
    await api.sendMessage(poolId, { userId: user.id, body });
    setBody('');
  };

  return (
    <View style={{ flex:1, padding:16 }}>
      <FlatList
        data={messages}
        keyExtractor={m=>m.id}
        renderItem={({item})=>(
          <View style={{ alignSelf: item.user_id === user.id ? 'flex-end':'flex-start', backgroundColor: item.user_id === user.id ? colors.blue : colors.gray, padding:12, borderRadius:12, marginVertical:4, maxWidth:'80%' }}>
            <Text style={{ color: item.user_id === user.id ? 'white': colors.text }}>{item.body}</Text>
          </View>
        )}
      />
      <View style={{ flexDirection:'row', gap:8, alignItems:'center' }}>
        <TextInput value={body} onChangeText={setBody} placeholder="Write a message" style={{ flex:1, backgroundColor:'#f5f7fb', padding:14, borderRadius: radius.medium }} />
        <TouchableOpacity onPress={send} style={{ backgroundColor: colors.green, paddingVertical:14, paddingHorizontal:16, borderRadius: radius.medium }}>
          <Text style={{ color:'white', fontWeight:'700' }}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
