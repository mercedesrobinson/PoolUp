import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import MoneyApi from '../services/moneyApi';

const PlaidLink = ({ userId, onSuccess, onExit, style }) => {
  const [linkToken, setLinkToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState('');

  useEffect(() => {
    createLinkToken();
  }, [userId]);

  const createLinkToken = async () => {
    try {
      setLoading(true);
      const response = await MoneyApi.createLinkToken(userId);
      setLinkToken(response.link_token);
    } catch (error) {
      console.error('Error creating link token:', error);
      Alert.alert('Error', 'Failed to initialize bank linking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openPlaidLink = () => {
    if (!linkToken) {
      Alert.alert('Error', 'Link token not ready. Please wait and try again.');
      return;
    }

    // For React Native, we'll use a WebView to display Plaid Link
    // In production, you'd use the official Plaid React Native SDK
    const plaidUrl = `https://cdn.plaid.com/link/v2/stable/link.html?link_token=${linkToken}&is_mobile_app=true`;
    setWebViewUrl(plaidUrl);
    setShowWebView(true);
  };

  const handleWebViewMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'success') {
        setShowWebView(false);
        
        try {
          const response = await MoneyApi.exchangePublicToken(
            data.public_token,
            data.metadata.institution.institution_id,
            data.metadata.institution.name
          );
          
          if (onSuccess) {
            onSuccess(response);
          }
          
          Alert.alert('Success', 'Bank account linked successfully!');
        } catch (error) {
          console.error('Error exchanging token:', error);
          Alert.alert('Error', 'Failed to link bank account. Please try again.');
        }
      } else if (data.type === 'exit') {
        setShowWebView(false);
        if (onExit) {
          onExit(data.error);
        }
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const injectedJavaScript = `
    window.addEventListener('message', function(event) {
      if (event.data.type === 'success' || event.data.type === 'exit') {
        window.ReactNativeWebView.postMessage(JSON.stringify(event.data));
      }
    });
    true;
  `;

  if (showWebView) {
    return (
      <View style={styles.webViewContainer}>
        <View style={styles.webViewHeader}>
          <Text style={styles.webViewTitle}>Link Your Bank Account</Text>
          <TouchableOpacity 
            onPress={() => setShowWebView(false)}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        <WebView
          source={{ uri: webViewUrl }}
          style={styles.webView}
          injectedJavaScript={injectedJavaScript}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading Plaid Link...</Text>
            </View>
          )}
        />
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.linkButton, style]}
      onPress={openPlaidLink}
      disabled={loading || !linkToken}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Text style={styles.linkButtonText}>
          🏦 Link Bank Account
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  linkButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  linkButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webViewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
  },
  webViewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666666',
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
});

export default PlaidLink;
