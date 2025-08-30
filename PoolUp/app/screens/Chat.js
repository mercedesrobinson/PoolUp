import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { colors, radius } from '../theme';
import { api } from '../services/api';
import io from 'socket.io-client';

const SERVER = process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:4000';

export default function Chat({ route }){
  const { user, poolId } = route.params;
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');

  const load = async ()=>{
    const m = await api.messages(poolId);
    setMessages(m);
  };

  useEffect(()=>{ load(); },[]);

  useEffect(()=>{
    const s = io(SERVER, { transports:['websocket'] });
    s.emit('room:join', poolId);
    s.on('message:new', (msg)=>{
      if(msg.poolId === poolId) setMessages(prev => [...prev, msg]);
    });
    setSocket(s);
    return ()=> s.disconnect();
  },[]);

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
        <TextInput value={body} onChangeText={setBody} placeholder="Write a message" style={{ flex:1, backgroundColor:'#f5f7fb', padding:14, borderRadius:radius }} />
        <TouchableOpacity onPress={send} style={{ backgroundColor: colors.green, paddingVertical:14, paddingHorizontal:16, borderRadius:radius }}>
          <Text style={{ color:'white', fontWeight:'700' }}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
