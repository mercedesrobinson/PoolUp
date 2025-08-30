import React from 'react';
import { View, Text, AppRegistry } from 'react-native';

function App(){
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
       <Image 
        source={require('./assets/poolup-logo.png')}   // 👈 put your logo file in /assets
        style={{ width: 120, height: 120, marginBottom: 12 }} 
        resizeMode="contain"
      />
      <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#0B1221', marginBottom: 12 }}>💰 PoolUp</Text>
      <Text style={{ fontSize: 16, color: '#566', textAlign: 'center' }}>Your future, funded with friends.</Text>
      <Text style={{ fontSize: 14, color: '#999', marginTop: 20 }}>Testing without navigation...</Text>
    </View>
  );
}

AppRegistry.registerComponent('main', () => App);

export default App;
